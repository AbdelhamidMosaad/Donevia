'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import type { GoogleCalendarEvent } from '@/lib/types';
import { useToast } from './use-toast';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

// Add type declarations for gapi
declare global {
  interface Window {
    gapi: any;
  }
}

export function useGoogleCalendar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [googleAuth, setGoogleAuth] = useState<any>(null);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [gapiLoaded, setGapiLoaded] = useState(false);

  const initClient = useCallback(async () => {
    if (!CLIENT_ID || !API_KEY) {
      console.error("Missing Google API Key or Client ID");
      toast({
        variant: 'destructive',
        title: "Google Calendar Not Configured",
        description: "Please provide NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_API_KEY in your environment variables.",
        duration: 10000,
      });
      return;
    }

    try {
      // First load the client
      await window.gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: [DISCOVERY_DOC],
        scope: SCOPES,
      });
      
      // Then initialize auth2
      await window.gapi.auth2.init({
        client_id: CLIENT_ID,
        scope: SCOPES,
      });
      
      const authInstance = window.gapi.auth2.getAuthInstance();
      setGoogleAuth(authInstance);
      setGapiLoaded(true);
      
    } catch (error) {
      console.error("Error initializing Google API client", error);
      toast({ 
        variant: 'destructive', 
        title: "Could not initialize Google Calendar", 
        description: "Please check your Google Cloud Console configuration, especially the 'Authorized JavaScript origins'." 
      });
    }
  }, [toast]);

  const loadGapi = useCallback(() => {
    // Check if gapi is already loaded
    if (window.gapi) {
      initClient();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('client:auth2', initClient);
    };
    script.onerror = () => {
      console.error("Failed to load Google API script");
      toast({
        variant: 'destructive',
        title: "Failed to load Google Calendar",
        description: "Could not load required Google API scripts. Check your network connection."
      });
    };
    document.body.appendChild(script);
  }, [initClient, toast]);

  const listUpcomingEvents = useCallback(async () => {
    if (!googleAuth?.isSignedIn?.get()) return;
    
    setIsSyncing(true);
    try {
      const response = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        showDeleted: false,
        singleEvents: true,
        maxResults: 50,
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
  }, [googleAuth, toast]);

  useEffect(() => {
    if (user && !gapiLoaded) {
      loadGapi();
    }
  }, [user, gapiLoaded, loadGapi]);

  useEffect(() => {
    if (googleAuth) {
      const updateSigninStatus = (isSignedIn: boolean) => {
        if (isSignedIn) {
          listUpcomingEvents();
        } else {
          setGoogleEvents([]);
        }
      };
      
      googleAuth.isSignedIn.listen(updateSigninStatus);
      updateSigninStatus(googleAuth.isSignedIn.get());
      
      // Cleanup listener
      return () => {
        if (googleAuth.isSignedIn?.listen) {
          googleAuth.isSignedIn.listen(() => {});
        }
      };
    }
  }, [googleAuth, listUpcomingEvents]);

  const handleAuthClick = () => {
    if (!googleAuth) {
      toast({ 
        variant: 'destructive', 
        title: 'Google API client is not initialized.' 
      });
      return;
    }

    try {
      if (googleAuth.isSignedIn.get()) {
        googleAuth.signOut();
        toast({ title: "Signed out of Google Calendar" });
      } else {
        googleAuth.signIn();
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast({
        variant: 'destructive',
        title: "Authentication failed",
        description: "Could not complete Google sign-in. Please try again."
      });
    }
  };

  return {
    googleAuth,
    googleEvents,
    handleAuthClick,
    isSyncing,
    isGapiLoaded: gapiLoaded
  };
}