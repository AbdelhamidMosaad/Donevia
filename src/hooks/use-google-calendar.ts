
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import type { GoogleCalendarEvent, PlannerEvent } from '@/lib/types';
import { useToast } from './use-toast';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar";

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let gapiInited = false;
let gisInited = false;

export function useGoogleCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGapiInitialized, setIsGapiInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const gapiInit = useCallback(() => {
    window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
    }).then(() => {
        setIsGapiInitialized(true);
        // Check if user is already signed in
        const token = window.gapi.client.getToken();
        if (token) {
            setIsSignedIn(true);
            listUpcomingEvents();
        }
    }).catch((e:any) => console.error("Error init gapi client", e));
  }, []);

  const gisInit = useCallback(() => {
      if (!CLIENT_ID) {
          return;
      }
      setTokenClient(
        window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: '', // defined later
        })
      );
  }, []);

  useEffect(() => {
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => window.gapi.load('client', gapiInit);
    document.body.appendChild(gapiScript);

    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = gisInit;
    document.body.appendChild(gisScript);

    return () => {
        document.body.removeChild(gapiScript);
        document.body.removeChild(gisScript);
    }
  }, [gapiInit, gisInit]);


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
      const err = error as any;
      if (err.result?.error?.code === 401 || err.result?.error?.code === 403) {
          // Token might have expired or been revoked, prompt for sign-in again.
          setIsSignedIn(false);
          toast({ 
            variant: 'destructive', 
            title: "Authentication needed",
            description: "Please connect to Google Calendar again."
          });
      } else {
         toast({ 
            variant: 'destructive', 
            title: "Failed to sync calendar",
            description: "Could not retrieve calendar events."
          });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [toast]);
  

  const handleAuthClick = () => {
    if (!tokenClient) return;

    if (window.gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        tokenClient.callback = async (resp: any) => {
            if (resp.error !== undefined) {
              throw(resp);
            }
            setIsSignedIn(true);
            await listUpcomingEvents();
        };
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        // User is already signed in, so sign them out
        window.google.accounts.oauth2.revoke(window.gapi.client.getToken().access_token, () => {
            window.gapi.client.setToken(null);
            setIsSignedIn(false);
            setGoogleEvents([]);
            toast({ title: "Signed out of Google Calendar" });
        });
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
    const response = await request;
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
    await request;
  };

  const deleteGoogleEvent = async (eventId: string) => {
    if (!window.gapi.client.calendar || !isSignedIn) return;
    const request = window.gapi.client.calendar.events.delete({
      'calendarId': 'primary',
      'eventId': eventId,
    });
    await request;
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
