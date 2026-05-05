import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";

  const skip = (page - 1) * limit;

  const whereClause: Prisma.UserWhereInput = {
    role: "AFFILIATE",
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const allAffiliates = await db.user.findMany({
    where: whereClause,
    select: { id: true },
  });
  const affiliateIds = allAffiliates.map(a => a.id);

  const [users, totalCount] = await Promise.all([
    db.user.findMany({
      where: whereClause,
      include: {
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.user.count({ where: whereClause }),
  ]);

  const enrichedAffiliates = await Promise.all(
    users.map(async (affiliate) => {
      const mediaBuyerCount = await db.user.count({
        where: { createdByUserId: affiliate.id, role: "MEDIA" },
      });

      const mediaBuyers = await db.user.findMany({
        where: { createdByUserId: affiliate.id, role: "MEDIA" },
        select: { id: true },
      });
      const mediaBuyerIds = mediaBuyers.map(mb => mb.id);

      const totalReferrals = await db.userPromoCode.count({
        where: {
          promoCode: { assignedUserId: { in: mediaBuyerIds } },
        },
      });

      let totalNgr = new Prisma.Decimal(0);
      if (mediaBuyerIds.length > 0) {
        const refUsers = await db.userPromoCode.findMany({
          where: { promoCode: { assignedUserId: { in: mediaBuyerIds } } },
          select: { userId: true },
          distinct: ['userId'],
        });
        const referredUserIds = refUsers.map(r => r.userId);

        if (referredUserIds.length > 0) {
          const [wAgg, dAgg] = await Promise.all([
            db.transaction.aggregate({
              where: {
                userId: { in: referredUserIds },
                type: "withdrawal",
                status: "success",
                category: { not: "transaction" },
              },
              _sum: { amount: true },
            }),
            db.transaction.aggregate({
              where: {
                userId: { in: referredUserIds },
                type: "deposit",
                status: { in: ["success", "pending"] },
                category: { not: "transaction" },
              },
              _sum: { amount: true },
            }),
          ]);
          const w = wAgg._sum.amount || new Prisma.Decimal(0);
          const d = dAgg._sum.amount || new Prisma.Decimal(0);
          totalNgr = w.minus(d);
        }
      }

      const ownWithdrawalsAgg = await db.transaction.aggregate({
        where: { userId: affiliate.id, type: "withdrawal", status: "success" },
        _sum: { amount: true },
      });
      const ownWithdrawals = ownWithdrawalsAgg._sum.amount || new Prisma.Decimal(0);

      const commissionPercent = affiliate.commissionPercent ?? 0;
      const balance = totalNgr.mul(commissionPercent).div(100).minus(ownWithdrawals);

      return {
        ...affiliate,
        totalMediaBuyers: mediaBuyerCount,
        totalReferrals,
        totalNgr: totalNgr.toString(),
        totalBalance: balance.toString(),
      };
    })
  );


  return NextResponse.json({
    users: enrichedAffiliates,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasNext: skip + limit < totalCount,
      hasPrev: page > 1,
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, password, commissionPercent } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "AFFILIATE",
      commissionPercent: commissionPercent ? parseFloat(commissionPercent) : null,
      emailVerified: new Date(),
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}