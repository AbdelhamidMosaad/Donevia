
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import type { GoogleCalendarEvent } from '@/lib/types';
import { useToast } from './use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export function useGoogleCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const listUpcomingEvents = useCallback(async () => {
    if (!isSignedIn) {
      toast({
        variant: 'destructive',
        title: 'Not Connected',
        description: 'Please connect to Google Calendar first.',
      });
      return;
    }
    setIsSyncing(true);
    try {
      const response = await window.gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 100, // Fetch more events
        'orderBy': 'startTime'
      });
      setGoogleEvents(response.result.items);
      toast({ title: "Google Calendar synced!" });
    } catch (error: any) {
      console.error("Error fetching Google Calendar events:", error);
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: error.result?.error?.message || 'Could not fetch calendar events.'
      });
    } finally {
      setIsSyncing(false);
    }
  }, [isSignedIn, toast]);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const error = searchParams.get('error');

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: `Failed to sign in with Google: ${error}`,
      });
      router.replace('/planner');
    }

    if (accessToken) {
      setIsSignedIn(true);
      window.gapi.client.setToken({ access_token: accessToken });
      listUpcomingEvents();
      // Clean up URL
      router.replace('/planner');
    }

  }, [searchParams, router, toast, listUpcomingEvents]);

  const handleAuthClick = () => {
    if (isSignedIn) {
      // Basic disconnect for client-side token
      window.gapi.client.setToken(null);
      setIsSignedIn(false);
      setGoogleEvents([]);
      toast({ title: "Disconnected from Google Calendar" });
    } else {
      window.location.href = '/api/auth/google';
    }
  };

  useEffect(() => {
    const loadGapi = () => {
      if (window.gapi) {
        window.gapi.load('client', async () => {
          await window.gapi.client.init({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
          });
        });
      }
    };
    
    if (typeof window !== 'undefined' && !window.gapi) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = loadGapi;
        document.head.appendChild(script);
    } else if (window.gapi) {
        loadGapi();
    }

  }, []);

  return {
    isSignedIn,
    googleEvents,
    isSyncing,
    handleAuthClick, // This name is now a bit misleading but kept for simplicity
    listUpcomingEvents,
    // The other functions are removed as they are part of a more complex flow
    // that isn't fully implemented here.
  };
}
