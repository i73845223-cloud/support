import BookManagement from '@/components/bookmaking/book-management'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'
import { Book, Event, Outcome, Team } from '@/app/types/bookmaking'

function convertBookStatus(status: any): 'ACTIVE' | 'INACTIVE' | 'COMPLETED' {
  const statusMap: { [key: string]: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' } = {
    'ACTIVE': 'ACTIVE',
    'INACTIVE': 'INACTIVE', 
    'COMPLETED': 'COMPLETED',
    'SETTLED': 'COMPLETED'
  }
  
  return statusMap[status] || 'INACTIVE'
}

async function getBookData(id: string) {
  try {
    const book = await db.book.findUnique({
      where: { id },
      include: {
        teams: true,
        events: {
          include: {
            outcomes: {
              orderBy: {
                order: 'asc'
              }
            },
            bets: {
              select: {
                id: true,
                status: true,
                amount: true,
                potentialWin: true
              }
            }
          }
        },
        bets: {
          select: {
            id: true,
            status: true,
            amount: true,
            potentialWin: true,
            createdAt: true
          }
        }
      }
    })

    if (!book) {
      return null
    }

    const now = new Date()
    const bookDate = new Date(book.date)
    
    const convertedStatus = convertBookStatus(book.status)
    const isLive = convertedStatus === 'ACTIVE' && now >= bookDate
    const isUpcoming = convertedStatus === 'ACTIVE' && now < bookDate
    
    const serializedBook: Book = {
      ...book,
      status: convertedStatus,
      date: book.date.toISOString(),
      createdAt: book.createdAt.toISOString(),
      updatedAt: book.updatedAt.toISOString(),
      isLive,
      isUpcoming,
      isAcceptingBets: now < bookDate,
      displayStatus: convertedStatus === 'ACTIVE' 
        ? (now >= bookDate ? 'LIVE' : 'UPCOMING')
        : convertedStatus
    } as unknown as Book

    if (book.teams) {
      serializedBook.teams = book.teams.map(team => ({
        ...team,
        createdAt: team.createdAt.toISOString(),
        updatedAt: team.updatedAt.toISOString()
      } as unknown as Team))
    }

    if (book.events) {
      serializedBook.events = book.events.map(event => {
        const serializedEvent = {
          ...event,
          createdAt: event.createdAt.toISOString(),
          updatedAt: event.updatedAt.toISOString()
        } as unknown as Event

        if (event.outcomes) {
          serializedEvent.outcomes = event.outcomes.map(outcome => ({
            ...outcome,
            createdAt: outcome.createdAt.toISOString(),
            updatedAt: outcome.updatedAt.toISOString()
          } as unknown as Outcome))
        }

        return serializedEvent
      })
    }

    return serializedBook
  } catch (error) {
    console.error('Error fetching book:', error)
    return null
  }
}

interface ManageBookPageProps {
  params: { id: string }
}

export default async function ManageBookPage({ params }: ManageBookPageProps) {
  const user = await currentUser()
  
  if (!user?.id) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Unauthorized</h1>
          <p className="text-muted-foreground">Please sign in to manage books.</p>
        </div>
      </div>
    )
  }

  const book = await getBookData(params.id)

  if (!book) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Book Not Found</h1>
          <p className="text-muted-foreground">The book you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    )
  }

  return <BookManagement book={book} />
}