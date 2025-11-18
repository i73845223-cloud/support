import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const user = await currentUser()
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { id: eventId } = params
    const { winningOutcomeId } = await req.json()

    if (!winningOutcomeId) {
      return new NextResponse("Winning outcome ID is required", { status: 400 })
    }

    const result = await db.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: {
          outcomes: true,
          book: true
        }
      })

      if (!event) {
        throw new Error('Event not found')
      }

      const winningOutcome = event.outcomes.find(o => o.id === winningOutcomeId)
      if (!winningOutcome) {
        throw new Error('Winning outcome not found in this event')
      }

      const pendingBets = await tx.bet.findMany({
        where: {
          eventId: eventId,
          status: 'PENDING'
        },
        include: {
          outcome: true,
          user: {
            select: { id: true, name: true, email: true }
          },
          transaction: true
        }
      })


      for (const bet of pendingBets) {

        const isWinner = bet.outcomeId === winningOutcomeId
        const newStatus = isWinner ? 'WON' : 'LOST'

        const currentBet = await tx.bet.findUnique({
          where: { id: bet.id },
          select: { status: true }
        })

        if (!currentBet) {
          continue
        }

        if (currentBet.status !== 'PENDING') {
          continue
        }

        await tx.bet.update({
          where: { id: bet.id },
          data: {
            status: newStatus,
            settledAt: new Date()
          }
        })

        if (isWinner) {
          if (bet.transaction) {
            if (bet.transaction.status === 'pending') {
              await tx.transaction.update({
                where: { id: bet.transaction.id },
                data: {
                  status: 'success',
                  description: `WON: ${event.name} - ${bet.outcome.name}`
                }
              })
          }
        }
      }}

      await tx.event.update({
        where: { id: eventId },
        data: { status: 'COMPLETED' }
      })

      await tx.outcome.update({
        where: { id: winningOutcomeId },
        data: { result: 'WIN' }
      })

      await tx.outcome.updateMany({
        where: { 
          eventId: eventId,
          id: { not: winningOutcomeId }
        },
        data: { result: 'LOSE' }
      })

      return {
        eventId,
        winningOutcome: winningOutcome.name
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Bets settled successfully',
      data: result
    })

  } catch (error: any) {
    
    if (error.message === 'Event not found') {
      return new NextResponse("Event not found", { status: 404 })
    }
    if (error.message === 'Winning outcome not found in this event') {
      return new NextResponse("Winning outcome not found in this event", { status: 400 })
    }

    return new NextResponse(
      `Settlement failed: ${error.message || 'Unknown error'}`,
      { status: 500 }
    )
  }
}