
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import type { GoogleCalendarEvent, PlannerEvent } from '@/lib/types';
import { useToast } from './use-toast';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar'; // Changed to full access

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let gapiLoaded = false;
let gisLoaded = false;

export function useGoogleCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGapiInitialized, setIsGapiInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const loadGapiScript = useCallback(() => {
    if (gapiLoaded) return;
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('client', async () => {
        if (!API_KEY) {
            console.error("Missing Google API Key");
            return;
        }
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: [DISCOVERY_DOC],
        });
        setIsGapiInitialized(true);
      });
    };
    document.body.appendChild(script);
    gapiLoaded = true;
  }, []);

  const loadGisScript = useCallback(() => {
    if (gisLoaded) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
        if (!CLIENT_ID) {
            console.error("Missing Google Client ID");
            return;
        }
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // defined later
        });
        setTokenClient(client);
    };
    document.body.appendChild(script);
    gisLoaded = true;
  }, []);

  useEffect(() => {
    if (user) {
      loadGapiScript();
      loadGisScript();
    }
  }, [user, loadGapiScript, loadGisScript]);


  const listUpcomingEvents = useCallback(async () => {
    if (!window.gapi.client.calendar) return;
    
    setIsSyncing(true);
    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 250,
        orderBy: 'startTime'
      });
      
      if (response.result.items) {
        setGoogleEvents(response.result.items);
        toast({ title: "Google Calendar synced!" });
      }
    } catch (error) {
      console.error("Error fetching Google Calendar events:", error);
      toast({ 
        variant: 'destructive', 
        title: "Failed to sync calendar",
        description: "Please ensure you're signed in and have calendar access."
      });
    } finally {
      setIsSyncing(false);
    }
  }, [toast]);
  

  const handleAuthClick = () => {
    if (!tokenClient) return;

    if (window.gapi.client.getToken() === null) {
        tokenClient.callback = async (resp: any) => {
            if (resp.error !== undefined) {
              throw(resp);
            }
            setIsSignedIn(true);
            await listUpcomingEvents();
        };
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        window.gapi.client.setToken(null);
        setIsSignedIn(false);
        setGoogleEvents([]);
        toast({ title: "Signed out of Google Calendar" });
    }
  };
  
  const createGoogleEvent = async (event: Partial<PlannerEvent>) => {
    if (!window.gapi.client.calendar || !isSignedIn) return null;
    const gcalEvent = {
      'summary': event.title,
      'description': event.description,
      'start': {
        'dateTime': event.start?.toISOString(),
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      'end': {
        'dateTime': event.end?.toISOString(),
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
    const request = window.gapi.client.calendar.events.insert({
      'calendarId': 'primary',
      'resource': gcalEvent,
    });
    const response = await request.execute();
    return response.result.id;
  };

  const updateGoogleEvent = async (eventId: string, event: Partial<PlannerEvent>) => {
    if (!window.gapi.client.calendar || !isSignedIn) return;
    const gcalEvent = {
      'summary': event.title,
      'description': event.description,
      'start': {
        'dateTime': event.start?.toISOString(),
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      'end': {
        'dateTime': event.end?.toISOString(),
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
    const request = window.gapi.client.calendar.events.update({
      'calendarId': 'primary',
      'eventId': eventId,
      'resource': gcalEvent,
    });
    await request.execute();
  };

  const deleteGoogleEvent = async (eventId: string) => {
    if (!window.gapi.client.calendar || !isSignedIn) return;
    const request = window.gapi.client.calendar.events.delete({
      'calendarId': 'primary',
      'eventId': eventId,
    });
    await request.execute();
  };


  return {
    isSignedIn,
    googleEvents,
    handleAuthClick,
    isSyncing,
    isGapiLoaded: isGapiInitialized,
    createGoogleEvent,
    updateGoogleEvent,
    deleteGoogleEvent,
    listUpcomingEvents,
  };
}
