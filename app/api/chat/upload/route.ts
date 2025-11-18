import { currentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createWriteStream, mkdirSync, existsSync } from "fs";
import path from "path";

export async function POST(request: Request) {
    try {
        const user = await currentUser();
        if (!user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new NextResponse("No file provided", { status: 400 });
        }

        const uploadsDir = path.join(process.cwd(), "public", "uploads", "chat");
        if (!existsSync(uploadsDir)) {
            mkdirSync(uploadsDir, { recursive: true });
        }

        const fileExtension = file.name.split('.').pop();
        const filename = `chat-${Date.now()}.${fileExtension}`;
        const filepath = path.join(uploadsDir, filename);
        
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        
        const writeStream = createWriteStream(filepath);
        writeStream.write(buffer);
        writeStream.end();

        await new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });

        const imageUrl = `/uploads/chat/${filename}`;

        return NextResponse.json({ imageUrl });
    } catch (error) {
        console.error('Upload error:', error);
        return new NextResponse("Internal error", { status: 500 });
    }
}