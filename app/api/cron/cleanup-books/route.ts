import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ⚠️ SET THIS TO TRUE ONLY AFTER YOU'VE VERIFIED THE LIST
const ACTUALLY_DELETE = false

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    // 1. Get all live books (adjust date condition if you have a status field)
    const liveBooks = await db.book.findMany({
      where: {
        date: { gte: new Date() }
      },
      include: {
        // Direct bets on the book
        bets: {
          select: { id: true }
        },
        // Events and their outcome bets
        events: {
          include: {
            outcomes: {
              include: {
                bets: {
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    })

    // 2. Separate books with stakes vs. no stakes
    const booksWithStakes: any[] = []
    const booksWithNoStakes: any[] = []

    liveBooks.forEach(book => {
      const hasBookBets = book.bets.length > 0
      const hasOutcomeBets = book.events.some(event =>
        event.outcomes.some(outcome => outcome.bets.length > 0)
      )

      if (hasBookBets || hasOutcomeBets) {
        booksWithStakes.push(book)
      } else {
        booksWithNoStakes.push(book)
      }
    })

    // 3. Log the results
    console.log(`📊 LIVE BOOKS: ${liveBooks.length}`)
    console.log(`✅ Books WITH stakes: ${booksWithStakes.length}`)
    console.log(`🗑️ Books with NO stakes (to be deleted): ${booksWithNoStakes.length}`)

    // 4. If we're not actually deleting, return a detailed report
    if (!ACTUALLY_DELETE) {
      const preview = booksWithNoStakes.slice(0, 5).map(b => ({
        id: b.id,
        title: b.title,
        date: b.date
      }))

      return NextResponse.json({
        dryRun: true,
        totalLiveBooks: liveBooks.length,
        booksWithStakes: booksWithStakes.length,
        booksWithNoStakes: booksWithNoStakes.length,
        previewOfBooksToDelete: preview,
        message: 'Dry run completed. No books were deleted. Set ACTUALLY_DELETE=true to perform deletion.'
      })
    }

    // 5. Perform actual deletion (only if ACTUALLY_DELETE = true)
    if (booksWithNoStakes.length === 0) {
      return NextResponse.json({ deleted: 0 })
    }

    const deleted = await db.book.deleteMany({
      where: {
        id: { in: booksWithNoStakes.map(b => b.id) }
      }
    })

    console.log(`✅ Deleted ${deleted.count} empty live books`)
    return NextResponse.json({
      dryRun: false,
      deleted: deleted.count
    })

  } catch (error) {
    console.error('❌ Cleanup error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}