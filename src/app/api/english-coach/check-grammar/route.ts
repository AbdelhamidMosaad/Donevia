
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { checkGrammarWithAI } from '@/ai/flows/grammar-coach-flow';


export async function POST(request: Request) {
  try {
    const idToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userId = decodedToken.uid;

    const body: { text: string; mode: 'languagetool' | 'sapling' | 'gemini' } = await request.json();
    
    if (!body.text || body.text.length < 5) {
        return NextResponse.json({ error: 'Text input is required and must be at least 5 characters.' }, { status: 400 });
    }
    
    let result;

    if (body.mode === 'gemini') {
        result = await checkGrammarWithAI({ text: body.text });
    } else if (body.mode === 'sapling') {
      const SAPLING_API_KEY = process.env.SAPLING_API_KEY;
      if (!SAPLING_API_KEY) {
        return NextResponse.json({ error: 'Sapling AI API key not configured.' }, { status: 500 });
      }

      const saplingResponse = await fetch('https://api.sapling.ai/api/v1/edits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: SAPLING_API_KEY,
          session_id: userId, // Use user ID for a consistent session
          text: body.text,
        }),
      });
      
      if (!saplingResponse.ok) {
        const errorText = await saplingResponse.text();
        console.error('Sapling AI API error:', errorText);
        return NextResponse.json({ error: 'Failed to communicate with Sapling AI service.' }, { status: saplingResponse.status });
      }
      result = await saplingResponse.json();

    } else {
      // Default to LanguageTool
      const params = new URLSearchParams();
      params.append('text', body.text);
      params.append('language', 'en-US');

      const languagetoolResponse = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });

      if (!languagetoolResponse.ok) {
          const errorText = await languagetoolResponse.text();
          console.error('LanguageTool API error:', errorText);
          return NextResponse.json({ error: 'Failed to communicate with grammar service.' }, { status: languagetoolResponse.status });
      }
      result = await languagetoolResponse.json();
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error in grammar check API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
