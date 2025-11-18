'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, AlertCircle, Users, Calendar, Loader2, Zap, Search, ArrowUp, ArrowDown, Flag, Trophy, Flame, Globe } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'

const CATEGORIES = [
  'Cricket',
  'Football',
  'Kabaddi',
  'Tennis',
  'Hockey',
  'Badminton',
  'Basketball',
  'Boxing',
  'MMA',
  'Esports',
  'Other'
]

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Italy', 'Spain',
  'Brazil', 'Argentina', 'Russia', 'China', 'Japan', 'South Korea', 'Pakistan', 'Bangladesh', 'Sri Lanka',
  'Afghanistan', 'South Africa', 'New Zealand', 'Netherlands', 'Portugal', 'Sweden', 'Norway', 'Denmark',
  'Finland', 'Switzerland', 'Austria', 'Belgium', 'Ireland', 'Scotland', 'Wales', 'Mexico', 'Chile',
  'Colombia', 'Peru', 'Uruguay', 'Paraguay', 'Bolivia', 'Venezuela', 'Ecuador', 'Costa Rica', 'Panama',
  'Jamaica', 'Trinidad and Tobago', 'Nigeria', 'Kenya', 'Ghana', 'Egypt', 'Morocco', 'Algeria', 'Tunisia',
  'Senegal', 'Ivory Coast', 'Cameroon', 'Uganda', 'Tanzania', 'Ethiopia', 'Zimbabwe', 'Zambia', 'Namibia',
  'Botswana', 'Mozambique', 'Angola', 'Malaysia', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines',
  'Singapore', 'Hong Kong', 'Taiwan', 'United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Oman',
  'Bahrain', 'Israel', 'Turkey', 'Greece', 'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria',
  'Ukraine', 'Belarus', 'Kazakhstan', 'Uzbekistan', 'Azerbaijan', 'Georgia', 'Armenia', 'Other'
]

const CHAMPIONSHIPS = [
  'Olympic Games',
  'FIFA World Cup',
  'Cricket World Cup',
  'UEFA Champions League',
  'English Premier League',
  'Indian Premier League (IPL)',
  'T20 World Cup',
  'Commonwealth Games',
  'Asian Games',
  'Euro Cup',
  'Copa America',
  'Africa Cup of Nations',
  'NBA Championships',
  'Wimbledon',
  'US Open',
  'French Open',
  'Australian Open',
  'World Athletics Championships',
  'World Swimming Championships',
  'World Boxing Championships',
  'UFC Championships',
  'World Esports Championships',
  'Other'
]

const SPORTS_API_MAPPING = {
  'Cricket': 'cricket',
  'Football': 'football',
  'Kabaddi': 'kabaddi',
  'Tennis': 'tennis',
  'Hockey': 'hockey',
  'Badminton': 'badminton',
  'Basketball': 'basketball',
  'Boxing': 'boxing',
  'MMA': 'mma',
  'Esports': 'esports'
}

interface TeamForm {
  name: string
  image: string
}

interface OutcomeForm {
  name: string
  odds: number
  order: number
}

interface EventForm {
  name: string
  isFirstFastOption: boolean
  isSecondFastOption: boolean
  outcomes: OutcomeForm[]
}

