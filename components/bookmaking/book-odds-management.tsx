// src/components/bookmaking/admin/BookOddsManagement.tsx
'use client'

import { useState, useEffect } from 'react'
import { Book } from '@/app/types/bookmaking'
import { Button } from '../ui/button'

export default function BookOddsManagement() {
  const [books, setBooks] = useState<Book[]>([])
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [winningOutcomeMap, setWinningOutcomeMap] = useState<{[eventId: string]: string}>({})

  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/admin/bookmaking/books')
      if (response.ok) {
        const booksData: Book[] = await response.json()
        setBooks(booksData)
      }
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOutcomeOdds = async (outcomeId: string, newOdds: number) => {
    try {
      const response = await fetch(`/api/admin/bookmaking/outcomes/${outcomeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ odds: newOdds }),
      })

      if (response.ok) {
        // Update local state
        const updatedBooks = books.map(book => ({
          ...book,
          events: book.events.map(event => ({
            ...event,
            outcomes: event.outcomes.map(outcome =>
              outcome.id === outcomeId 
                ? { ...outcome, odds: newOdds, probability: 1 / newOdds }
                : outcome
            )
          }))
        }))
        setBooks(updatedBooks)
        
        if (selectedBook) {
          setSelectedBook(updatedBooks.find(b => b.id === selectedBook.id) || null)
        }
      } else {
        alert('Failed to update odds')
      }
    } catch (error) {
      console.error('Error updating odds:', error)
      alert('Error updating odds')
    }
  }

  const updateOutcomeResult = async (outcomeId: string, result: string) => {
    try {
      const response = await fetch(`/api/admin/bookmaking/outcomes/${outcomeId}/result`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ result }),
      })

      if (response.ok) {
        // Refresh books to get updated data
        fetchBooks()
        alert('Outcome result updated successfully!')
      } else {
        const errorData = await response.json()
        alert(`Failed to update outcome result: ${errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating outcome result:', error)
      alert('Error updating outcome result')
    }
  }

  const settleBetsForEvent = async (eventId: string, winningOutcomeId: string) => {
    try {
      const response = await fetch(`/api/admin/bookmaking/events/${eventId}/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winningOutcomeId }),
      })

      if (response.ok) {
        alert('Bets settled successfully!')
        fetchBooks() // Refresh data
        // Clear the winning outcome selection
        setWinningOutcomeMap(prev => ({ ...prev, [eventId]: '' }))
      } else {
        const errorData = await response.json()
        alert(`Failed to settle bets: ${errorData.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error settling bets:', error)
      alert('Error settling bets')
    }
  }

  const handleWinningOutcomeChange = (eventId: string, outcomeId: string) => {
    setWinningOutcomeMap(prev => ({ ...prev, [eventId]: outcomeId }))
  }

  if (loading) {
    return <div className="text-center py-8">Loading books...</div>
  }

  // Add these functions to your component
  const debugSettlement = async (eventId: string) => {
    try {
      const response = await fetch(`/api/admin/bookmaking/debug/settlement?eventId=${eventId}`)
      if (response.ok) {
        const debugData = await response.json()
        console.log('🔍 Settlement debug:', debugData)
        
        alert(
          `Event: ${debugData.event.name} (${debugData.event.status})\n` +
          `Bets: ${debugData.settlement.totalBets} total\n` +
          `- Pending: ${debugData.settlement.pendingBets}\n` +
          `- Won: ${debugData.settlement.wonBets}\n` +
          `- Lost: ${debugData.settlement.lostBets}\n` +
          `Transactions:\n` +
          `- Success: ${debugData.settlement.betsWithSuccessfulTx}\n` +
          `- Failed: ${debugData.settlement.betsWithFailedTx}\n` +
          `- Pending: ${debugData.settlement.betsWithPendingTx}\n` +
          `Check console for details`
        )
      }
    } catch (error) {
      console.error('Error debugging settlement:', error)
    }
  }

  const forceSettleEvent = async (eventId: string, winningOutcomeId: string) => {
    if (!confirm('FORCE SETTLE: This will overwrite all bet and transaction statuses. Continue?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/bookmaking/events/${eventId}/force-settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ winningOutcomeId }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Force settlement completed! ${result.data.updatedBets} bets updated.`)
        fetchBooks() // Refresh data
      } else {
        const error = await response.json()
        alert(`Force settlement failed: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error force settling:', error)
      alert('Error force settling event')
    }
  }

  return (
    <div className="space-y-6">
      {/* Book Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Book
          </label>
          <select
            value={selectedBook?.id || ''}
            onChange={(e) => {
              setSelectedBook(books.find(b => b.id === e.target.value) || null)
              setSelectedEvent(null)
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Choose a book...</option>
            {books.map(book => (
              <option key={book.id} value={book.id}>
                {book.title} ({book.status})
              </option>
            ))}
          </select>
        </div>

        {selectedBook && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Event
            </label>
            <select
              value={selectedEvent || ''}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Events</option>
              {selectedBook.events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Odds Management */}
      {selectedBook && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Manage Odds - {selectedBook.title}
            </h3>
            
            <div className="space-y-6">
              {selectedBook.events
                .filter(event => !selectedEvent || event.id === selectedEvent)
                .map(event => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="font-medium text-gray-800">{event.name}</h4>
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    {event.outcomes.map(outcome => (
                      <div key={outcome.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                        <div className="flex-1">
                          <div className="font-medium">{outcome.name}</div>
                          <div className="text-sm text-gray-500">
                            Current stake: ${outcome.stake.toFixed(2)}
                          </div>
                          {outcome.result && (
                            <div className={`text-xs font-medium px-2 py-1 rounded inline-block mt-1 ${
                              outcome.result === 'WON' ? 'bg-green-100 text-green-800' :
                              outcome.result === 'LOST' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              Result: {outcome.result}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-center">
                            <label className="block text-xs text-gray-500 mb-1">Odds</label>
                            <input
                              type="number"
                              step="0.01"
                              min="1.01"
                              value={outcome.odds}
                              onChange={(e) => updateOutcomeOdds(outcome.id, parseFloat(e.target.value))}
                              className="w-20 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div className="text-center">
                            <label className="block text-xs text-gray-500 mb-1">Probability</label>
                            <div className="text-sm font-medium">
                              {(outcome.probability * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Book Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-gray-900">
                {selectedBook.events.length}
              </div>
              <div className="text-sm text-gray-500">Total Events</div>
            </div>
            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="text-sm text-gray-500">Total Bets</div>
            </div>
            <div className="bg-white p-4 rounded-lg border text-center">
              <div className="text-2xl font-bold text-gray-900">
                $
                {selectedBook.events.reduce((total, event) => 
                  total + event.outcomes.reduce((eventTotal, outcome) => 
                    eventTotal + outcome.stake, 0
                  ), 0
                ).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Total Stake</div>
            </div>
          </div>
        </div>
      )}

      {books.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No books available for management.</p>
          <p className="text-sm text-gray-400">Create a book first to manage odds.</p>
        </div>
      )}
    </div>
  )
}