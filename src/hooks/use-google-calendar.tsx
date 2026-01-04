
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { useToast } from './use-toast';
import { fetchWithAuth } from '@/lib/client-helpers';
import type { PlannerEvent } from '@/lib/types';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface GoogleCalendarContextType {
  isConnected: boolean;
  isLoading: boolean;
  connect: () => void;
  disconnect: () => void;
  createGoogleEvent: (event: PlannerEvent) => Promise<any>;
  updateGoogleEvent: (eventId: string, event: PlannerEvent) => Promise<any>;
  deleteGoogleEvent: (eventId: string) => Promise<any>;
}

const GoogleCalendarContext = createContext<
  GoogleCalendarContextType | undefined
>(undefined);


export function useGoogleCalendar() {
  const context = useContext(GoogleCalendarContext);
  if (!context) {
    throw new Error(
      'useGoogleCalendar must be used within a GoogleCalendarProvider'
    );
  }
  return context;
}

export function GoogleCalendarProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (code && state && user && state === user.uid) {
      setIsLoading(true);
      fetchWithAuth('/api/gcal', {
        method: 'POST',
        body: JSON.stringify({ action: 'oauth_callback', code }),
      })
      .then(() => {
          toast({ title: 'Success!', description: 'Google Calendar connected.' });
          // Clean the URL
          router.replace(pathname);
      })
      .catch((e) => {
          console.error('OAuth callback failed', e);
          toast({ variant: 'destructive', title: 'Connection Failed', description: e.message });
      })
      .finally(() => {
          setIsLoading(false);
      });
    }
  }, [searchParams, user, toast, router, pathname]);
  

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      const tokenDocRef = doc(
        db,
        'users',
        user.uid,
        'googleAuthTokens',
        'primary'
      );
      const unsubscribe = onSnapshot(
        tokenDocRef,
        (docSnap) => {
          setIsConnected(docSnap.exists());
          setIsLoading(false);
        },
        (error) => {
          console.error('Error checking Google Calendar connection:', error);
          setIsLoading(false);
        }
      );
      return () => unsubscribe();
    } else {
      setIsConnected(false);
      setIsLoading(false);
    }
  }, [user]);

  const connect = useCallback(async () => {
    if (!user) return;
    // Redirect to our own API route which will then generate the Google URL
    window.location.href = `/api/gcal?uid=${user.uid}`;
  }, [user]);

  const disconnect = useCallback(async () => {
    if (!user) return;
    const tokenDocRef = doc(db, 'users', user.uid, 'googleAuthTokens', 'primary');
    try {
      await deleteDoc(tokenDocRef);
      toast({ title: 'Google Calendar disconnected.' });
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not disconnect Google Calendar.',
      });
    }
  }, [user, toast]);
  
  const createGoogleEvent = async (event: PlannerEvent) => {
    return fetchWithAuth('/api/gcal', {
        method: 'POST',
        body: JSON.stringify({ action: 'create', event }),
    }).then(res => res.json());
  };

  const updateGoogleEvent = async (eventId: string, event: PlannerEvent) => {
     return fetchWithAuth('/api/gcal', {
        method: 'POST',
        body: JSON.stringify({ action: 'update', eventId, event }),
    }).then(res => res.json());
  };
  
  const deleteGoogleEvent = async (eventId: string) => {
     return fetchWithAuth('/api/gcal', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete', eventId }),
    }).then(res => res.json());
  }

  const value = {
    isConnected,
    isLoading,
    connect,
    disconnect,
    createGoogleEvent,
    updateGoogleEvent,
    deleteGoogleEvent,
  };

  return (
    <GoogleCalendarContext.Provider value={value}>
      {children}
    </GoogleCalendarContext.Provider>
  );
}
