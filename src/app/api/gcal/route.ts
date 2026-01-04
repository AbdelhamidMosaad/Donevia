
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { google, type Auth } from 'googleapis';
import type { PlannerEvent } from '@/lib/types';
import moment from 'moment';

async function getOauth2Client(uid: string): Promise<Auth.OAuth2Client> {
  const adminApp = await getFirebaseAdminApp();
  if (!adminApp) throw new Error('Firebase Admin not initialized');
  const db = adminApp.firestore();
  
  const tokenDocRef = db.collection('users').doc(uid).collection('googleAuthTokens').doc('primary');
  const tokenDoc = await tokenDocRef.get();

  if (!tokenDoc.exists) {
    throw new Error('User not authenticated with Google');
  }
  const tokens = tokenDoc.data();

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  
  oauth2Client.setCredentials(tokens as any);
  
  // Handle token refresh if needed
  if (tokens?.expiry_date && tokens.expiry_date < Date.now()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      // Save the new tokens
      await tokenDocRef.set(credentials, { merge: true });
    } catch (err) {
      console.error('Failed to refresh token', err);
      // If refresh fails, delete the token doc to force re-authentication
      await tokenDocRef.delete();
      throw new Error('Failed to refresh Google auth token. Please reconnect your calendar.');
    }
  }

  return oauth2Client;
}


// Start OAuth flow
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get('uid');

  if (!uid) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent',
    state: uid,
  });

  return NextResponse.redirect(authUrl);
}

// OAuth Callback & API Proxy
export async function POST(request: NextRequest) {
  const adminApp = await getFirebaseAdminApp();
  if (!adminApp) {
    return NextResponse.json({ error: 'Backend not configured' }, { status: 500 });
  }
  const auth = adminApp.auth();

  const idToken = request.headers.get('Authorization')?.split('Bearer ')[1];
  if (!idToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const body = await request.json();
    const { action, eventId, event, code } = body;
    
    // Handle OAuth Callback
    if (action === 'oauth_callback') {
      if (!code) {
        return NextResponse.json({ error: 'Authorization code is missing' }, { status: 400 });
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
      
      const { tokens } = await oauth2Client.getToken(code);
      
      await adminApp.firestore().collection('users').doc(uid).collection('googleAuthTokens').doc('primary').set(tokens, { merge: true });

      return NextResponse.json({ success: true, message: 'Successfully authenticated with Google.' });
    }
    
    // Handle Calendar API actions
    const oauth2Client = await getOauth2Client(uid);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    switch (action) {
      case 'create':
        const newEvent = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: event.title,
            description: event.description,
            start: event.allDay ? { date: moment(event.start).format('YYYY-MM-DD') } : { dateTime: new Date(event.start).toISOString() },
            end: event.allDay ? { date: moment(event.end).format('YYYY-MM-DD') } : { dateTime: new Date(event.end).toISOString() },
          },
        });
        return NextResponse.json(newEvent.data);
      
      case 'update':
        const updatedEvent = await calendar.events.update({
          calendarId: 'primary',
          eventId: eventId,
          requestBody: {
            summary: event.title,
            description: event.description,
            start: event.allDay ? { date: moment(event.start).format('YYYY-MM-DD') } : { dateTime: new Date(event.start).toISOString() },
            end: event.allDay ? { date: moment(event.end).format('YYYY-MM-DD') } : { dateTime: new Date(event.end).toISOString() },
          },
        });
        return NextResponse.json(updatedEvent.data);
        
      case 'delete':
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: eventId,
        });
        return NextResponse.json({ success: true });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Google Calendar API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
