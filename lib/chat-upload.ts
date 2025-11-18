import { put } from '@vercel/blob';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function uploadChatImage(file: File): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type');
  }

  const arrayBuffer = await file.arrayBuffer();
  
  if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
    throw new Error('File size too large');
  }

  const blob = await put(`chat-admin-${Date.now()}-${file.name}`, arrayBuffer, {
    access: 'public',
  });

  return blob.url;
}

export function validateChatImage(file: File): { isValid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File too large' };
  }

  return { isValid: true };
}