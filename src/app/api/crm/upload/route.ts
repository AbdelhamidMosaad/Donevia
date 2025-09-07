
import { NextResponse } from 'next/server';
import { adminAuth, adminStorage } from '@/lib/firebase-admin';
import Busboy from 'busboy';

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

export async function POST(request: Request) {
  try {
    const { fields, files } = await parseForm(request);
    const idToken = fields.idToken;
    const clientId = fields.clientId;

    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;
    
    if (!clientId || files.length === 0) {
      return NextResponse.json({ error: 'Missing clientId or file' }, { status: 400 });
    }

    const { file, filename, mimeType } = files[0];
    const bucket = adminStorage.bucket();
    const filePath = `users/${userId}/crm/${clientId}/${Date.now()}_${filename}`;
    const fileUpload = bucket.file(filePath);
    
    await fileUpload.save(file, {
        metadata: { contentType: mimeType }
    });

    const [url] = await fileUpload.getSignedUrl({
        action: 'read',
        expires: '01-01-2500', // Far-future expiration date
    });

    // Unlike notebook attachments, we don't need to create a firestore doc here.
    // The client will get the URL and add it to the quotation/invoice object.
    return NextResponse.json({ success: true, url, filename, mimeType, size: file.length }, { status: 201 });
  } catch (error) {
    console.error('Error uploading CRM attachment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
