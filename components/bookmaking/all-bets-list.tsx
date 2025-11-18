'use client'

import { useState, useEffect } from 'react'
import { Book } from '@/app/types/bookmaking'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface BetWithDetails {
  id: string
  amount: number
  potentialWin: number
  status: string
  odds: number
  createdAt: string
  settledAt: string | null
  user: {
    id: string
    name: string | null
    email: string | null
  }
  outcome: {
    id: string
    name: string
    result: string | null
    event: {
      id: string
      name: string
      status: string
      date: string
      book: {
        id: string
        title: string
        status: string
      }
    }
  }
  transaction?: {
    id: string
    status: string
  }
}

export default function AllBetsList() {
  const [bets, setBets] = useState<BetWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<string>('all')
  const [selectedBook, setSelectedBook] = useState<string>('all')
  const [winningOutcomes, setWinningOutcomes] = useState<{[eventId: string]: string}>({})
  const [events, setEvents] = useState<any[]>([])
  const [books, setBooks] = useState<any[]>([])

  useEffect(() => {
    fetchAllBets()
    fetchEventsAndBooks()
  }, [])

  const fetchAllBets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/bookmaking/all-bets')
      if (response.ok) {
        const betsData: BetWithDetails[] = await response.json()
        setBets(betsData)
      }
    } catch (error) {
      console.error('Error fetching bets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEventsAndBooks = async () => {
    try {
      const response = await fetch('/api/admin/bookmaking/books')
      if (response.ok) {
        const booksData: Book[] = await response.json()
        setBooks(booksData)
        
        // Extract all events from books
        const allEvents = booksData.flatMap(book => 
          book.events.map(event => ({
            ...event,
            bookTitle: book.title,
            bookId: book.id
          }))
        )
        setEvents(allEvents)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    }
  }

  const handleWinningOutcomeChange = (eventId: string, outcomeId: string) => {
    setWinningOutcomes(prev => ({
      ...prev,
      [eventId]: outcomeId
    }))
  }

  const settleEvent = async (eventId: string) => {
    const winningOutcomeId = winningOutcomes[eventId]
    if (!winningOutcomeId) {
      alert('Please select a winning outcome for this event')
      return
    }

    if (!confirm(`Are you sure you want to settle this event with the selected winner? This cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/bookmaking/events/${eventId}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winningOutcomeId }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Event settled successfully! ${result.data.wonBets} bets won, ${result.data.lostBets} bets lost.`)
        
        // Clear the winning outcome selection
        setWinningOutcomes(prev => {
          const newState = { ...prev }
          delete newState[eventId]
          return newState
        })
        
        // Refresh data
        fetchAllBets()
        fetchEventsAndBooks()
      } else {
        const error = await response.json()
        alert(`Failed to settle event: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error settling event:', error)
      alert('Error settling event')
    }
  }

  // Group bets by event
  const betsByEvent = bets.reduce((acc, bet) => {
    const eventId = bet.outcome.event.id
    if (!acc[eventId]) {
      acc[eventId] = {
        event: bet.outcome.event,
        bets: [],
        outcomes: new Set()
      }
    }
    acc[eventId].bets.push(bet)
    acc[eventId].outcomes.add(bet.outcome.id)
    return acc
  }, {} as { [key: string]: { event: any; bets: BetWithDetails[]; outcomes: Set<string> } })

  // Filter events based on selections
  const filteredEvents = Object.entries(betsByEvent)
    .filter(([eventId, data]) => {
      if (selectedEvent !== 'all' && eventId !== selectedEvent) return false
      if (selectedBook !== 'all' && data.event.book.id !== selectedBook) return false
      return true
    })
    .sort(([, a], [, b]) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime())

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WON': return 'bg-green-100 text-green-800'
      case 'LOST': return 'bg-red-100 text-red-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'fail': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading all bets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Book
              </label>
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Books</option>
                {books.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title} ({book.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Event
              </label>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="all">All Events</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.bookTitle})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={fetchAllBets}
                variant="outline"
                className="w-full"
              >
                Refresh Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{bets.length}</div>
            <div className="text-sm text-blue-600">Total Bets</div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {bets.filter(b => b.status === 'PENDING').length}
            </div>
            <div className="text-sm text-yellow-600">Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {bets.filter(b => b.status === 'WON').length}
            </div>
            <div className="text-sm text-green-600">Won</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-red-600">
              {bets.filter(b => b.status === 'LOST').length}
            </div>
            <div className="text-sm text-red-600">Lost</div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <div className="space-y-6">
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground">No bets found matching your filters.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map(([eventId, data]) => (
            <Card key={eventId} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {data.event.name}
                      <Badge variant={
                        data.event.status === 'COMPLETED' ? 'default' :
                        data.event.status === 'LIVE' ? 'secondary' :
                        'outline'
                      }>
                        {data.event.status.toLowerCase()}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {data.event.book.title} • {new Date(data.event.date).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {data.bets.length} bets • {Array.from(data.outcomes).length} outcomes
                    </p>
                  </div>
                  
                  {data.event.status !== 'COMPLETED' && (
                    <div className="flex items-center gap-2">
                      <select
                        value={winningOutcomes[eventId] || ''}
                        onChange={(e) => handleWinningOutcomeChange(eventId, e.target.value)}
                        className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select winner...</option>
                        {data.bets
                          .filter((bet, index, self) => 
                            self.findIndex(b => b.outcome.id === bet.outcome.id) === index
                          )
                          .map(bet => (
                            <option key={bet.outcome.id} value={bet.outcome.id}>
                              {bet.outcome.name}
                            </option>
                          ))
                        }
                      </select>
                      <Button
                        onClick={() => settleEvent(eventId)}
                        disabled={!winningOutcomes[eventId]}
                        size="sm"
                      >
                        Settle Event
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {/* Event Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="font-bold text-lg">
                      ₹{data.bets.reduce((sum, bet) => sum + bet.amount, 0).toFixed(2)}
                    </div>
                    <div className="text-muted-foreground">Total Stake</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="font-bold text-lg">{data.bets.filter(b => b.status === 'PENDING').length}</div>
                    <div className="text-muted-foreground">Pending Bets</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="font-bold text-lg">{data.bets.filter(b => b.status === 'WON').length}</div>
                    <div className="text-muted-foreground">Won Bets</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="font-bold text-lg">{data.bets.filter(b => b.status === 'LOST').length}</div>
                    <div className="text-muted-foreground">Lost Bets</div>
                  </div>
                </div>

                {/* Bets Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">User</th>
                        <th className="text-left py-2">Outcome</th>
                        <th className="text-right py-2">Stake</th>
                        <th className="text-right py-2">Odds</th>
                        <th className="text-right py-2">Potential Win</th>
                        <th className="text-center py-2">Status</th>
                        <th className="text-center py-2">Transaction</th>
                        <th className="text-left py-2">Placed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.bets.map((bet) => (
                        <tr key={bet.id} className="border-b hover:bg-gray-50">
                          <td className="py-2">
                            <div>
                              <div className="font-medium">{bet.user.name || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{bet.user.email}</div>
                            </div>
                          </td>
                          <td className="py-2">
                            <div className="font-medium">{bet.outcome.name}</div>
                            {bet.outcome.result && (
                              <Badge variant="outline" className="text-xs">
                                {bet.outcome.result}
                              </Badge>
                            )}
                          </td>
                          <td className="py-2 text-right font-medium">
                            ₹{bet.amount.toFixed(2)}
                          </td>
                          <td className="py-2 text-right">
                            {bet.odds.toFixed(2)}
                          </td>
                          <td className="py-2 text-right font-medium text-green-600">
                            ₹{bet.potentialWin.toFixed(2)}
                          </td>
                          <td className="py-2 text-center">
                            <Badge className={getStatusColor(bet.status)}>
                              {bet.status.toLowerCase()}
                            </Badge>
                          </td>
                          <td className="py-2 text-center">
                            {bet.transaction ? (
                              <Badge className={getTransactionColor(bet.transaction.status)}>
                                {bet.transaction.status}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">No Tx</span>
                            )}
                          </td>
                          <td className="py-2 text-sm text-muted-foreground">
                            {new Date(bet.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}