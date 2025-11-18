'use client'

import { useState, useEffect } from 'react'
import { Book } from '@/app/types/bookmaking'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertCircle, 
  Calendar, 
  Users, 
  DollarSign, 
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import BookSettlementDialog from './book-settlement-dialog'
import Link from 'next/link'

const ITEMS_PER_PAGE = 10

export default function AdminBookmakingDashboard() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [settlementBook, setSettlementBook] = useState<Book | null>(null)
  const [isSettlementOpen, setIsSettlementOpen] = useState(false)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/admin/bookmaking/auto-settle', {
          method: 'POST'
        });
        
        if (response.ok) {
          console.log('🔄 Auto-settlement check completed');
          fetchBooks();
        }
      } catch (error) {
        console.error('Auto-settlement check failed:', error);
      }
    }, 2 * 60 * 1000);

    fetch('/api/admin/bookmaking/auto-settle', { method: 'POST' })
      .then(() => console.log('🔄 Initial auto-settlement check completed'))
      .catch(console.error);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchBooks()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter])

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

  const openSettlementDialog = (book: Book) => {
    const pendingEvents = book.events?.filter(event => {
      const hasPendingOutcomes = event.outcomes?.some(outcome => outcome.result === 'PENDING')
      return hasPendingOutcomes
    }) || []
    
    if (pendingEvents.length === 0) {
      alert('This book has no events with pending outcomes that need settlement.')
      return
    }

    setSettlementBook(book)
    setIsSettlementOpen(true)
  }

  const handleSettlementComplete = () => {
    setIsSettlementOpen(false)
    setSettlementBook(null)
    fetchBooks()
  }

  const filteredBooks = books.filter(book => 
    statusFilter === 'ALL' || book.status === statusFilter
  )

  const totalItems = filteredBooks.length
  const totalPagesCount = Math.ceil(totalItems / ITEMS_PER_PAGE)
  
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentBooks = filteredBooks.slice(startIndex, endIndex)

  useEffect(() => {
    setTotalPages(totalPagesCount)
    if (currentPage > totalPagesCount && totalPagesCount > 0) {
      setCurrentPage(totalPagesCount)
    }
  }, [filteredBooks.length, currentPage, totalPagesCount])

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default'
      case 'INACTIVE': return 'secondary'
      case 'SETTLED': return 'outline'
      case 'CANCELLED': return 'destructive'
      default: return 'secondary'
    }
  }

  const getEventBetCount = (event: any): number => {
    return event.bets?.length || 0
  }

  const getTotalBookBets = (book: Book): number => {
    return book.events?.reduce((total, event) => total + getEventBetCount(event), 0) || 0
  }

  const getTotalStake = (book: Book) => {
    if (!book.events) return 0
    return book.events.reduce((total, event) => {
      if (!event.outcomes) return total
      return total + event.outcomes.reduce((eventTotal, outcome) => 
        eventTotal + (outcome.stake || 0), 0
      )
    }, 0)
  }

  const getPendingEventsCount = (book: Book) => {
    return book.events?.filter(event => {
      return event.outcomes?.some(outcome => outcome.result === 'PENDING')
    }).length || 0
  }

  const getOutcomeStatusVariant = (result: string) => {
    switch (result) {
      case 'WIN': return 'default'
      case 'LOSE': return 'destructive'
      case 'VOID': return 'outline'
      case 'PENDING': return 'secondary'
      default: return 'secondary'
    }
  }

  const isEventPending = (event: any) => {
    return event.outcomes?.some((outcome: any) => outcome.result === 'PENDING')
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToFirstPage = () => {
    setCurrentPage(1)
  }

  const goToLastPage = () => {
    setCurrentPage(totalPages)
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    return pages
  }

  if (loading) {
    return (
      <div className="py-4 px-8">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <Skeleton key={j} className="h-16 rounded-lg" />
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="py-4 px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4">
        <div className="flex gap-5 items-center">
          <Link href="/create">
            <Button size="lg" className='text-xl font-bold'>
              Create
            </Button>
          </Link>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="space-y-2 flex-1 sm:flex-none">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SETTLED">Settled</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
        <span>
          Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} books
          {statusFilter !== 'ALL' && ` (filtered by ${statusFilter.toLowerCase()})`}
        </span>
      </div>

      {currentBooks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 space-y-3">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">No books found</p>
              <p className="text-sm text-muted-foreground">
                {statusFilter === 'ALL' 
                  ? "Create your first book to get started." 
                  : `No books with ${statusFilter.toLowerCase()} status.`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-6">
            {currentBooks.map((book) => (
              <Card key={book.id}>
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {book.image && (
                          <img 
                            src={book.image} 
                            alt={book.title}
                            className="w-8 h-6 rounded object-cover"
                          />
                        )}
                        <CardTitle className="text-xl">{book.title}</CardTitle>
                        <Badge variant={getStatusVariant(book.status)}>
                          {book.status.toLowerCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {book.category}
                        </Badge>
                        <span>{new Date(book.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {book.status === 'ACTIVE' && (
                        <>
                          <Link href={`/${book.id}/manage`}>
                            <Button
                              variant="outline"
                              size="sm"
                            >
                              Manage
                            </Button>
                          </Link>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation()
                              openSettlementDialog(book)
                            }}
                            size="sm"
                          >
                            Settle Book
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-2xl font-bold">{book.events?.length || 0}</div>
                        <div className="text-sm text-muted-foreground">Events</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Users className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-2xl font-bold">{getTotalBookBets(book)}</div>
                        <div className="text-sm text-muted-foreground">Bets</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-2xl font-bold">₹{getTotalStake(book).toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Total Stake</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">
                          {new Date(book.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">Created</div>
                      </div>
                    </div>
                  </div>

                  {book.events && book.events.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Recent Events</h4>
                        <Badge variant="outline" className="text-xs">
                          {book.events.length} total
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {book.events.slice(0, 3).map((event) => (
                          <div key={event.id} className="flex items-center justify-between p-2 bg-background border rounded-lg">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="font-medium text-sm truncate">{event.name}</span>
                              <Badge 
                                variant={isEventPending(event) ? "secondary" : "outline"} 
                                className="text-xs shrink-0"
                              >
                                {isEventPending(event) ? 'pending' : 'settled'}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground shrink-0 ml-2">
                              {event.outcomes?.length || 0} outcomes • {getEventBetCount(event)} bets
                            </div>
                          </div>
                        ))}
                        {book.events.length > 3 && (
                          <div className="text-center text-xs text-muted-foreground py-1">
                            +{book.events.length - 3} more events
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {book.status === 'ACTIVE' && getPendingEventsCount(book) > 0 && (
                    <Alert variant="default" className="bg-amber-50 border-amber-200">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        This book has {getPendingEventsCount(book)} events with pending outcomes
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className="hidden sm:flex"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="hidden sm:flex"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground hidden md:block">
                {ITEMS_PER_PAGE} per page
              </div>
            </div>
          )}
        </>
      )}

      {settlementBook && (
        <BookSettlementDialog
          book={settlementBook}
          isOpen={isSettlementOpen}
          onClose={() => {
            setIsSettlementOpen(false)
            setSettlementBook(null)
          }}
          onSettlementComplete={handleSettlementComplete}
        />
      )}
    </div>
  )
}