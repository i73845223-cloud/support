import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(
  req: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const admin = await currentUser();
    
    if (!admin?.id || admin.role !== 'ADMIN') {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!params.conversationId) {
      return new NextResponse("Conversation id is required", { status: 400 });
    }

    const updatedMessages = await db.message.updateMany({
      where: {
        conversatioId: params.conversationId,
        isReadByAdmin: false
      },
      data: {
        isReadByAdmin: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      updatedCount: updatedMessages.count 
    });
  } catch (error) {
    console.log('[MARK_MESSAGES_READ]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}