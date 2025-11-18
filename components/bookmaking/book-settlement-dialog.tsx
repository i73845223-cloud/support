'use client'

import { useState, useEffect } from 'react'
import { Book } from '@/app/types/bookmaking'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface BookSettlementDialogProps {
  book: Book
  isOpen: boolean
  onClose: () => void
  onSettlementComplete: () => void
}

export default function BookSettlementDialog({
  book,
  isOpen,
  onClose,
  onSettlementComplete
}: BookSettlementDialogProps) {
  const [winningOutcomes, setWinningOutcomes] = useState<{[eventId: string]: string}>({})
  const [settling, setSettling] = useState(false)
  const [settledEvents, setSettledEvents] = useState<Set<string>>(new Set())
  const [refreshedBook, setRefreshedBook] = useState<Book | null>(null)

  useEffect(() => {
    if (isOpen) {
      refreshBookData()
    }
  }, [isOpen, book.id])

  const refreshBookData = async () => {
    try {
      const response = await fetch(`/api/admin/bookmaking/books/${book.id}`)
      if (response.ok) {
        const freshBook = await response.json()
        setRefreshedBook(freshBook)
      }
    } catch (error) {
      console.error('Error refreshing book data:', error)
      setRefreshedBook(book)
    }
  }

  const currentBook = refreshedBook || book

  const getEventBetCount = (event: any): number => {
    return event.bets?.length || 0
  }

  const getOutcomeStake = (outcome: any): number => {
    return outcome.stake || 0
  }

  const getEventStake = (event: any): number => {
    if (!event.outcomes) return 0
    return event.outcomes.reduce((total: number, outcome: any) => 
      total + getOutcomeStake(outcome), 0
    )
  }

  const getOutcomeProbability = (outcome: any): number => {
    return outcome.probability || 0
  }

  const getOutcomeResult = (outcome: any): string | null => {
    return outcome.result || null
  }

  const pendingEvents = (currentBook.events || []).filter(event => 
    event
  )

  const handleOutcomeSelect = (eventId: string, outcomeId: string) => {
    setWinningOutcomes(prev => ({
      ...prev,
      [eventId]: outcomeId
    }))
  }

  const canSettleBook = () => {
    return pendingEvents.every(event => winningOutcomes[event.id])
  }

  const getTotalPendingBets = () => {
    return pendingEvents.reduce((total, event) => total + getEventBetCount(event), 0)
  }

  const getTotalPendingStake = () => {
    return pendingEvents.reduce((total, event) => total + getEventStake(event), 0)
  }

  const settleEvent = async (eventId: string) => {
    const winningOutcomeId = winningOutcomes[eventId]
    if (!winningOutcomeId) return

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
        setSettledEvents(prev => new Set(prev).add(eventId))
        return true
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to settle event')
      }
    } catch (error) {
      console.error(`Error settling event ${eventId}:`, error)
      throw error
    }
  }

  const settleAllEvents = async () => {
    if (!canSettleBook()) {
      alert('Please select winning outcomes for all events before settling.')
      return
    }

    if (!confirm(`Are you sure you want to settle all ${pendingEvents.length} events in this book? This will process ${getTotalPendingBets()} bets and cannot be undone.`)) {
      return
    }

    setSettling(true)

    try {
      for (const event of pendingEvents) {
        if (!settledEvents.has(event.id)) {
          await settleEvent(event.id)
        }
      }

      const updateResponse = await fetch(`/api/admin/bookmaking/books/${book.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'SETTLED' }),
      })

      if (updateResponse.ok) {
        const updateResult = await updateResponse.json()
      } else {
        const error = await updateResponse.text()
        console.error('Book update failed:', error)
        throw new Error(`Failed to update book status: ${error}`)
      }

      alert(`Book settled successfully! All ${pendingEvents.length} events have been processed.`)
      onSettlementComplete()
      
    } catch (error: any) {
      console.error('Settlement error:', error)
      alert(`Settlement failed: ${error.message || 'Unknown error'}`)
    } finally {
      setSettling(false)
    }
  }

  const getOutcomeResultColor = (result: string | null) => {
    switch (result) {
      case 'WIN': return 'bg-green-100 text-green-800 border-green-300'
      case 'LOSE': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black">
        <DialogHeader>
          <DialogTitle>Settle Book: {currentBook.title}</DialogTitle>
          <DialogDescription>
            Select winning outcomes for each event and settle the entire book at once.
            <br />
            <span className="text-yellow-600 font-medium">
              Note: Cancelled bets will be automatically skipped during settlement.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{pendingEvents.length}</div>
            <div className="text-sm text-blue-600">Events to Settle</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{getTotalPendingBets()}</div>
            <div className="text-sm text-blue-600">Pending Bets</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">₹{getTotalPendingStake().toFixed(2)}</div>
            <div className="text-sm text-blue-600">Total Stake</div>
          </div>
        </div>

        <div className="space-y-6">
          {pendingEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No events need settlement in this book.
            </div>
          ) : (
            pendingEvents.map((event) => (
              <div key={event.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{event.name || 'Unnamed Event'}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">
                        {(event.outcomes?.length || 0)} outcomes
                      </Badge>
                      <Badge variant="outline">
                        {getEventBetCount(event)} bets
                      </Badge>
                      {settledEvents.has(event.id) && (
                        <Badge className="bg-green-100 text-green-800">
                          ✓ Settled
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      ₹{getEventStake(event).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Stake</div>
                  </div>
                </div>

                {event.outcomes && event.outcomes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {event.outcomes.map((outcome) => (
                      <div
                        key={outcome.id}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                          winningOutcomes[event.id] === outcome.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : getOutcomeResultColor(getOutcomeResult(outcome))
                        } ${settledEvents.has(event.id) ? 'opacity-60 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (!settledEvents.has(event.id)) {
                            handleOutcomeSelect(event.id, outcome.id)
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium">{outcome.name || 'Unnamed Outcome'}</div>
                          {getOutcomeResult(outcome) && (
                            <Badge className={getOutcomeResultColor(getOutcomeResult(outcome))}>
                              {getOutcomeResult(outcome)}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">Odds</div>
                            <div className="font-bold text-blue-600">
                              {(outcome.odds || 0).toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Stake</div>
                            <div className="font-semibold">
                              ₹{getOutcomeStake(outcome).toFixed(2)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 text-xs text-muted-foreground">
                          Probability: {(getOutcomeProbability(outcome) * 100).toFixed(1)}%
                        </div>

                        {winningOutcomes[event.id] === outcome.id && (
                          <div className="mt-2 text-xs font-medium text-blue-600">
                            ✓ Selected as winner
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No outcomes available for this event.
                  </div>
                )}

                {!winningOutcomes[event.id] && !settledEvents.has(event.id) && (
                  <div className="mt-3 text-sm text-yellow-600">
                    ⚠️ Please select a winning outcome for this event
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {Object.keys(winningOutcomes).length} of {pendingEvents.length} events ready for settlement
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              disabled={settling}
            >
              Cancel
            </Button>
            <Button
              onClick={settleAllEvents}
              disabled={!canSettleBook() || settling || pendingEvents.length === 0}
              className="min-w-32"
            >
              {settling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Settling...
                </>
              ) : (
                `Settle Book (${pendingEvents.length} events)`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}