export default function BookCreationForm() {
  const { data: session } = useSession()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState('')
  const [image, setImage] = useState('')
  const [description, setDescription] = useState('')
  const [championship, setChampionship] = useState('')
  const [customChampionship, setCustomChampionship] = useState('')
  const [country, setCountry] = useState('')
  const [isHotEvent, setIsHotEvent] = useState(false)
  const [isNationalSport, setIsNationalSport] = useState(false)
  const [teams, setTeams] = useState<TeamForm[]>([
    { name: '', image: '' }
  ])
  const [events, setEvents] = useState<EventForm[]>([
    { 
      name: '', 
      isFirstFastOption: true,
      isSecondFastOption: false,
      outcomes: [{ name: '', odds: 0, order: 0 }]
    }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [useAutomation, setUseAutomation] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [tournamentFilter, setTournamentFilter] = useState('')
  const [foundEvents, setFoundEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  const searchAutomatedEvents = async () => {
    if (!category) {
      toast.error('Please select a category first')
      return
    }

    setIsSearching(true)
    try {
      const sportKey = SPORTS_API_MAPPING[category as keyof typeof SPORTS_API_MAPPING] || 'soccer'
      
      const response = await fetch('/api/admin/bookmaking/auto-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-search-only': 'true'
        },
        body: JSON.stringify({
          sport: sportKey,
          tournament: tournamentFilter,
          autoCreateMultiple: false
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setFoundEvents(data.results || [])
        if (data.results && data.results.length > 0) {
          toast.success(`Found ${data.results.length} real events with odds`)
        } else {
          toast.info('No events found. Try a different sport.')
        }
      } else {
        throw new Error(data.error || 'Failed to fetch events')
      }
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Check your API key and try again')
    } finally {
      setIsSearching(false)
    }
  }

  const loadEventData = (eventData: any) => {
    setSelectedEvent(eventData);
    
    setTitle(eventData.title || `${eventData.homeTeam} vs ${eventData.awayTeam}`);
    setDate(new Date(eventData.startTime).toISOString().slice(0, 16));
    setCategory(eventData.category || category);
    setImage(eventData.bookImage || '');
    
    setTeams([
      { 
        name: eventData.homeTeam, 
        image: eventData.homeTeamImage || '' 
      },
      { 
        name: eventData.awayTeam, 
        image: eventData.awayTeamImage || '' 
      }
    ]);
    
    const formattedEvents = eventData.markets.map((market: any, index: number) => ({
      name: market.name,
      isFirstFastOption: index === 0,
      isSecondFastOption: index === 1,
      outcomes: market.outcomes.map((outcome: any, outcomeIndex: number) => ({
        name: outcome.name,
        odds: outcome.odds,
        order: outcomeIndex
      }))
    }));
    
    setEvents(formattedEvents);
    
    toast.success('Event data loaded successfully!');
  };

  const addTeam = () => {
    setTeams([...teams, { name: '', image: '' }])
  }

  const removeTeam = (index: number) => {
    if (teams.length > 1) {
      setTeams(teams.filter((_, i) => i !== index))
    }
  }

  const updateTeam = (index: number, field: string, value: string) => {
    const updatedTeams = [...teams]
    updatedTeams[index] = { ...updatedTeams[index], [field]: value }
    setTeams(updatedTeams)
  }

  const addEvent = () => {
    setEvents([...events, { 
      name: '', 
      isFirstFastOption: false,
      isSecondFastOption: false,
      outcomes: [{ name: '', odds: 0, order: 0 }]
    }])
  }

  const removeEvent = (index: number) => {
    if (events.length > 1) {
      const updatedEvents = events.filter((_, i) => i !== index)
      
      if (index === 0 && events[0].isFirstFastOption && updatedEvents.length > 0) {
        updatedEvents[0].isFirstFastOption = true
      }
      
      setEvents(updatedEvents)
    }
  }

  const updateEvent = (index: number, field: string, value: any) => {
    const updatedEvents = [...events]
    
    if (field === 'isFirstFastOption' && value === true) {
      updatedEvents.forEach((event, i) => {
        if (i !== index) {
          event.isFirstFastOption = false
        }
      })
    }
    
    if (field === 'isSecondFastOption' && value === true) {
      updatedEvents.forEach((event, i) => {
        if (i !== index) {
          event.isSecondFastOption = false
        }
      })
    }
    
    updatedEvents[index] = { ...updatedEvents[index], [field]: value }
    setEvents(updatedEvents)
  }

  const addOutcome = (eventIndex: number) => {
    const updatedEvents = [...events]
    const currentOutcomes = updatedEvents[eventIndex].outcomes
    const nextOrder = currentOutcomes.length > 0 
      ? Math.max(...currentOutcomes.map(o => o.order)) + 1 
      : 0
    
    updatedEvents[eventIndex].outcomes.push({ 
      name: '', 
      odds: 0, 
      order: nextOrder 
    })
    setEvents(updatedEvents)
  }

  const removeOutcome = (eventIndex: number, outcomeIndex: number) => {
    const updatedEvents = [...events]
    if (updatedEvents[eventIndex].outcomes.length > 1) {
      updatedEvents[eventIndex].outcomes = updatedEvents[eventIndex].outcomes.filter(
        (_, i) => i !== outcomeIndex
      )
      updatedEvents[eventIndex].outcomes.forEach((outcome, index) => {
        outcome.order = index
      })
      setEvents(updatedEvents)
    }
  }

  const updateOutcome = (eventIndex: number, outcomeIndex: number, field: string, value: any) => {
    const updatedEvents = [...events]
    updatedEvents[eventIndex].outcomes[outcomeIndex] = {
      ...updatedEvents[eventIndex].outcomes[outcomeIndex],
      [field]: value
    }
    setEvents(updatedEvents)
  }

  const moveOutcome = (eventIndex: number, outcomeIndex: number, direction: 'up' | 'down') => {
    const updatedEvents = [...events]
    const outcomes = updatedEvents[eventIndex].outcomes
    
    if (direction === 'up' && outcomeIndex > 0) {
      [outcomes[outcomeIndex], outcomes[outcomeIndex - 1]] = 
      [outcomes[outcomeIndex - 1], outcomes[outcomeIndex]]
      
      outcomes.forEach((outcome, index) => {
        outcome.order = index
      })
    } else if (direction === 'down' && outcomeIndex < outcomes.length - 1) {
      [outcomes[outcomeIndex], outcomes[outcomeIndex + 1]] = 
      [outcomes[outcomeIndex + 1], outcomes[outcomeIndex]]
      
      outcomes.forEach((outcome, index) => {
        outcome.order = index
      })
    }
    
    setEvents(updatedEvents)
  }

  const getValidTeams = () => {
    return teams.filter(team => team.name.trim() !== '')
  }

  const getFinalChampionship = () => {
    if (championship === 'Other' && customChampionship.trim()) {
      return customChampionship.trim()
    }
    return championship
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session?.user?.id) {
      toast.error("Please sign in to create a book")
      return
    }

    const validTeams = getValidTeams()
    if (validTeams.length < 2) {
      toast.error("Please add at least 2 teams to create events")
      return
    }

    const validEvents = events.filter(event => 
      event.name.trim() !== '' && 
      event.outcomes.every(outcome => outcome.name.trim() !== '' && outcome.odds > 1)
    )

    if (validEvents.length === 0) {
      toast.error("Please add at least one valid event with valid outcomes")
      return
    }

    if (!date) {
      toast.error("Please select a date for the book")
      return
    }

    if (!category) {
      toast.error("Please select a category for the book")
      return
    }

    const firstFastBetCount = validEvents.filter(event => event.isFirstFastOption).length
    const secondFastBetCount = validEvents.filter(event => event.isSecondFastOption).length

    if (firstFastBetCount > 1) {
      toast.error("Only one event can be selected as 1st Fast Bet")
      return
    }

    if (secondFastBetCount > 1) {
      toast.error("Only one event can be selected as 2nd Fast Bet")
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/admin/bookmaking/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          date,
          category,
          image: image || null,
          description: description || null,
          championship: getFinalChampionship() || null,
          country: country || null,
          isHotEvent,
          isNationalSport,
          teams: validTeams,
          events: validEvents.map(event => ({
            ...event,
            outcomes: event.outcomes.map(outcome => ({
              ...outcome,
              odds: parseFloat(outcome.odds.toString())
            }))
          }))
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTitle('')
        setDate('')
        setCategory('')
        setImage('')
        setDescription('')
        setChampionship('')
        setCustomChampionship('')
        setCountry('')
        setIsHotEvent(false)
        setIsNationalSport(false)
        setTeams([{ name: '', image: '' }])
        setEvents([{ 
          name: '', 
          isFirstFastOption: true,
          isSecondFastOption: false,
          outcomes: [{ name: '', odds: 0, order: 0 }]
        }])
        
        toast.success("Book created successfully!")

        router.push('/')
      } else {
        throw new Error(data.error || 'Failed to create book')
      }
    } catch (error: any) {
      console.error('Error creating book:', error)
      toast.error(error.message || "Failed to create book. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const validTeams = getValidTeams()
  const firstFastBetEvent = events.find(event => event.isFirstFastOption)
  const secondFastBetEvent = events.find(event => event.isSecondFastOption)

  return (
    <div className="px-4 py-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Find Events Automatically
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sport Category</Label>
                <Select value={category} onValueChange={setCategory} disabled={isSearching}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tournament (Optional)</Label>
                <Input
                  value={tournamentFilter}
                  onChange={(e) => setTournamentFilter(e.target.value)}
                  placeholder="e.g., Premier League, NBA"
                  disabled={isSearching}
                />
              </div>
              
              <div className="space-y-2 flex items-end">
                <Button
                  type="button"
                  onClick={searchAutomatedEvents}
                  disabled={!category || isSearching}
                  className="w-full"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search Events
                    </>
                  )}
                </Button>
              </div>
            </div>

            {foundEvents.length > 0 && (
              <div className="space-y-3">
                <Label>Found Events</Label>
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {foundEvents.map((event, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 ${
                        selectedEvent === event ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => loadEventData(event)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{event.homeTeam} vs {event.awayTeam}</h4>
                          <p className="text-sm text-muted-foreground">
                            {event.tournament} • {new Date(event.startTime).toLocaleDateString()}
                          </p>
                          <div className="flex gap-2 mt-1">
                            {(event.markets || []).slice(0, 2).map((market: any, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {market.name}
                              </Badge>
                            ))}
                            {(event.markets || []).length === 0 && (
                              <Badge variant="outline" className="text-xs">
                                No markets
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant={selectedEvent === event ? "default" : "outline"}>
                          {selectedEvent === event ? 'Selected' : 'Select'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Book Information</CardTitle>
            <CardDescription>
              Basic information about the book. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Book Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Premier League 2024"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description for this book (optional)"
                disabled={isSubmitting}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Book Date *</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Book Image URL</Label>
              <Input
                id="image"
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/country-flag.png"
                disabled={isSubmitting}
              />
              <p className="text-sm text-muted-foreground">
                Add a country flag or tournament logo (optional)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Championship & Location
            </CardTitle>
            <CardDescription>
              Optional fields to group books together and add location context
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="championship">Championship / Tournament</Label>
                <Select value={championship} onValueChange={setChampionship} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select championship" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHAMPIONSHIPS.map(champ => (
                      <SelectItem key={champ} value={champ}>
                        {champ}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={country} onValueChange={setCountry} disabled={isSubmitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRIES.map(country => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {championship === 'Other' && (
              <div className="space-y-2">
                <Label htmlFor="customChampionship">Custom Championship Name</Label>
                <Input
                  id="customChampionship"
                  value={customChampionship}
                  onChange={(e) => setCustomChampionship(e.target.value)}
                  placeholder="Enter custom championship name"
                  disabled={isSubmitting}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isHotEvent"
                  checked={isHotEvent}
                  onCheckedChange={(checked) => setIsHotEvent(checked as boolean)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isHotEvent" className="flex items-center gap-2 cursor-pointer">
                  <Flame className="h-4 w-4 text-orange-500" />
                  Mark as Hot Event
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isNationalSport"
                  checked={isNationalSport}
                  onCheckedChange={(checked) => setIsNationalSport(checked as boolean)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isNationalSport" className="flex items-center gap-2 cursor-pointer">
                  <Globe className="h-4 w-4 text-blue-500" />
                  National Sport Event
                </Label>
              </div>
            </div>

            {(championship || country || isHotEvent || isNationalSport) && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium mb-2 block">Preview Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {championship && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Trophy className="h-3 w-3" />
                      {championship === 'Other' ? customChampionship : championship}
                    </Badge>
                  )}
                  {country && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Flag className="h-3 w-3" />
                      {country}
                    </Badge>
                  )}
                  {isHotEvent && (
                    <Badge variant="default" className="bg-orange-500 flex items-center gap-1">
                      <Flame className="h-3 w-3" />
                      Hot Event
                    </Badge>
                  )}
                  {isNationalSport && (
                    <Badge variant="default" className="bg-blue-500 flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      National Sport
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Teams
                </CardTitle>
              </div>
              <Button
                type="button"
                onClick={addTeam}
                disabled={isSubmitting}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Team
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {validTeams.length < 2 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  At least 2 teams are required to create betting options
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team, teamIndex) => (
                <Card key={teamIndex} className="relative">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <Badge variant="secondary">Team {teamIndex + 1}</Badge>
                      {teams.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeTeam(teamIndex)}
                          variant="ghost"
                          size="sm"
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor={`team-name-${teamIndex}`}>Team Name *</Label>
                        <Input
                          id={`team-name-${teamIndex}`}
                          value={team.name}
                          onChange={(e) => updateTeam(teamIndex, 'name', e.target.value)}
                          placeholder="e.g., Manchester United"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`team-image-${teamIndex}`}>Team Image URL</Label>
                        <Input
                          id={`team-image-${teamIndex}`}
                          type="url"
                          value={team.image}
                          onChange={(e) => updateTeam(teamIndex, 'image', e.target.value)}
                          placeholder="https://example.com/team-logo.png"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Betting Options
                </CardTitle>
              </div>
              <Button
                type="button"
                onClick={addEvent}
                disabled={isSubmitting || validTeams.length < 2}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {events.map((event, eventIndex) => (
              <Card key={eventIndex} className="relative">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <Badge variant="outline" className="mb-2">Option {eventIndex + 1}</Badge>
                      {event.isFirstFastOption && (
                        <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">1st Fast Bet</Badge>
                      )}
                      {event.isSecondFastOption && (
                        <Badge className="ml-2 bg-green-100 text-green-800 border-green-200">2nd Fast Bet</Badge>
                      )}
                    </div>
                    {events.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeEvent(eventIndex)}
                        variant="ghost"
                        size="sm"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="space-y-2">
                      <Label htmlFor={`event-name-${eventIndex}`}>Betting Option Name *</Label>
                      <Input
                        id={`event-name-${eventIndex}`}
                        value={event.name}
                        onChange={(e) => updateEvent(eventIndex, 'name', e.target.value)}
                        placeholder="e.g., Match Winner, Total Goals, Both Teams to Score"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="mb-6 p-4 bg-muted rounded-lg">
                    <Label className="text-base font-medium mb-3 block">Fast Bet Options</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`first-fast-${eventIndex}`}
                          checked={event.isFirstFastOption}
                          onCheckedChange={(checked) => updateEvent(eventIndex, 'isFirstFastOption', checked)}
                          disabled={isSubmitting || (firstFastBetEvent && firstFastBetEvent !== event)}
                        />
                        <Label htmlFor={`first-fast-${eventIndex}`} className="font-medium">
                          1st Fast Bet Position
                          {firstFastBetEvent && firstFastBetEvent !== event && (
                            <span className="text-xs text-muted-foreground block">
                              Already selected in &quot;{firstFastBetEvent.name || 'another option'}&quot;
                            </span>
                          )}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`second-fast-${eventIndex}`}
                          checked={event.isSecondFastOption}
                          onCheckedChange={(checked) => updateEvent(eventIndex, 'isSecondFastOption', checked)}
                          disabled={isSubmitting || (secondFastBetEvent && secondFastBetEvent !== event)}
                        />
                        <Label htmlFor={`second-fast-${eventIndex}`} className="font-medium">
                          2nd Fast Bet Position
                          {secondFastBetEvent && secondFastBetEvent !== event && (
                            <span className="text-xs text-muted-foreground block">
                              Already selected in &quot;{secondFastBetEvent.name || 'another option'}&quot;
                            </span>
                          )}
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-base font-medium">Outcomes *</Label>
                      <Button
                        type="button"
                        onClick={() => addOutcome(eventIndex)}
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Outcome
                      </Button>
                    </div>

                    {event.outcomes.map((outcome, outcomeIndex) => (
                      <div key={outcomeIndex} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                        <div className="md:col-span-1 flex flex-col items-center space-y-2">
                          <Label className="text-xs text-muted-foreground">Order</Label>
                          <div className="flex flex-col space-y-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveOutcome(eventIndex, outcomeIndex, 'up')}
                              disabled={outcomeIndex === 0 || isSubmitting}
                              className="h-6 w-6 p-0"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <div className="text-xs font-medium text-center px-2">
                              {outcome.order + 1}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveOutcome(eventIndex, outcomeIndex, 'down')}
                              disabled={outcomeIndex === event.outcomes.length - 1 || isSubmitting}
                              className="h-6 w-6 p-0"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="md:col-span-6 space-y-2">
                          <Label htmlFor={`outcome-name-${eventIndex}-${outcomeIndex}`}>
                            Outcome Name *
                          </Label>
                          <Input
                            id={`outcome-name-${eventIndex}-${outcomeIndex}`}
                            value={outcome.name}
                            onChange={(e) => updateOutcome(eventIndex, outcomeIndex, 'name', e.target.value)}
                            placeholder="e.g., Team A Wins, Draw, Over 2.5 Goals, Yes"
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                        
                        <div className="md:col-span-4 space-y-2">
                          <Label htmlFor={`outcome-odds-${eventIndex}-${outcomeIndex}`}>
                            Odds *
                          </Label>
                          <Input
                            id={`outcome-odds-${eventIndex}-${outcomeIndex}`}
                            type="number"
                            placeholder="1.50"
                            step="0.01"
                            min="1.01"
                            value={outcome.odds || ''}
                            onChange={(e) => updateOutcome(eventIndex, outcomeIndex, 'odds', e.target.value ? parseFloat(e.target.value) : 0)}
                            required
                            disabled={isSubmitting}
                          />
                        </div>
                        
                        <div className="md:col-span-1 flex items-end justify-center">
                          {event.outcomes.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeOutcome(eventIndex, outcomeIndex)}
                              variant="ghost"
                              size="sm"
                              disabled={isSubmitting}
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <Button
            type="button"
            onClick={() => {
              setTitle('')
              setDate('')
              setCategory('')
              setImage('')
              setDescription('')
              setChampionship('')
              setCustomChampionship('')
              setCountry('')
              setIsHotEvent(false)
              setIsNationalSport(false)
              setTeams([{ name: '', image: '' }])
              setEvents([{ 
                name: '', 
                isFirstFastOption: true,
                isSecondFastOption: false,
                outcomes: [{ name: '', odds: 0, order: 0 }]
              }])
            }}
            variant="outline"
            disabled={isSubmitting}
          >
            Reset Form
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              'Create Book'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}