
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import Busboy from 'busboy';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { generateLearningContent } from '@/ai/flows/learning-tool-flow';
import type { LearningContentRequest } from '@/lib/types';


export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to parse multipart form data
async function parseForm(req: Request): Promise<{ fields: Record<string, string>, file?: { buffer: Buffer, mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers as Record<string, string> });
    const fields: Record<string, string> = {};
    let fileData: { buffer: Buffer, mimeType: string } | undefined;
    
    busboy.on('field', (name, val) => {
      fields[name] = val;
    });

    busboy.on('file', (name, fileStream, { filename, mimeType }) => {
      const chunks: Buffer[] = [];
      fileStream.on('data', (chunk) => chunks.push(chunk));
      fileStream.on('end', () => {
        fileData = { buffer: Buffer.concat(chunks), mimeType };
      });
    });
    
    busboy.on('finish', () => resolve({ fields, file: fileData }));
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

// Text extraction logic
async function extractText(file: { buffer: Buffer, mimeType: string }): Promise<string> {
    if (file.mimeType === 'application/pdf') {
        const data = await pdf(file.buffer);
        return data.text;
    } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const { value } = await mammoth.extractRawText({ buffer: file.buffer });
        return value;
    }
    throw new Error('Unsupported file type');
}

export async function POST(request: Request) {
  try {
    const idToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await adminAuth.verifyIdToken(idToken);

    const { fields, file } = await parseForm(request);
    
    let sourceText = '';
    if (file) {
        sourceText = await extractText(file);
    } else if (fields.text) {
        sourceText = fields.text;
    } else {
        return NextResponse.json({ error: 'No text or file provided.' }, { status: 400 });
    }

    if (!sourceText.trim()) {
        return NextResponse.json({ error: 'The provided content is empty.' }, { status: 400 });
    }

    const requestPayload: LearningContentRequest = JSON.parse(fields.requestPayload);

    const aiInput = {
        context: sourceText,
        ...requestPayload
    };

    const generatedData = await generateLearningContent(aiInput);

    return NextResponse.json({ success: true, data: generatedData }, { status: 200 });

  } catch (error) {
    console.error('Error in learning tool generation:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
