import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const liveBooks = await db.book.findMany({
      where: { date: { gte: new Date() } },
      include: {
        bets: { select: { id: true } },
        events: {
          include: {
            outcomes: {
              include: { bets: { select: { id: true } } }
            }
          }
        }
      }
    })

    const booksWithNoStakes = liveBooks.filter(book => {
      if (book.bets.length > 0) return false
      return !book.events.some(event =>
        event.outcomes.some(outcome => outcome.bets.length > 0)
      )
    })

    if (booksWithNoStakes.length === 0) {
      return NextResponse.json({ deleted: 0 })
    }

    const deleted = await db.book.deleteMany({
      where: { id: { in: booksWithNoStakes.map(b => b.id) } }
    })

    console.log(`Deleted ${deleted.count} empty live books`)
    return NextResponse.json({ deleted: deleted.count })
  } catch (error) {
    console.error(error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}