import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { id } = params

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
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(book)
  } catch (error) {
    console.log('[ADMIN_BOOKS_GET_SINGLE]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { 
      title, 
      description,
      date, 
      category, 
      image, 
      championship,
      country,
      isHotEvent,
      isNationalSport,
      teams, 
      events 
    } = body

    const existingBook = await db.book.findUnique({
      where: { id }
    })

    if (!existingBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    if (!teams || teams.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 teams are required' },
        { status: 400 }
      )
    }

    if (!events || events.length === 0) {
      return NextResponse.json(
        { error: 'At least one event is required' },
        { status: 400 }
      )
    }

    if (!category?.trim()) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    const firstFastBetCount = events.filter((event: any) => event.isFirstFastOption).length
    const secondFastBetCount = events.filter((event: any) => event.isSecondFastOption).length

    if (firstFastBetCount > 1) {
      return NextResponse.json(
        { error: 'Only one event can be selected as 1st Fast Bet' },
        { status: 400 }
      )
    }

    if (secondFastBetCount > 1) {
      return NextResponse.json(
        { error: 'Only one event can be selected as 2nd Fast Bet' },
        { status: 400 }
      )
    }

    const result = await db.$transaction(async (tx) => {
      const updatedBook = await tx.book.update({
        where: { id },
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          date: new Date(date),
          category: category.trim(),
          image: image?.trim() || null,
          championship: championship?.trim() || null,
          country: country?.trim() || null,
          isHotEvent: Boolean(isHotEvent),
          isNationalSport: Boolean(isNationalSport),
        },
      })

      await tx.team.deleteMany({
        where: { bookId: id }
      })

      await tx.event.deleteMany({
        where: { bookId: id }
      })

      const createdTeams = await Promise.all(
        teams.map((team: any) =>
          tx.team.create({
            data: {
              name: team.name.trim(),
              image: team.image?.trim() || null,
              bookId: id,
            },
          })
        )
      )

      const createdEvents = await Promise.all(
        events.map((event: any, index: number) =>
          tx.event.create({
            data: {
              name: event.name.trim(),
              isFirstFastOption: Boolean(event.isFirstFastOption),
              isSecondFastOption: Boolean(event.isSecondFastOption),
              bookId: id,
              outcomes: {
                create: event.outcomes.map((outcome: any, outcomeIndex: number) => ({
                  name: outcome.name.trim(),
                  odds: parseFloat(outcome.odds) || 1.0,
                  probability: 1 / (parseFloat(outcome.odds) || 1.0),
                  stake: 0,
                  result: 'PENDING',
                  order: outcome.order !== undefined ? outcome.order : outcomeIndex
                })),
              },
            },
            include: {
              outcomes: true,
            },
          })
        )
      )

      return {
        book: updatedBook,
        teams: createdTeams,
        events: createdEvents,
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Book updated successfully',
      data: result.book
    })

  } catch (error: any) {
    console.error(`💥 [ADMIN_BOOKS_PUT] Error updating book ${params.id}:`, error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A book with this title already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { 
      status, 
      title, 
      description,
      date, 
      category, 
      image,
      championship,
      country,
      isHotEvent,
      isNationalSport
    } = body

    const existingBook = await db.book.findUnique({
      where: { id }
    })

    if (!existingBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}

    if (status) {
      const validStatuses = ['ACTIVE', 'SETTLED', 'CANCELLED', 'COMPLETED']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.status = status
    }

    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (date) updateData.date = new Date(date)
    if (category !== undefined) updateData.category = category.trim()
    if (image !== undefined) updateData.image = image?.trim() || null
    if (championship !== undefined) updateData.championship = championship?.trim() || null
    if (country !== undefined) updateData.country = country?.trim() || null
    if (isHotEvent !== undefined) updateData.isHotEvent = Boolean(isHotEvent)
    if (isNationalSport !== undefined) updateData.isNationalSport = Boolean(isNationalSport)

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const updatedBook = await db.book.update({
      where: { id },
      data: updateData,
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
                status: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook
    })

  } catch (error: any) {
    console.error(`💥 [ADMIN_BOOKS_PATCH] Error updating book ${params.id}:`, error)
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      )
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A book with this title already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await currentUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const book = await db.book.findUnique({
      where: { id: params.id },
      include: { 
        events: { 
          include: { 
            outcomes: true 
          } 
        }, 
        teams: true 
      }
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    await db.book.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Book deleted successfully' 
    })
  } catch (error: any) {
    console.error('Error deleting book:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}