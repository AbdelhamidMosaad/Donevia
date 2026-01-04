
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
import { getFunctions, httpsCallable } from 'firebase/functions';

interface GoogleCalendarContextType {
  isConnected: boolean;
  isLoading: boolean;
  connect: () => void;
  disconnect: () => void;
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
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

    try {
      const functions = getFunctions();
      const getAuthUrl = httpsCallable(functions, 'getAuthUrl');
      const result = (await getAuthUrl()) as { data: { url: string } };
      
      // Append user's UID to the state parameter for the callback to use
      const authUrl = `${result.data.url}&state=${user.uid}`;
      
      // Open a popup for the user to authenticate
      window.open(authUrl, 'googleAuth', 'width=500,height=600');

    } catch (error) {
      console.error('Error getting auth URL:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not initiate Google Calendar connection.',
      });
    }
  }, [user, toast]);

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

  const value = {
    isConnected,
    isLoading,
    connect,
    disconnect,
  };

  return (
    <GoogleCalendarContext.Provider value={value}>
      {children}
    </GoogleCalendarContext.Provider>
  );
}
