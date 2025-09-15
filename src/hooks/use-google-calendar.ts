
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import type { GoogleCalendarEvent, PlannerEvent } from '@/lib/types';
import { useToast } from './use-toast';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/calendar";

// Sync configuration
const SYNC_INTERVAL = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

interface SyncState {
  lastSyncTime: Date | null;
  syncToken: string | null;
  isInitialSync: boolean;
}

interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge' | 'manual';
  onConflict?: (local: PlannerEvent, remote: GoogleCalendarEvent) => PlannerEvent;
}

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  event: Partial<PlannerEvent>;
  retryCount: number;
  timestamp: Date;
}

export function useGoogleCalendar(conflictResolution: ConflictResolution = { strategy: 'remote' }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Core state
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGapiInitialized, setIsGapiInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  
  // Two-way sync state
  const [syncState, setSyncState] = useState<SyncState>({
    lastSyncTime: null,
    syncToken: null,
    isInitialSync: true
  });
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  
  // Refs for cleanup and intervals
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
    const handleOnline = () => {
      setIsOnline(true);
      if (isSignedIn && pendingOperations.length > 0) {
        processPendingOperations();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSignedIn, pendingOperations]);

  const performInitialSync = useCallback(async () => {
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
        setSyncState(prev => ({
          ...prev,
          lastSyncTime: new Date(),
          syncToken: response.result.nextSyncToken || null,
          isInitialSync: false
        }));
        
        toast({ title: "Google Calendar synced!" });
      }
    } catch (error) {
      handleSyncError(error);
    } finally {
      setIsSyncing(false);
    }
  }, [toast]);
  
  const initializeTwoWaySync = useCallback(async () => {
    try {
      await performInitialSync();
      startPeriodicSync();
    } catch (error) {
      console.error("Failed to initialize two-way sync:", error);
      toast({
        variant: 'destructive',
        title: "Sync initialization failed",
        description: "Could not start automatic synchronization"
      });
    }
  }, [performInitialSync, toast]);

  const gapiInit = useCallback(() => {
    window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
    }).then(() => {
      setIsGapiInitialized(true);
      const token = window.gapi.client.getToken();
      if (token) {
        setIsSignedIn(true);
        initializeTwoWaySync();
      }
    }).catch((e: any) => {
      console.error("Error init gapi client", e);
      toast({
        variant: 'destructive',
        title: "Initialization failed",
        description: "Could not initialize Google Calendar API"
      });
    });
  }, [initializeTwoWaySync, toast]);

  const gisInit = useCallback(() => {
    if (!CLIENT_ID) return;
    
    setTokenClient(
      window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
      })
    );
  }, []);

  // Initialize scripts
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
      try {
        if (document.body.contains(gapiScript)) {
          document.body.removeChild(gapiScript);
        }
        if (document.body.contains(gisScript)) {
          document.body.removeChild(gisScript);
        }
      } catch (e) {
        // Scripts may have already been removed
      }
    };
  }, [gapiInit, gisInit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSyncError = useCallback((error: any) => {
    console.error("Sync error:", error);
    
    if (error.result?.error?.code === 401 || error.result?.error?.code === 403) {
      setIsSignedIn(false);
      toast({
        variant: 'destructive',
        title: "Authentication needed",
        description: "Please connect to Google Calendar again."
      });
    } else if (error.result?.error?.code === 429) {
      // Rate limit hit, back off
      setTimeout(() => {
        if (isSignedIn && isOnline) {
          performIncrementalSync();
        }
      }, 60000); // Wait 1 minute
    } else {
      toast({
        variant: 'destructive',
        title: "Sync failed",
        description: "Could not synchronize with Google Calendar"
      });
    }
  }, [isSignedIn, isOnline, toast]);
  
  const hasConflict = useCallback(async (local: GoogleCalendarEvent, remote: GoogleCalendarEvent): Promise<boolean> => {
    const localModified = new Date(local.updated || 0);
    const remoteModified = new Date(remote.updated || 0);
    return Math.abs(localModified.getTime() - remoteModified.getTime()) > 5000; // 5 second threshold
  }, []);
  
  const updateGoogleEventDirect = async (eventId: string, event: Partial<PlannerEvent> | GoogleCalendarEvent) => {
    if (!window.gapi.client.calendar || !isSignedIn) throw new Error('Not authenticated');
    const gcalEvent = {
      'summary': event.title || (event as GoogleCalendarEvent).summary,
      'description': event.description,
      'start': {
        'dateTime': event.start?.toISOString() || (event as GoogleCalendarEvent).start?.dateTime,
        'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      'end': {
        'dateTime': event.end?.toISOString() || (event as GoogleCalendarEvent).end?.dateTime,
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

  const resolveConflict = useCallback(async (local: GoogleCalendarEvent, remote: GoogleCalendarEvent): Promise<GoogleCalendarEvent> => {
    switch (conflictResolution.strategy) {
      case 'local':
        try {
          await updateGoogleEventDirect(local.id!, local);
          return local;
        } catch (error) {
          console.error("Failed to resolve conflict with local version:", error);
          return remote;
        }
      case 'remote':
        return remote;
      case 'merge':
        const localTime = new Date(local.updated || 0);
        const remoteTime = new Date(remote.updated || 0);
        const merged = localTime > remoteTime ? { ...remote, ...local } : { ...local, ...remote };
        try {
          await updateGoogleEventDirect(merged.id!, merged);
          return merged;
        } catch (error) {
          console.error("Failed to resolve conflict with merge:", error);
          return remote;
        }
      case 'manual':
        if (conflictResolution.onConflict) {
          const resolved = conflictResolution.onConflict(local as PlannerEvent, remote);
          try {
            await updateGoogleEventDirect(local.id!, resolved);
            return resolved as GoogleCalendarEvent;
          } catch (error) {
            console.error("Failed to resolve conflict manually:", error);
            return remote;
          }
        }
        return remote;
      default:
        return remote;
    }
  }, [conflictResolution, isSignedIn]);
  
  const processIncrementalChanges = useCallback(async (changes: GoogleCalendarEvent[]) => {
    let updatedEvents = [...googleEvents];
    let hasChanges = false;
    for (const change of changes) {
      const existingIndex = updatedEvents.findIndex(event => event.id === change.id);
      if (change.status === 'cancelled') {
        if (existingIndex !== -1) {
          updatedEvents.splice(existingIndex, 1);
          hasChanges = true;
        }
      } else {
        if (existingIndex !== -1) {
          const localEvent = updatedEvents[existingIndex];
          if (await hasConflict(localEvent, change)) {
            const resolvedEvent = await resolveConflict(localEvent, change);
            updatedEvents[existingIndex] = resolvedEvent;
          } else {
            updatedEvents[existingIndex] = change;
          }
        } else {
          updatedEvents.push(change);
        }
        hasChanges = true;
      }
    }
    if (hasChanges) {
      setGoogleEvents(updatedEvents);
    }
  }, [googleEvents, hasConflict, resolveConflict]);

  const performIncrementalSync = useCallback(async () => {
    if (!window.gapi.client.calendar || !isOnline) return;
    try {
      const params: any = {
        calendarId: 'primary',
        showDeleted: true,
        singleEvents: true,
        maxResults: 250,
      };
      if (syncState.syncToken) {
        params.syncToken = syncState.syncToken;
      } else {
        params.timeMin = syncState.lastSyncTime?.toISOString() || (new Date()).toISOString();
        params.orderBy = 'startTime';
      }
      const response = await window.gapi.client.calendar.events.list(params);
      if (response.result.items && response.result.items.length > 0) {
        await processIncrementalChanges(response.result.items);
        setSyncState(prev => ({
          ...prev,
          lastSyncTime: new Date(),
          syncToken: response.result.nextSyncToken || null
        }));
      }
    } catch (error: any) {
      if (error.result?.error?.code === 410) {
        setSyncState(prev => ({ ...prev, syncToken: null, isInitialSync: true }));
        await performInitialSync();
      } else {
        handleSyncError(error);
      }
    }
  }, [syncState, isOnline, processIncrementalChanges, performInitialSync, handleSyncError]);

  const startPeriodicSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }
    syncIntervalRef.current = setInterval(() => {
      if (isSignedIn && isOnline && !isSyncing) {
        performIncrementalSync();
      }
    }, SYNC_INTERVAL);
  }, [isSignedIn, isOnline, isSyncing, performIncrementalSync]);

  const processPendingOperations = useCallback(async () => {
    if (!isOnline || pendingOperations.length === 0) return;
    const operations = [...pendingOperations];
    const failedOperations: PendingOperation[] = [];
    for (const operation of operations) {
      try {
        switch (operation.type) {
          case 'create':
            await createGoogleEventDirect(operation.event);
            break;
          case 'update':
            await updateGoogleEventDirect(operation.id, operation.event);
            break;
          case 'delete':
            await deleteGoogleEventDirect(operation.id);
            break;
        }
        setPendingOperations(prev => prev.filter(op => op.id !== operation.id));
      } catch (error) {
        console.error(`Failed to process pending operation ${operation.id}:`, error);
        if (operation.retryCount < MAX_RETRY_ATTEMPTS) {
          failedOperations.push({
            ...operation,
            retryCount: operation.retryCount + 1
          });
        } else {
          setPendingOperations(prev => prev.filter(op => op.id !== operation.id));
          toast({
            variant: 'destructive',
            title: "Sync failed",
            description: `Could not sync ${operation.type} operation after ${MAX_RETRY_ATTEMPTS} attempts`
          });
        }
      }
    }
    if (failedOperations.length > 0) {
      setPendingOperations(prev => [
        ...prev.filter(op => !failedOperations.find(fo => fo.id === op.id)),
        ...failedOperations
      ]);
      retryTimeoutRef.current = setTimeout(() => {
        processPendingOperations();
      }, RETRY_DELAY * Math.pow(2, failedOperations[0].retryCount));
    }
  }, [isOnline, pendingOperations, toast, isSignedIn]);

  const addPendingOperation = useCallback((operation: Omit<PendingOperation, 'retryCount' | 'timestamp'>) => {
    const pendingOp: PendingOperation = {
      ...operation,
      retryCount: 0,
      timestamp: new Date()
    };
    setPendingOperations(prev => [...prev, pendingOp]);
    if (isOnline) {
      setTimeout(() => processPendingOperations(), 100);
    }
  }, [isOnline, processPendingOperations]);

  const handleAuthClick = useCallback(() => {
    if (!tokenClient) return;

    if (window.gapi.client.getToken() === null) {
      tokenClient.callback = async (resp: any) => {
        if (resp.error !== undefined) {
          throw(resp);
        }
        setIsSignedIn(true);
        await initializeTwoWaySync();
      };
      tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
      window.google.accounts.oauth2.revoke(window.gapi.client.getToken().access_token, () => {
        window.gapi.client.setToken(null);
        setIsSignedIn(false);
        setGoogleEvents([]);
        setPendingOperations([]);
        setSyncState({
          lastSyncTime: null,
          syncToken: null,
          isInitialSync: true
        });
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
        toast({ title: "Signed out of Google Calendar" });
      });
    }
  }, [tokenClient, initializeTwoWaySync, toast]);

  const createGoogleEventDirect = async (event: Partial<PlannerEvent>) => {
    if (!window.gapi.client.calendar || !isSignedIn) throw new Error('Not authenticated');
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
  
  const deleteGoogleEventDirect = async (eventId: string) => {
    if (!window.gapi.client.calendar || !isSignedIn) throw new Error('Not authenticated');
    const request = window.gapi.client.calendar.events.delete({
      'calendarId': 'primary',
      'eventId': eventId,
    });
    await request;
  };

  const createGoogleEvent = useCallback(async (event: Partial<PlannerEvent>) => {
    if (!isOnline) {
      addPendingOperation({
        id: `create_${Date.now()}`,
        type: 'create',
        event
      });
      toast({ title: "Event queued for sync when online" });
      return null;
    }
    try {
      return await createGoogleEventDirect(event);
    } catch (error) {
      addPendingOperation({
        id: `create_${Date.now()}`,
        type: 'create',
        event
      });
      throw error;
    }
  }, [isOnline, addPendingOperation, toast, isSignedIn]);

  const updateGoogleEvent = useCallback(async (eventId: string, event: Partial<PlannerEvent>) => {
    if (!isOnline) {
      addPendingOperation({
        id: eventId,
        type: 'update',
        event
      });
      toast({ title: "Update queued for sync when online" });
      return;
    }
    try {
      await updateGoogleEventDirect(eventId, event);
    } catch (error) {
      addPendingOperation({
        id: eventId,
        type: 'update',
        event
      });
      throw error;
    }
  }, [isOnline, addPendingOperation, toast, isSignedIn]);

  const deleteGoogleEvent = useCallback(async (eventId: string) => {
    if (!isOnline) {
      addPendingOperation({
        id: eventId,
        type: 'delete',
        event: {}
      });
      toast({ title: "Deletion queued for sync when online" });
      return;
    }
    try {
      await deleteGoogleEventDirect(eventId);
    } catch (error) {
      addPendingOperation({
        id: eventId,
        type: 'delete',
        event: {}
      });
      throw error;
    }
  }, [isOnline, addPendingOperation, toast, isSignedIn]);

  const forceSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    await performIncrementalSync();
    await processPendingOperations();
  }, [isOnline, isSyncing, performIncrementalSync, processPendingOperations]);

  return {
    isSignedIn,
    googleEvents,
    isSyncing,
    isGapiLoaded: isGapiInitialized,
    isOnline,
    pendingOperationsCount: pendingOperations.length,
    lastSyncTime: syncState.lastSyncTime,
    handleAuthClick,
    createGoogleEvent,
    updateGoogleEvent,
    deleteGoogleEvent,
    forceSync,
    listUpcomingEvents: performIncrementalSync,
  };
}
