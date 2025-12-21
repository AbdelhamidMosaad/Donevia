import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminApp, isFirebaseAvailable } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase is available
    if (!isFirebaseAvailable()) {
      return NextResponse.json(
        { error: 'Firebase not configured' }, 
        { status: 503 }
      );
    }

    // Get Firebase app (initializes if needed)
    const app = await getFirebaseAdminApp();
    if (!app) {
      return NextResponse.json(
        { error: 'Failed to initialize Firebase' }, 
        { status: 500 }
      );
    }

    // Your existing upload logic here
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Process the file...
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notes uploaded successfully' 
    });

  } catch (error) {
    console.error('Notes upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: error.message 
    }, { status: 500 });
  }
}