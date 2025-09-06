
'use client';

import { useReducer, useCallback, useRef, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { savePageClient } from '@/lib/client-helpers';
import type { Page } from '@/lib/types';
import { useDebouncedCallback } from 'use-debounce';

// --- State and Reducer ---

type EditorStatus = 'saved' | 'saving' | 'conflict' | 'error' | 'unsaved';

export type SaverState = {
  status: EditorStatus;
  serverVersion: number;
  clientVersion: number;
  serverContent: any | null;
  serverTitle: string | null;
};

export type SaverAction =
  | { type: 'EDITING' }
  | { type: 'SAVING' }
  | { type: 'SAVE_SUCCESS'; newVersion: number }
  | { type: 'CONFLICT'; serverVersion: number; serverContent: any; serverTitle: string }
  | { type: 'RESOLVED'; newVersion: number }
  | { type: 'SAVE_ERROR' }
  | { type: 'RESET'; page: Page };

export function pageSaverReducer(state: SaverState, action: SaverAction): SaverState {
  switch (action.type) {
    case 'EDITING':
      return { ...state, status: 'unsaved' };
    case 'SAVING':
      return { ...state, status: 'saving' };
    case 'SAVE_SUCCESS':
      return {
        ...state,
        status: 'saved',
        clientVersion: action.newVersion,
        serverVersion: action.newVersion,
        serverContent: null,
        serverTitle: null,
      };
    case 'CONFLICT':
      return {
        ...state,
        status: 'conflict',
        serverVersion: action.serverVersion,
        serverContent: action.serverContent,
        serverTitle: action.serverTitle,
      };
    case 'RESOLVED':
        return {
            ...state,
            status: 'saved',
            clientVersion: action.newVersion,
            serverVersion: action.newVersion,
            serverContent: null,
            serverTitle: null,
        }
    case 'SAVE_ERROR':
      return { ...state, status: 'error' };
    case 'RESET':
      return {
        status: 'saved',
        serverVersion: action.page.version,
        clientVersion: action.page.version,
        serverContent: null,
        serverTitle: null,
      };
    default:
      return state;
  }
}

// --- Hook ---

export function usePageSaver(initialPage: Page) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [state, dispatch] = useReducer(pageSaverReducer, {
    status: 'saved',
    serverVersion: initialPage.version,
    clientVersion: initialPage.version,
    serverContent: null,
    serverTitle: null,
  });

  const [lastSaved, setLastSaved] = useState(initialPage.updatedAt.toDate().toLocaleTimeString());
  const [isSaving, setIsSaving] = useState(false);
  const saveQueue = useRef<(() => Promise<void>)[]>([]);
  const isProcessing = useRef(false);


  const processQueue = useCallback(async () => {
    if (isProcessing.current || saveQueue.current.length === 0) {
      return;
    }
    isProcessing.current = true;
    setIsSaving(true);
    
    const saveFunction = saveQueue.current.shift();
    if (saveFunction) {
      await saveFunction();
    }
    
    isProcessing.current = false;
    setIsSaving(false);
    
    // If there are more items, process them
    if (saveQueue.current.length > 0) {
      processQueue();
    }
  }, []);

  const debouncedProcessQueue = useDebouncedCallback(processQueue, 1500);

  const savePage = useCallback((title: string, content: any, isManual = false) => {
    if (!user || state.status === 'conflict') return;

    const saveFunction = async () => {
      dispatch({ type: 'SAVING' });

      try {
        const result = await savePageClient(initialPage.id, title, content, state.clientVersion, initialPage.canvasColor || null);
        
        if (result.status === 'ok') {
          dispatch({ type: 'SAVE_SUCCESS', newVersion: result.newVersion });
          setLastSaved(new Date().toLocaleTimeString());
          if (isManual) {
            toast({ title: '✓ Progress Saved' });
          }
        }
      } catch (error: any) {
        if (error.response?.status === 409) {
          const conflictData = await error.response.json();
          dispatch({ type: 'CONFLICT', serverVersion: conflictData.serverVersion, serverContent: conflictData.serverContent, serverTitle: conflictData.serverTitle });
        } else {
          console.error('Error saving page:', error);
          dispatch({ type: 'SAVE_ERROR' });
          const errorMessage = error.response?.error || 'Could not save changes.';
          toast({ variant: 'destructive', title: 'Save Error', description: errorMessage });
        }
      }
    };
    
    if(isManual) {
        saveQueue.current.unshift(saveFunction); // Prioritize manual saves
        processQueue(); // Process immediately
    } else {
        saveQueue.current.push(saveFunction);
        debouncedProcessQueue();
    }

  }, [user, initialPage.id, initialPage.canvasColor, state.clientVersion, state.status, toast, debouncedProcessQueue, processQueue]);

  const resolveConflict = useCallback(async (strategy: 'client' | 'server', clientContent?: any, clientTitle?: string) => {
    if (strategy === 'server') {
        dispatch({ type: 'RESOLVED', newVersion: state.serverVersion });
        setLastSaved(new Date().toLocaleTimeString());
        toast({ title: 'Your local changes were discarded.' });
        return;
    }

    if (strategy === 'client' && clientContent && clientTitle) {
        const saveFunction = async () => {
            dispatch({ type: 'SAVING' });
            try {
                // Force save with the server's version number to overwrite
                const result = await savePageClient(initialPage.id, clientTitle, clientContent, state.serverVersion, initialPage.canvasColor || null);
                if (result.status === 'ok') {
                    dispatch({ type: 'RESOLVED', newVersion: result.newVersion });
                    setLastSaved(new Date().toLocaleTimeString());
                    toast({ title: 'Your changes have been force-saved.' });
                }
            } catch (e) {
                 dispatch({ type: 'SAVE_ERROR' });
                 toast({ variant: 'destructive', title: 'Error', description: 'Could not force save.' });
            }
        };

        saveQueue.current.unshift(saveFunction);
        processQueue();
    }
  }, [state.serverVersion, toast, initialPage.id, initialPage.canvasColor, processQueue]);


  return { state, dispatch, savePage, resolveConflict, isSaving, lastSaved };
}
