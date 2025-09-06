
import { NextResponse } from 'next/server';
import { adminDb, adminAuth, adminStorage } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import Busboy from 'busboy';
import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to parse multipart form data
async function parseForm(req: Request): Promise<{ fields: Record<string, string>, files: { file: Buffer, filename: string, mimeType: string }[] }> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers as Record<string, string> });
    const fields: Record<string, string> = {};
    const files: { file: Buffer, filename: string, mimeType: string }[] = [];
    const fileWrites: Promise<void>[] = [];

    busboy.on('field', (name, val) => {
      fields[name] = val;
    });

    busboy.on('file', (name, fileStream, { filename, mimeType }) => {
      const chunks: Buffer[] = [];
      const writePromise = new Promise<void>((resolveFile, rejectFile) => {
        fileStream.on('data', (chunk) => chunks.push(chunk));
        fileStream.on('end', () => {
          files.push({ file: Buffer.concat(chunks), filename, mimeType });
          resolveFile();
        });
        fileStream.on('error', rejectFile);
      });
      fileWrites.push(writePromise);
    });
    
    busboy.on('finish', async () => {
      try {
        await Promise.all(fileWrites);
        resolve({ fields, files });
      } catch (error) {
        reject(error);
      }
    });

    busboy.on('error', reject);

    if (req.body) {
        const reader = (req.body as any).getReader();
        const read = async () => {
            const { done, value } = await reader.read();
            if (done) {
                busboy.end();
                return;
            }
            busboy.write(value);
            read();
        };
        read();
    } else {
        busboy.end();
    }
  });
}


async function generateThumbnail(imageBuffer: Buffer): Promise<Buffer> {
    return sharp(imageBuffer)
        .resize({ width: 200, height: 200, fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer();
}


export async function POST(request: Request) {
  try {
    const { fields, files } = await parseForm(request);
    const idToken = fields.idToken;
    const pageId = fields.pageId;

    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    if (!pageId || files.length === 0) {
      return NextResponse.json({ error: 'Missing pageId or file' }, { status: 400 });
    }

    const { file, filename, mimeType } = files[0];
    const bucket = adminStorage.bucket();
    const filePath = `users/${userId}/attachments/${pageId}/${Date.now()}_${filename}`;
    const fileUpload = bucket.file(filePath);
    
    await fileUpload.save(file, {
        metadata: { contentType: mimeType }
    });

    const [url] = await fileUpload.getSignedUrl({
        action: 'read',
        expires: '01-01-2500', // Far-future expiration date
    });

    let thumbnailUrl: string | null = null;
    if (mimeType.startsWith('image/')) {
        const thumbnailBuffer = await generateThumbnail(file);
        const thumbPath = `users/${userId}/attachments/${pageId}/thumb_${Date.now()}_${filename}`;
        const thumbFileUpload = bucket.file(thumbPath);
        await thumbFileUpload.save(thumbnailBuffer, {
            metadata: { contentType: 'image/jpeg' }
        });
         [thumbnailUrl] = await thumbFileUpload.getSignedUrl({
            action: 'read',
            expires: '01-01-2500',
        });
    }

    const attachmentData = {
        pageId,
        filename,
        url,
        thumbnailUrl,
        mimeType,
        size: file.length,
        uploadedAt: Timestamp.now(),
        userId,
    };

    const attachmentRef = await adminDb.collection('users').doc(userId).collection('attachments').add(attachmentData);

    return NextResponse.json({ success: true, attachmentId: attachmentRef.id, url, thumbnailUrl }, { status: 201 });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
