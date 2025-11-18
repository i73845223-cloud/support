import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'
import { sportsDataService } from '@/lib/sports-api'

function mapSportToCategory(sportKey: string): string {
  const categoryMap: { [key: string]: string } = {
    'cricket': 'Cricket',
    'soccer': 'Football',
    'basketball': 'Basketball',
    'tennis': 'Tennis',
    'baseball': 'Baseball',
    'icehockey': 'Hockey',
    'rugby': 'Rugby',
    'boxing': 'Boxing',
    'mma': 'MMA',
    'esports': 'Esports'
  }
  return categoryMap[sportKey] || 'Other'
}

export async function POST(req: Request) {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sport, tournament, autoCreateMultiple = false } = await req.json()

    const sportsEvents = await sportsDataService.getRealEvents(sport)
    
    let eventsToProcess = sportsEvents
    
    if (tournament && tournament.trim() !== '') {
      eventsToProcess = sportsEvents.filter(event => {
        const searchTerm = tournament.toLowerCase().trim()
        
        const tournamentMatch = event.tournament && 
          event.tournament.toLowerCase().includes(searchTerm)
        
        const homeTeamMatch = event.homeTeam && 
          event.homeTeam.toLowerCase().includes(searchTerm)
        const awayTeamMatch = event.awayTeam && 
          event.awayTeam.toLowerCase().includes(searchTerm)
        
        const fullMatch = `${event.homeTeam} vs ${event.awayTeam}`.toLowerCase().includes(searchTerm)
        
        return tournamentMatch || homeTeamMatch || awayTeamMatch || fullMatch
      })
    }

    if (eventsToProcess.length === 0) {
      const noResultsMessage = tournament 
        ? `No events found for "${tournament}" in ${sport}. Try searching for tournaments like "World Cup" or team names like "India".`
        : `No events found for ${sport}. Try "Football" or "Basketball".`
      return NextResponse.json({ error: noResultsMessage }, { status: 404 })
    }

    const searchOnly = req.headers.get('x-search-only') === 'true'
    if (searchOnly) {
      return NextResponse.json({
        message: tournament ? `Found ${eventsToProcess.length} events matching "${tournament}"` : `Found ${eventsToProcess.length} events`,
        results: eventsToProcess
      })
    }

    const results = []
    const events = autoCreateMultiple ? eventsToProcess : [eventsToProcess[0]]

    for (const sportsEvent of events) {
      const existingBook = await db.book.findFirst({
        where: {
          title: `${sportsEvent.homeTeam} vs ${sportsEvent.awayTeam}`,
          date: new Date(sportsEvent.startTime)
        }
      })

      if (existingBook) {
        results.push({ 
          event: `${sportsEvent.homeTeam} vs ${sportsEvent.awayTeam}`, 
          status: 'skipped'
        })
        continue
      }

      const book = await db.book.create({
        data: {
          title: `${sportsEvent.homeTeam} vs ${sportsEvent.awayTeam}`,
          date: new Date(sportsEvent.startTime),
          category: mapSportToCategory(sportsEvent.sport),
          image: sportsEvent.bookImage,
          userId: user.id,
        }
      })

      await Promise.all([
        db.team.create({ 
          data: { 
            name: sportsEvent.homeTeam, 
            image: sportsEvent.homeTeamImage,
            bookId: book.id 
          } 
        }),
        db.team.create({ 
          data: { 
            name: sportsEvent.awayTeam, 
            image: sportsEvent.awayTeamImage,
            bookId: book.id 
          } 
        })
      ])

      const createdEvents = await Promise.all(
        sportsEvent.markets.map(async (market, index) => {
          return db.event.create({
            data: {
              name: market.name,
              isFirstFastOption: index === 0,
              isSecondFastOption: index === 1,
              bookId: book.id,
              outcomes: {
                create: market.outcomes.map((outcome: any) => ({
                  name: outcome.name,
                  odds: outcome.odds,
                  probability: 1 / outcome.odds,
                  stake: 0
                }))
              }
            }
          })
        })
      )

      results.push({
        event: `${sportsEvent.homeTeam} vs ${sportsEvent.awayTeam}`,
        status: 'created',
        bookId: book.id,
        events: createdEvents.length
      })
    }

    return NextResponse.json({
      message: `Successfully processed ${results.length} event(s)`,
      results
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}