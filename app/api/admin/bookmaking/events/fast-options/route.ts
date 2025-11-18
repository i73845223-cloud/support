import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'

export async function PATCH(request: Request) {
  try {
    const user = await currentUser()
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { eventId, isFirstFastOption, isSecondFastOption } = await request.json()

    if (!eventId) {
      return new NextResponse("Event ID is required", { status: 400 })
    }

    // Get the event to find its book
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: { book: true }
    })

    if (!event) {
      return new NextResponse("Event not found", { status: 404 })
    }

    // If setting as first fast option, clear other first positions in same book
    if (isFirstFastOption) {
      await db.event.updateMany({
        where: { 
          bookId: event.bookId,
          isFirstFastOption: true,
          id: { not: eventId }
        },
        data: { isFirstFastOption: false }
      })
    }

    // If setting as second fast option, clear other second positions in same book
    if (isSecondFastOption) {
      await db.event.updateMany({
        where: { 
          bookId: event.bookId,
          isSecondFastOption: true,
          id: { not: eventId }
        },
        data: { isSecondFastOption: false }
      })
    }

    // Update the event
    const updatedEvent = await db.event.update({
      where: { id: eventId },
      data: {
        isFirstFastOption,
        isSecondFastOption
      },
      include: {
        homeTeam: true,
        awayTeam: true,
        outcomes: true
      }
    })

    return NextResponse.json(updatedEvent)
  } catch (error) {
    console.log('[FAST_OPTIONS_PATCH]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}