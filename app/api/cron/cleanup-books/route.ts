import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ⚠️ SET TO TRUE ONLY AFTER DRY RUN VERIFICATION
const ACTUALLY_DELETE = false

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const now = new Date()

    // Fetch all books that could be live (not SETTLED/CANCELLED)
    const candidateBooks = await db.book.findMany({
      where: {
        status: { notIn: ['SETTLED', 'CANCELLED'] }
      },
      include: {
        bets: { select: { id: true } },
        events: {
          include: {
            outcomes: {
              include: {
                bets: { select: { id: true } }
              }
            }
          }
        }
      }
    })

    // Apply the same "live" logic as the dashboard
    const liveBooks = candidateBooks.filter(book => {
      const bookDate = new Date(book.date)
      const hasPending = book.events.some(ev =>
        ev.outcomes.some(o => o.result === 'PENDING')
      )
      // LIVE = date <= now AND has pending outcomes
      return bookDate <= now && hasPending
    })

    // Separate books with stakes vs no stakes
    const booksWithStakes: any[] = []
    const booksWithNoStakes: any[] = []

    liveBooks.forEach(book => {
      const hasBookBets = book.bets.length > 0
      const hasOutcomeBets = book.events.some(ev =>
        ev.outcomes.some(o => o.bets.length > 0)
      )

      if (hasBookBets || hasOutcomeBets) {
        booksWithStakes.push(book)
      } else {
        booksWithNoStakes.push(book)
      }
    })

    console.log(`📊 Total candidate books (not settled/cancelled): ${candidateBooks.length}`)
    console.log(`🎯 LIVE books (date <= now + pending outcomes): ${liveBooks.length}`)
    console.log(`✅ Live books WITH stakes: ${booksWithStakes.length}`)
    console.log(`🗑️ Live books with NO stakes (to delete): ${booksWithNoStakes.length}`)

    // Log details for verification
    if (liveBooks.length > 0) {
      console.log('\n📋 LIVE BOOKS DETAILS:')
      liveBooks.forEach(b => {
        const stake = b.bets.length + b.events.reduce((s, e) => s + e.outcomes.reduce((oSum, o) => oSum + o.bets.length, 0), 0)
        console.log(`  - ${b.title} | Date: ${b.date} | Stakes: ${stake}`)
      })
    }

    if (!ACTUALLY_DELETE) {
      const preview = booksWithNoStakes.slice(0, 5).map(b => ({
        id: b.id,
        title: b.title,
        date: b.date
      }))

      return NextResponse.json({
        dryRun: true,
        totalCandidateBooks: candidateBooks.length,
        liveBooksCount: liveBooks.length,
        booksWithStakes: booksWithStakes.length,
        booksWithNoStakes: booksWithNoStakes.length,
        previewOfBooksToDelete: preview,
        message: 'Dry run completed. Set ACTUALLY_DELETE=true to perform deletion.'
      })
    }

    // Actual deletion
    if (booksWithNoStakes.length === 0) {
      return NextResponse.json({ deleted: 0 })
    }

    const deleted = await db.book.deleteMany({
      where: { id: { in: booksWithNoStakes.map(b => b.id) } }
    })

    console.log(`✅ Deleted ${deleted.count} empty live books`)
    return NextResponse.json({ deleted: deleted.count })

  } catch (error) {
    console.error('❌ Cleanup error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}