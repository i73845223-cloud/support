import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    if (!params.conversationId) {
      return new NextResponse("Conversation id is required", { status: 400 });
    }

    const conversation = await db.conversation.findUnique({
      where: {
        id: params.conversationId
      },
      include: {
        messages: true,
      }
    });
  
    return NextResponse.json(conversation);
  } catch (error) {
    console.log('[CONVERSATION_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};


export async function DELETE(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    if (!params.conversationId) {
      return new NextResponse("Conversation id is required", { status: 400 });
    }

    const conversation = await db.conversation.delete({
      where: {
        id: params.conversationId,
      }
    });
  
    return NextResponse.json(conversation);
  } catch (error) {
    console.log('[CONVERSATION_DELETE]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};


export async function PATCH(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  try {   
    const body = await req.json();
    
    const { topic } = body;
    
    if (!params.conversationId) {
      return new NextResponse("Conversation id is required", { status: 400 });
    }

    const conversation = await db.conversation.update({
      where: {
        id: params.conversationId,
      },
      data: {
        topic
      }
    });
  
    return NextResponse.json(conversation);
  } catch (error) {
    console.log('[CONVERSATION_PATCH]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};