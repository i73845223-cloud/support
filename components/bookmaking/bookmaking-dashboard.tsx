'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import {
  AlertCircle,
  DollarSign,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Trash2,
  Clock,
  CheckCircle,
} from 'lucide-react'
import BookSettlementDialog from './book-settlement-dialog'
import Link from 'next/link'
import { Book as BaseBook, Event as BaseEvent, Outcome as BaseOutcome } from '@/app/types/bookmaking'

type Book = Omit<BaseBook, 'status'> & {
  status: 'ACTIVE' | 'INACTIVE' | 'COMPLETED' | 'SETTLED' | 'CANCELLED'
}

const ITEMS_PER_PAGE = 10

export default function AdminBookmakingDashboard() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [hideNoStakes, setHideNoStakes] = useState(true)
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)

  const [settlementBook, setSettlementBook] = useState<Book | null>(null)
  const [settlementEvent, setSettlementEvent] = useState<BaseEvent | null>(null)
  const [isSettlementOpen, setIsSettlementOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<{ bookId: string; eventId: string; eventName: string } | null>(null)
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null)
  const [isDeleteEventDialogOpen, setIsDeleteEventDialogOpen] = useState(false)
  const [isDeleteBookDialogOpen, setIsDeleteBookDialogOpen] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await fetch('/api/admin/bookmaking/auto-settle', { method: 'POST' })
        fetchBooks()
      } catch (error) {
        console.error('Auto-settlement check failed:', error)
      }
    }, 2 * 60 * 1000)

    fetch('/api/admin/bookmaking/auto-settle', { method: 'POST' }).catch(console.error)
    fetchBooks()

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, searchQuery, hideNoStakes, dateFrom, dateTo])

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

  const openSettlementDialog = (book: Book, event?: BaseEvent) => {
    if (event) {
      setSettlementBook(book)
      setSettlementEvent(event)
      setIsSettlementOpen(true)
    } else {
      const pendingEvents = book.events?.filter(ev =>
        ev.outcomes?.some(outcome => outcome.result === 'PENDING')
      ) || []
      if (pendingEvents.length === 0) {
        alert('This book has no pending outcomes to settle.')
        return
      }
      setSettlementBook(book)
      setSettlementEvent(null)
      setIsSettlementOpen(true)
    }
  }

  const handleSettlementComplete = () => {
    setIsSettlementOpen(false)
    setSettlementBook(null)
    setSettlementEvent(null)
    fetchBooks()
  }

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return
    try {
      const res = await fetch(`/api/admin/bookmaking/events/${eventToDelete.eventId}`, { method: 'DELETE' })
      if (res.ok) fetchBooks()
      else alert('Failed to delete event')
    } catch {
      alert('Error deleting event')
    } finally {
      setEventToDelete(null)
      setIsDeleteEventDialogOpen(false)
    }
  }

  const handleDeleteBook = async () => {
    if (!bookToDelete) return
    try {
      const res = await fetch(`/api/admin/bookmaking/books/${bookToDelete.id}`, { method: 'DELETE' })
      if (res.ok) fetchBooks()
      else alert('Failed to delete book')
    } catch {
      alert('Error deleting book')
    } finally {
      setBookToDelete(null)
      setIsDeleteBookDialogOpen(false)
    }
  }

  const confirmDeleteEvent = (bookId: string, eventId: string, eventName: string) => {
    setEventToDelete({ bookId, eventId, eventName })
    setIsDeleteEventDialogOpen(true)
  }

  const confirmDeleteBook = (book: Book) => {
    setBookToDelete(book)
    setIsDeleteBookDialogOpen(true)
  }

  const getBookDisplayStatus = (book: Book): string => {
    if (book.status === 'SETTLED') return 'SETTLED'
    if (book.status === 'CANCELLED') return 'CANCELLED'
    const now = new Date()
    const bookDate = new Date(book.date)
    const hasPending = book.events?.some(ev => ev.outcomes?.some(o => o.result === 'PENDING'))
    if (hasPending) {
      return now < bookDate ? 'UPCOMING' : 'LIVE'
    }
    return book.status
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      // case 'ACTIVE': return 'default'
      case 'LIVE': return 'default'
      case 'UPCOMING': return 'secondary'
      // case 'INACTIVE': return 'secondary'
      case 'SETTLED': return 'outline'
      // case 'CANCELLED': return 'destructive'
      default: return 'secondary'
    }
  }

  const getTotalStake = (book: Book): number => {
    return book.events?.reduce((sum, ev) => sum + (ev.outcomes?.reduce((s, o) => s + (o.stake || 0), 0) || 0), 0) || 0
  }

  const getPendingEventsCount = (book: Book): number => {
    return book.events?.filter(ev => ev.outcomes?.some(o => o.result === 'PENDING')).length || 0
  }

  const isEventPending = (event: BaseEvent) => event.outcomes?.some(o => o.result === 'PENDING')

  const filteredBooks = books.filter(book => {
    const displayStatus = getBookDisplayStatus(book)
    if (statusFilter !== 'ALL' && displayStatus !== statusFilter) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matches = book.title.toLowerCase().includes(q) ||
        book.category.toLowerCase().includes(q) ||
        book.championship?.toLowerCase().includes(q) ||
        book.country?.toLowerCase().includes(q) ||
        book.teams?.some(t => t.name.toLowerCase().includes(q)) ||
        book.events?.some(e => e.name.toLowerCase().includes(q))
      if (!matches) return false
    }

    const bookDate = new Date(book.date)
    if (dateFrom && bookDate < dateFrom) return false
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      if (bookDate > to) return false
    }

    if (hideNoStakes && displayStatus !== 'UPCOMING') {
      if (getTotalStake(book) === 0) return false
    }

    return true
  })

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    const statusA = getBookDisplayStatus(a)
    const statusB = getBookDisplayStatus(b)

    const order: Record<string, number> = { 'LIVE': 0, 'UPCOMING': 1, 'ACTIVE': 2, 'SETTLED': 3, 'CANCELLED': 4 }
    const orderA = order[statusA] ?? 5
    const orderB = order[statusB] ?? 5
    if (orderA !== orderB) return orderA - orderB

    return new Date(a.date).getTime() - new Date(b.date).getTime()
  })

  const totalItems = sortedBooks.length
  const totalPagesCount = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentBooks = sortedBooks.slice(startIndex, endIndex)

  useEffect(() => {
    setTotalPages(totalPagesCount)
    if (currentPage > totalPagesCount && totalPagesCount > 0) setCurrentPage(totalPagesCount)
  }, [totalItems, currentPage, totalPagesCount])

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1) }
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1) }
  const goToFirstPage = () => setCurrentPage(1)
  const goToLastPage = () => setCurrentPage(totalPages)

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
    let end = Math.min(totalPages, start + maxVisible - 1)
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  if (loading) {
    return (
      <div className="py-4 px-4 sm:px-8">
        <Skeleton className="h-10 w-48 mb-4" />
        {[1,2,3].map(i => <Card key={i} className="p-4 sm:p-6 mb-4"><Skeleton className="h-20" /></Card>)}
      </div>
    )
  }

  return (
    <div className="py-4 px-4 sm:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <Link href="/create">
          <Button size="lg" className="w-full sm:w-auto">Create Book</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="LIVE">Live</SelectItem>
            <SelectItem value="UPCOMING">Upcoming</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="SETTLED">Settled</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex flex-row gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[140px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, 'PP') : 'From date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-[140px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'PP') : 'To date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center space-x-2 py-1">
          <Checkbox
            id="hideNoStakes"
            checked={hideNoStakes}
            onCheckedChange={(checked) => setHideNoStakes(checked === true)}
          />
          <Label htmlFor="hideNoStakes" className="text-sm">Hide books with no stakes</Label>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mb-2">
        Showing {startIndex+1}-{Math.min(endIndex, totalItems)} of {totalItems} books
      </div>

      {currentBooks.length === 0 ? (
        <Card><CardContent className="py-12 text-center">No books found.</CardContent></Card>
      ) : (
        <>
          <div className="space-y-4">
            {currentBooks.map((book) => {
              const displayStatus = getBookDisplayStatus(book)
              const totalStake = getTotalStake(book)
              const pendingCount = getPendingEventsCount(book)

              return (
                <Card key={book.id}>
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {book.image && <img src={book.image} className="w-8 h-6 rounded" />}
                        <CardTitle className="text-lg">{book.title}</CardTitle>
                        <Badge variant={getStatusVariant(displayStatus)}>{displayStatus.toLowerCase()}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                        {book.status === 'ACTIVE' && (
                          <>
                            <Link href={`/${book.id}/manage`} className="flex-1 sm:flex-none">
                              <Button variant="outline" size="sm" className="w-full sm:w-auto">Manage</Button>
                            </Link>
                            <Button size="sm" onClick={() => openSettlementDialog(book)} className="flex-1 sm:flex-none">
                              Settle Book
                            </Button>
                          </>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => confirmDeleteBook(book)} className="flex-1 sm:flex-none">
                          <Trash2 className="h-4 w-4 mr-1 sm:mr-0" />
                          <span className="sm:hidden">Delete</span>
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                      <Badge variant="outline">{book.category}</Badge>
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        {new Date(book.date).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created: {new Date(book.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold">{book.events?.length || 0}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Events</div>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold">₹{totalStake.toFixed(2)}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Total Stake</div>
                      </div>
                      <div className="bg-muted p-3 rounded-lg col-span-2 sm:col-span-1">
                        <div className="text-xl sm:text-2xl font-bold">{pendingCount}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Pending</div>
                      </div>
                    </div>

                    {book.events && book.events.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Events</h4>
                        {book.events.slice(0, 3).map(event => (
                          <div key={event.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 border rounded-lg gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{event.name}</span>
                              <Badge variant={isEventPending(event) ? 'secondary' : 'outline'}>
                                {isEventPending(event) ? 'pending' : 'settled'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                              <span className="text-xs text-muted-foreground">
                                {event.outcomes?.length || 0} outcomes
                              </span>
                              {isEventPending(event) && (
                                <Button size="sm" variant="outline" onClick={() => openSettlementDialog(book, event)}>
                                  <CheckCircle className="h-3 w-3 mr-1" /> Settle
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                                onClick={() => confirmDeleteEvent(book.id, event.id, event.name)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {book.events.length > 3 && (
                          <div className="text-center text-xs text-muted-foreground">+{book.events.length - 3} more</div>
                        )}
                      </div>
                    )}

                    {pendingCount > 0 && (
                      <Alert className="mt-3 bg-amber-50 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800 text-sm">
                          {pendingCount} event(s) with pending outcomes
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</div>
              <div className="flex items-center gap-1 flex-wrap justify-center">
                <Button variant="outline" size="sm" onClick={goToFirstPage} disabled={currentPage === 1}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={prevPage} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {getPageNumbers().map(page => (
                  <Button key={page} variant={page === currentPage ? 'default' : 'outline'} size="sm"
                    onClick={() => goToPage(page)} className="w-8 h-8 p-0">
                    {page}
                  </Button>
                ))}
                <Button variant="outline" size="sm" onClick={nextPage} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToLastPage} disabled={currentPage === totalPages}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {settlementBook && (
        <BookSettlementDialog
          book={settlementBook as BaseBook}
          event={settlementEvent || undefined}
          isOpen={isSettlementOpen}
          onClose={() => {
            setIsSettlementOpen(false)
            setSettlementBook(null)
            setSettlementEvent(null)
          }}
          onSettlementComplete={handleSettlementComplete}
        />
      )}

      <AlertDialog open={isDeleteEventDialogOpen} onOpenChange={setIsDeleteEventDialogOpen}>
        <AlertDialogContent className='bg-black text-white max-w-[95vw] sm:max-w-lg'>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Delete &quot;{eventToDelete?.eventName}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-500 text-white hover:bg-gray-800">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} className="bg-destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteBookDialogOpen} onOpenChange={setIsDeleteBookDialogOpen}>
        <AlertDialogContent className='bg-black text-white max-w-[95vw] sm:max-w-lg'>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Book</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Delete &quot;{bookToDelete?.title}&quot; and all its events? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-500 text-white hover:bg-gray-800">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBook} className="bg-destructive">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}