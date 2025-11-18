export interface Book {
  id: string
  title: string
  description?: string
  date: string
  category: string
  image?: string
  championship?: string
  country?: string
  isHotEvent: boolean
  isNationalSport: boolean
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED'
  userId: string
  createdAt: string
  updatedAt: string
  isLive: boolean
  isUpcoming: boolean
  isAcceptingBets: boolean
  displayStatus: string
  teams: Team[]
  events: Event[]
}

export interface Team {
  id: string
  name: string
  image?: string
  bookId: string
  createdAt: string
  updatedAt: string
}

export interface Event {
  id: string
  name: string
  isFirstFastOption: boolean
  isSecondFastOption: boolean
  bookId: string
  homeTeam?: Team
  awayTeam?: Team
  homeTeamId?: string
  awayTeamId?: string
  createdAt: string
  updatedAt: string
  outcomes: Outcome[]
}

export interface Outcome {
  id: string
  name: string
  odds: number
  result: 'PENDING' | 'WON' | 'LOST' | 'VOID'
  order: number
  eventId: string
  createdAt: string
  updatedAt: string
  probability: number
  stake: number
}