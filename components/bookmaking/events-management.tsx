'use client'

import { useState, useEffect } from 'react'
import { Book } from '@/app/types/bookmaking'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface EventWithDetails {
  id: string
  name: string
  description: string | null
  date: string
  status: string
  book: {
    id: string
    title: string
    status: string
  }
  outcomes: {
    id: string
    name: string
    odds: number
    probability: number
    stake: number
    result: string | null
  }[]
  bets: {
    id: string
    status: string
  }[]
}

export default function EventsManagement() {
  const [events, setEvents] = useState<EventWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [winningOutcomes, setWinningOutcomes] = useState<{[eventId: string]: string}>({})
  const [settlingEvents, setSettlingEvents] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/bookmaking/events')
      if (response.ok) {
        const eventsData: EventWithDetails[] = await response.json()
        setEvents(eventsData)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleEvent = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev)
      if (newSet.has(eventId)) {
        newSet.delete(eventId)
      } else {
        newSet.add(eventId)
      }
      return newSet
    })
  }

  const handleOutcomeSelect = (eventId: string, outcomeId: string) => {
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

    if (!confirm(`Are you sure you want to settle this event? This will process all bets and cannot be undone.`)) {
      return
    }

    setSettlingEvents(prev => new Set(prev).add(eventId))

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
        
        // Close the expanded view
        setExpandedEvents(prev => {
          const newSet = new Set(prev)
          newSet.delete(eventId)
          return newSet
        })
        
        // Refresh data
        fetchEvents()
      } else {
        const error = await response.json()
        alert(`Failed to settle event: ${error.message || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error settling event:', error)
      alert('Error settling event')
    } finally {
      setSettlingEvents(prev => {
        const newSet = new Set(prev)
        newSet.delete(eventId)
        return newSet
      })
    }
  }

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'LIVE': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getOutcomeResultColor = (result: string | null) => {
    switch (result) {
      case 'WIN': return 'bg-green-100 text-green-800 border-green-300'
      case 'LOSE': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getTotalStake = (event: EventWithDetails) => {
    return event.outcomes.reduce((total, outcome) => total + outcome.stake, 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Events Management</h2>
          <p className="text-muted-foreground">Manage all events and settle outcomes</p>
        </div>
        <Button onClick={fetchEvents} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{events.length}</div>
            <div className="text-sm text-muted-foreground">Total Events</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {events.filter(e => e.status === 'UPCOMING').length}
            </div>
            <div className="text-sm text-muted-foreground">Upcoming</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {events.filter(e => e.status === 'LIVE').length}
            </div>
            <div className="text-sm text-muted-foreground">Live</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">
              {events.filter(e => e.status === 'COMPLETED').length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground">No events found.</p>
                <p className="text-sm text-muted-foreground">Create some events to get started.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <Collapsible
                open={expandedEvents.has(event.id)}
                onOpenChange={() => toggleEvent(event.id)}
              >
                {/* Event Header */}
                <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {expandedEvents.has(event.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <div>
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{event.book.title}</Badge>
                          <Badge className={getEventStatusColor(event.status)}>
                            {event.status.toLowerCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold">₹{getTotalStake(event).toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Total Stake</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{event.bets.length}</div>
                        <div className="text-sm text-muted-foreground">Bets</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Expanded Content */}
                <CollapsibleContent>
                  <CardContent className="pt-0 border-t">
                    {/* Event Description */}
                    {event.description && (
                      <p className="text-sm text-muted-foreground mb-4">{event.description}</p>
                    )}

                    {/* Outcomes Grid */}
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3">Outcomes</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {event.outcomes.map((outcome) => (
                          <div
                            key={outcome.id}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                              winningOutcomes[event.id] === outcome.id
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                : getOutcomeResultColor(outcome.result)
                            }`}
                            onClick={() => {
                              if (event.status !== 'COMPLETED') {
                                handleOutcomeSelect(event.id, outcome.id)
                              }
                            }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-medium">{outcome.name}</div>
                              {outcome.result && (
                                <Badge className={getOutcomeResultColor(outcome.result)}>
                                  {outcome.result}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <div className="text-muted-foreground">Odds</div>
                                <div className="font-bold text-lg text-blue-600">
                                  {outcome.odds.toFixed(2)}
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Stake</div>
                                <div className="font-semibold">
                                  ₹{outcome.stake.toFixed(2)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-2 text-xs text-muted-foreground">
                              Probability: {(outcome.probability * 100).toFixed(1)}%
                            </div>

                            {winningOutcomes[event.id] === outcome.id && (
                              <div className="mt-2 text-xs font-medium text-blue-600">
                                ✓ Selected as winner
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Settlement Section */}
                    {event.status !== 'COMPLETED' && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">Ready to settle this event?</div>
                          <div className="text-sm text-muted-foreground">
                            {winningOutcomes[event.id] 
                              ? `Selected: ${event.outcomes.find(o => o.id === winningOutcomes[event.id])?.name}`
                              : 'Select a winning outcome above'
                            }
                          </div>
                        </div>
                        
                        <Button
                          onClick={() => settleEvent(event.id)}
                          disabled={!winningOutcomes[event.id] || settlingEvents.has(event.id)}
                          className="min-w-32"
                        >
                          {settlingEvents.has(event.id) ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Settling...
                            </>
                          ) : (
                            'Settle Event'
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Completed Event Info */}
                    {event.status === 'COMPLETED' && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-green-800">Event Completed</div>
                            <div className="text-sm text-green-600">
                              {event.outcomes.find(o => o.result === 'WIN')?.name} was the winning outcome
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Settled
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}