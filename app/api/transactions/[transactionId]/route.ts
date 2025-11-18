import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { transactionId: string } }
) {
  try {
    if (!params.transactionId) {
      return new NextResponse("Transaction id is required", { status: 400 });
    }

    const transaction = await db.transaction.findUnique({
      where: {
        id: params.transactionId
      }
    });
  
    return NextResponse.json(transaction);
  } catch (error) {
    console.log('[TRANSACTION_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};

export async function DELETE(
  req: Request,
  { params }: { params: { transactionId: string } }
) {
  try {
    if (!params.transactionId) {
      return new NextResponse("Transaction id is required", { status: 400 });
    }

    const transaction = await db.transaction.delete({
      where: {
        id: params.transactionId,
      }
    });
  
    return NextResponse.json(transaction);
  } catch (error) {
    console.log('[TRANSACTION_DELETE]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};


export async function PATCH(
  req: Request,
  { params }: { params: { transactionId: string } }
) {
  try {   
    const body = await req.json();
    
    const { amount, status } = body;
    
    if (!amount) {
      return new NextResponse("Name is required", { status: 400 });
    }

    if (!params.transactionId) {
      return new NextResponse("Transaction id is required", { status: 400 });
    }

    const transaction = await db.transaction.update({
      where: {
        id: params.transactionId,
      },
      data: {
        amount,
        status
      }
    });
  
    return NextResponse.json(transaction);
  } catch (error) {
    console.log('[TRANSACTION_PATCH]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};