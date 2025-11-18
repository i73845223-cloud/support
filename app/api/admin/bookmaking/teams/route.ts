import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const user = await currentUser()
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { searchParams } = new URL(request.url)
    const bookId = searchParams.get('bookId')

    const teams = await db.team.findMany({
      where: bookId ? { bookId } : {},
      include: {
        homeEvents: true,
        awayEvents: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(teams)
  } catch (error) {
    console.log('[ADMIN_TEAMS_GET]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser()
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { name, image, bookId } = await request.json()

    if (!name || !bookId) {
      return new NextResponse("Name and bookId are required", { status: 400 })
    }

    const team = await db.team.create({
      data: {
        name,
        image,
        bookId
      }
    })

    return NextResponse.json(team)
  } catch (error) {
    console.log('[ADMIN_TEAMS_POST]', error)
    return new NextResponse("Internal error", { status: 500 })
  }
}