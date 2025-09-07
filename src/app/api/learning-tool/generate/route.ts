
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { generateLearningContent } from '@/ai/flows/learning-tool-flow';
import type { LearningContentRequest } from '@/lib/types';
import formidable from 'formidable';
import fs from 'fs/promises';
import mammoth from 'mammoth';
import pdf from 'pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js';


// Helper to parse multipart form data
async function parseForm(req: Request): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
    const formidableReq = req as any;
    return new Promise((resolve, reject) => {
        const form = formidable({});
        form.parse(formidableReq, (err, fields, files) => {
            if (err) {
                reject(err);
            } else {
                resolve({ fields, files });
            }
        });
    });
}

// Helper to extract text from a file buffer
async function extractTextFromFile(file: formidable.File): Promise<string> {
    const buffer = await fs.readFile(file.filepath);
    
    if (file.mimetype === 'application/pdf') {
        const data = await pdf(buffer);
        return data.text;
    } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const { value } = await mammoth.extractRawText({ buffer });
        return value;
    } else if (file.mimetype === 'text/plain') {
        return buffer.toString('utf-8');
    }

    throw new Error('Unsupported file type.');
}


export async function POST(request: Request) {
  try {
    const { fields, files } = await parseForm(request);

    const idToken = Array.isArray(fields.idToken) ? fields.idToken[0] : fields.idToken;
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await adminAuth.verifyIdToken(idToken);
    
    const requestDataStr = Array.isArray(fields.requestData) ? fields.requestData[0] : fields.requestData;
    if(!requestDataStr) {
        return NextResponse.json({ error: 'Missing request data.' }, { status: 400 });
    }
    const requestData: LearningContentRequest = JSON.parse(requestDataStr);

    let context = requestData.context;

    // If there's a file, extract its text and append to context
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (file) {
        try {
            const fileText = await extractTextFromFile(file);
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

export const config = {
  api: {
    bodyParser: false,
  },
};
