
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from './use-toast';
import { savePageClient } from '@/lib/client-helpers';
import type { Page } from '@/lib/types';
import { useDebouncedCallback } from 'use-debounce';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'conflict' | 'error';
type SaveRequest = {
  page: Page;
  content: any; // The latest editor content
  isManual: boolean;
};

export function usePageSaver(initialPage: Page) {
  const { toast } = useToast();
  const [page, setPage] = useState(initialPage);
  const [editorContent, setEditorContent] = useState(initialPage.content);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isDirty, setIsDirty] = useState(false);

  const saveQueue = useRef<SaveRequest[]>([]);
  const isProcessing = useRef(false);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || saveQueue.current.length === 0) {
      return;
    }
    isProcessing.current = true;
    setSaveStatus('saving');

    // Get the latest request from the queue, prioritizing manual saves
    let requestToProcess = saveQueue.current[0];
    const manualSaveIndex = saveQueue.current.findIndex(req => req.isManual);
    if (manualSaveIndex !== -1) {
        requestToProcess = saveQueue.current[manualSaveIndex];
    }
    
    saveQueue.current = []; // Clear the queue after grabbing the latest state

    const saveFunction = async () => {
      try {
        const result = await savePageClient(
          requestToProcess.page.id,
          requestToProcess.page.title,
          requestToProcess.content,
          requestToProcess.page.canvasColor,
          requestToProcess.page.version
        );

        setPage(prevPage => ({ ...prevPage, version: result.newVersion }));
        setSaveStatus('saved');
        setIsDirty(false);
        if (requestToProcess.isManual) {
            toast({ title: "✓ Saved", description: "Your changes have been saved." });
        }
      } catch (error: any) {
        console.error("Save failed:", error);
        if (error.conflict) {
          setSaveStatus('conflict');
          toast({
            variant: 'destructive',
            title: 'Sync Conflict',
            description: 'This page was updated elsewhere. Please refresh to see the latest changes.',
          });
        } else {
          setSaveStatus('error');
           toast({
            variant: 'destructive',
            title: 'Save Error',
            description: `Could not save changes. ${error.message || ''}`,
          });
        }
      } finally {
        isProcessing.current = false;
        // After processing, check if there are new items in the queue
        if (saveQueue.current.length > 0) {
            processQueue();
        }
      }
    };
    
    await saveFunction();

  }, [toast]);

  const debouncedProcessQueue = useDebouncedCallback(processQueue, 2000); // 2-second debounce for auto-save

  const addToSaveQueue = useCallback((request: SaveRequest) => {
    // If it's a manual save, clear out older auto-save requests
    if (request.isManual) {
        saveQueue.current = saveQueue.current.filter(r => r.isManual);
    }
    saveQueue.current.push(request);
    
    if (request.isManual) {
        processQueue();
    } else {
        debouncedProcessQueue();
    }
  }, [debouncedProcessQueue, processQueue]);

  const saveManually = useCallback(() => {
    if (!isDirty) return;
    addToSaveQueue({ page, content: editorContent, isManual: true });
  }, [isDirty, page, editorContent, addToSaveQueue]);

  const onContentChange = useCallback((newContent: any) => {
    setIsDirty(true);
    setEditorContent(newContent);
    setSaveStatus('idle');
    addToSaveQueue({ page, content: newContent, isManual: false });
  }, [page, addToSaveQueue]);

  const onTitleChange = useCallback((newTitle: string) => {
    setIsDirty(true);
    const newPage = { ...page, title: newTitle };
    setPage(newPage);
    setSaveStatus('idle');
    addToSaveQueue({ page: newPage, content: editorContent, isManual: false });
  }, [page, editorContent, addToSaveQueue]);

  const onCanvasColorChange = useCallback((newColor: string) => {
    setIsDirty(true);
    const newPage = { ...page, canvasColor: newColor };
    setPage(newPage);
    setSaveStatus('idle');
    addToSaveQueue({ page: newPage, content: editorContent, isManual: false });
  }, [page, editorContent, addToSaveQueue]);

  // Update local page state when the initialPage prop changes (e.g., from navigation)
  useEffect(() => {
    setPage(initialPage);
    setEditorContent(initialPage.content);
    setIsDirty(false);
    setSaveStatus('idle');
    saveQueue.current = [];
    isProcessing.current = false;
  }, [initialPage]);

  return {
    page,
    editorContent,
    saveStatus,
    isDirty,
    onContentChange,
    onTitleChange,
    onCanvasColorChange,
    saveManually,
    setPage, // Expose for conflict resolution
  };
}
