import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const events = await db.event.findMany({
      include: {
        book: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        outcomes: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        bets: {
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json(events)
  } catch (error) {
    console.log('[EVENTS_GET]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}