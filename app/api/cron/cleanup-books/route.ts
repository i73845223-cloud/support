import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const expectedToken = process.env.CRON_SECRET

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const liveBooks = await db.book.findMany({
      where: {
        date: { gte: new Date() }
      },
      include: {
        events: {
          include: {
            outcomes: {
              include: {
                bets: { select: { id: true } }
              }
            }
          }
        },
        bets: { select: { id: true } }
      }
    })

    const booksToDelete = liveBooks.filter(book => {
      if (book.bets.length > 0) return false
      const hasEventBets = book.events.some(event =>
        event.outcomes.some(outcome => outcome.bets.length > 0)
      )
      return !hasEventBets
    })

    if (booksToDelete.length === 0) {
      return NextResponse.json({ deleted: 0, message: 'No empty books found' })
    }

    const deleted = await db.book.deleteMany({
      where: { id: { in: booksToDelete.map(b => b.id) } }
    })

    console.log(`🧹 Cron cleanup: deleted ${deleted.count} empty live books`)
    return NextResponse.json({ deleted: deleted.count })
  } catch (error) {
    console.error('❌ Cron cleanup error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}