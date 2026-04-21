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
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: eventId } = params
    const body = await req.json()
    const { winningOutcomeId } = body

    console.log(`📌 Settling event ${eventId} with winning outcome ${winningOutcomeId}`)

    if (!winningOutcomeId) {
      return NextResponse.json({ error: 'Winning outcome ID is required' }, { status: 400 })
    }

    const result = await db.$transaction(async (tx) => {
      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: { outcomes: true, book: true }
      })

      if (!event) {
        throw new Error('Event not found')
      }

      const winningOutcome = event.outcomes.find(o => o.id === winningOutcomeId)
      if (!winningOutcome) {
        throw new Error('Winning outcome not found in this event')
      }

      console.log(`✅ Event: ${event.name}, winning: ${winningOutcome.name}`)

      const pendingBets = await tx.bet.findMany({
        where: { eventId, status: 'PENDING' },
        include: {
          outcome: true,
          user: { select: { id: true, name: true, email: true } },
          transaction: true
        }
      })

      console.log(`📊 Processing ${pendingBets.length} pending bets`)

      for (const bet of pendingBets) {
        const isWinner = bet.outcomeId === winningOutcomeId
        const newStatus = isWinner ? 'WON' : 'LOST'

        const currentBet = await tx.bet.findUnique({
          where: { id: bet.id },
          select: { status: true }
        })

        if (!currentBet || currentBet.status !== 'PENDING') {
          console.log(`⏭️ Bet ${bet.id} already settled, skipping`)
          continue
        }

        await tx.bet.update({
          where: { id: bet.id },
          data: { status: newStatus, settledAt: new Date() }
        })

        if (isWinner && bet.transaction) {
          if (bet.transaction.status === 'pending') {
            await tx.transaction.update({
              where: { id: bet.transaction.id },
              data: {
                status: 'success',
                description: `WON: ${event.name} - ${bet.outcome.name}`
              }
            })
            console.log(`💰 Win transaction ${bet.transaction.id} marked success`)
          }
        }

        try {
          const userPromo = await tx.userPromoCode.findFirst({
            where: { userId: bet.userId },
            include: {
              promoCode: {
                include: { 
                  assignedUser: {
                    select: { id: true } 
                  }
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          })

          const promoCode = userPromo?.promoCode

          if (
            promoCode?.assignedUserId &&
            promoCode.assignedUser &&
            promoCode.commissionPercentage &&
            promoCode.commissionPercentage > 0
          ) {
            const betAmount = Number(bet.amount)
            const commissionPercentage = Number(promoCode.commissionPercentage)
            const commissionAmount = betAmount * (commissionPercentage / 100)

            console.log(`💸 Commission: ${commissionAmount} to influencer ${promoCode.assignedUserId}`)

            const stakeTransaction = await tx.transaction.findFirst({
              where: {
                userId: bet.userId,
                category: 'betting-stake',
                description: { contains: event.name }
              },
              orderBy: { createdAt: 'desc' }
            })

            await tx.influencerEarning.create({
              data: {
                amount: commissionAmount,
                description: `${commissionPercentage}% commission from bet stake via ${promoCode.code}`,
                type: 'BET_COMMISSION',
                influencerId: promoCode.assignedUserId,
                sourceUserId: bet.userId,
                withdrawalId: stakeTransaction?.id,
                promoCodeId: promoCode.id
              }
            })

            await tx.transaction.create({
              data: {
                userId: promoCode.assignedUserId,
                amount: commissionAmount,
                type: 'deposit',
                status: 'success',
                description: `Commission from bet stake via ${promoCode.code}`,
                category: 'commission'
              }
            })

            console.log(`✅ Commission credited`)
          }
        } catch (commissionError) {
          console.error(`❌ Commission error for bet ${bet.id}:`, commissionError)
          throw commissionError
        }
      }

      await tx.event.update({
        where: { id: eventId },
        data: { status: 'COMPLETED' }
      })

      await tx.outcome.update({
        where: { id: winningOutcomeId },
        data: { result: 'WIN' }
      })

      await tx.outcome.updateMany({
        where: { eventId, id: { not: winningOutcomeId } },
        data: { result: 'LOSE' }
      })

      return { eventId, winningOutcome: winningOutcome.name }
    }, { timeout: 30000 })

    console.log(`🎉 Event ${eventId} settled successfully`)
    return NextResponse.json({
      success: true,
      message: 'Bets settled successfully',
      data: result
    })

  } catch (error: any) {
    console.error('💥 [SETTLE_EVENT] FATAL ERROR:', error)
    return NextResponse.json(
      {
        error: error.message || 'Settlement failed',
        code: error.code,
        meta: process.env.NODE_ENV === 'development' ? error.meta : undefined
      },
      { status: 500 }
    )
  }
}