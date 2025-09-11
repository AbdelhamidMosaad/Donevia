
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import type { GoogleCalendarEvent } from '@/lib/types';
import { useToast } from './use-toast';

// THIS IS A PLACEHOLDER. In a real app, these would come from your Google Cloud project.
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';

export function useGoogleCalendar() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [googleAuth, setGoogleAuth] = useState<any>(null);
    const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

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
            await window.gapi.client.init({
                apiKey: API_KEY,
                clientId: CLIENT_ID,
                discoveryDocs: [DISCOVERY_DOC],
                scope: SCOPES,
                plugin_name: 'Donevia' // Added for more robust initialization
            });
            const authInstance = window.gapi.auth2.getAuthInstance();
            setGoogleAuth(authInstance);
        } catch (error) {
            console.error("Error initializing Google API client", error);
            toast({ variant: 'destructive', title: "Could not initialize Google Calendar", description: "Please check your Google Cloud Console configuration, especially the 'Authorized JavaScript origins'." });
        }
    }, [toast]);
    
    const loadGapi = useCallback(() => {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
            window.gapi.load('client:auth2', initClient);
        };
        document.body.appendChild(script);
    }, [initClient]);
    
    const listUpcomingEvents = useCallback(async () => {
        if (!googleAuth?.isSignedIn.get()) return;
        setIsSyncing(true);
        try {
            const response = await window.gapi.client.calendar.events.list({
                'calendarId': 'primary',
                'timeMin': (new Date()).toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'maxResults': 50,
                'orderBy': 'startTime'
            });
            setGoogleEvents(response.result.items);
            toast({ title: "Google Calendar synced!" });
        } catch (error) {
            console.error("Error fetching Google Calendar events:", error);
            toast({ variant: 'destructive', title: "Failed to sync calendar" });
        } finally {
            setIsSyncing(false);
        }
    }, [googleAuth, toast]);


    useEffect(() => {
        if (user) {
            loadGapi();
        }
    }, [user, loadGapi]);
    
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
        }
    }, [googleAuth, listUpcomingEvents]);

    const handleAuthClick = () => {
        if (!googleAuth) {
            toast({ variant: 'destructive', title: 'Google API client is not initialized.' });
            return;
        }

        if (googleAuth.isSignedIn.get()) {
            googleAuth.signOut();
        } else {
            googleAuth.signIn();
        }
    };

    return {
        googleAuth,
        googleEvents,
        handleAuthClick,
        isSyncing
    };
}
