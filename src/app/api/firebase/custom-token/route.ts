// src/app/api/calendar-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminApp } from '@/lib/firebase-admin';
import { google } from 'googleapis';
import { getAuth } from 'firebase-admin/auth';
import type { PlannerEvent } from '@/lib/types';
import moment from 'moment';

const getOauth2Client = async (uid: string) => {
  const adminApp = await getFirebaseAdminApp();
  if (!adminApp) throw new Error("Firebase Admin not initialized");
  
  const db = adminApp.firestore();

  const tokenDoc = await db.collection('users').doc(uid).collection('googleAuthTokens').doc('primary').get();
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
  if (tokens?.expiryDate && tokens.expiryDate < Date.now()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      // Save the new tokens
      await db.collection('users').doc(uid).collection('googleAuthTokens').doc('primary').set(credentials, { merge: true });
    } catch(err) {
      console.error("Failed to refresh token", err);
      throw new Error("Failed to refresh Google auth token.");
    }
  }

  return oauth2Client;
}


export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await getAuth().verifyIdToken(token);
        const uid = decodedToken.uid;
        
        const oauth2Client = await getOauth2Client(uid);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        const { action, eventId, event } = await request.json();

        switch (action) {
            case 'create':
                const newEvent = await calendar.events.insert({
                    calendarId: 'primary',
                    resource: {
                        summary: event.title,
                        description: event.description,
                        start: event.allDay ? { date: moment(event.start).format('YYYY-MM-DD') } : { dateTime: moment(event.start).toISOString() },
                        end: event.allDay ? { date: moment(event.end).format('YYYY-MM-DD') } : { dateTime: moment(event.end).toISOString() },
                    },
                });
                return NextResponse.json(newEvent.data);
            case 'update':
                const updatedEvent = await calendar.events.update({
                    calendarId: 'primary',
                    eventId: eventId,
                    resource: {
                        summary: event.title,
                        description: event.description,
                        start: event.allDay ? { date: moment(event.start).format('YYYY-MM-DD') } : { dateTime: moment(event.start).toISOString() },
                        end: event.allDay ? { date: moment(event.end).format('YYYY-MM-DD') } : { dateTime: moment(event.end).toISOString() },
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
        console.error("Calendar proxy error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
