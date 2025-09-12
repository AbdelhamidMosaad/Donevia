
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const idToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await adminAuth.verifyIdToken(idToken);

    const body: { text: string; mode: 'languagetool' | 'ginger' } = await request.json();
    
    if (!body.text || body.text.length < 5) {
        return NextResponse.json({ error: 'Text input is required and must be at least 5 characters.' }, { status: 400 });
    }
    
    let result;

    if (body.mode === 'ginger') {
      const GINGER_API_KEY = process.env.GINGER_API_KEY || 'YOUR_GINGER_API_KEY';
      if (GINGER_API_KEY === 'YOUR_GINGER_API_KEY') {
        return NextResponse.json({ error: 'Ginger API key not configured.' }, { status: 500 });
      }

      const gingerResponse = await fetch(`https://services.gingersoftware.com/Ginger/correct/json/GingerTheText?apiKey=${GINGER_API_KEY}&lang=US&text=${encodeURIComponent(body.text)}`, {
        method: 'GET',
      });
      
      if (!gingerResponse.ok) {
        const errorText = await gingerResponse.text();
        console.error('Ginger API error:', errorText);
        return NextResponse.json({ error: 'Failed to communicate with Ginger service.' }, { status: gingerResponse.status });
      }
      result = await gingerResponse.json();
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
