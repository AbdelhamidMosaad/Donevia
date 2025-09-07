
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { generateLearningContent } from '@/ai/flows/learning-tool-flow';
import type { LearningContentRequest } from '@/lib/types';
import mammoth from 'mammoth';
import pdf from 'pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js';
import Busboy from 'busboy';


// Helper to extract text from a file buffer
async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === 'application/pdf') {
        const data = await pdf(buffer);
        return data.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const { value } = await mammoth.extractRawText({ buffer });
        return value;
    } else if (mimeType === 'text/plain') {
        return buffer.toString('utf-8');
    }

    throw new Error('Unsupported file type.');
}

async function parseForm(req: Request): Promise<{ fields: Record<string, string>, file?: Buffer, mimeType?: string }> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers as Record<string, string> });
    const fields: Record<string, string> = {};
    let fileBuffer: Buffer | undefined;
    let fileMimeType: string | undefined;

    busboy.on('field', (name, val) => {
      fields[name] = val;
    });

    busboy.on('file', (name, fileStream, { filename, mimeType }) => {
      const chunks: Buffer[] = [];
      fileMimeType = mimeType;
      fileStream.on('data', (chunk) => chunks.push(chunk));
      fileStream.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on('finish', () => {
      resolve({ fields, file: fileBuffer, mimeType: fileMimeType });
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
    const { fields, file, mimeType } = await parseForm(request);
    
    const idToken = fields.idToken;
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await adminAuth.verifyIdToken(idToken);
    
    const requestDataStr = fields.requestData;
    if(!requestDataStr) {
        return NextResponse.json({ error: 'Missing request data.' }, { status: 400 });
    }
    const requestData: LearningContentRequest = JSON.parse(requestDataStr);

    let context = requestData.context;

    // If there's a file, extract its text and append to context
    if (file && mimeType) {
        try {
            const fileText = await extractTextFromFile(file, mimeType);
            context += `\n\n--- DOCUMENT CONTENT ---\n${fileText}`;
        } catch (e) {
            return NextResponse.json({ error: (e as Error).message }, { status: 400 });
        }
    }
    
    if (!context.trim()) {
        return NextResponse.json({ error: 'No content provided. Please upload a file or paste text.' }, { status: 400 });
    }

    const generationRequest: LearningContentRequest = { ...requestData, context };

    const generatedData = await generateLearningContent(generationRequest);

    return NextResponse.json(generatedData, { status: 200 });

  } catch (error) {
    console.error('Error in learning tool API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
