
'use client';

import { useEffect, useState, useReducer } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import type { Page } from '@/lib/types';
import { useDebouncedCallback } from 'use-debounce';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { savePageClient } from '@/lib/client-helpers';
import { EditorToolbar } from './editor-toolbar';
import { AttachmentUploader } from './attachment-uploader';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VersionHistoryDrawer } from './version-history/version-history-drawer';

interface PageEditorProps {
  page: Page;
}

type EditorStatus = 'saved' | 'saving' | 'conflict' | 'error';
type EditorState = {
  status: EditorStatus;
  lastSaved: string | null;
  serverVersion: number;
  clientVersion: number;
  serverContent: any | null;
  serverTitle: string | null;
};
type EditorAction = 
  | { type: 'EDITING' }
  | { type: 'SAVE_SUCCESS'; newVersion: number; timestamp: string }
  | { type: 'CONFLICT'; serverVersion: number; serverContent: any; serverTitle: string; }
  | { type: 'RESOLVED' }
  | { type: 'SAVE_ERROR' }
  | { type: 'RESET'; page: Page };


function editorReducer(state: EditorState, action: EditorAction): EditorState {
    switch(action.type) {
        case 'EDITING':
            return { ...state, status: 'saving' };
        case 'SAVE_SUCCESS':
            return { ...state, status: 'saved', clientVersion: action.newVersion, serverVersion: action.newVersion, lastSaved: action.timestamp };
        case 'CONFLICT':
            return { ...state, status: 'conflict', serverVersion: action.serverVersion, serverContent: action.serverContent, serverTitle: action.serverTitle };
        case 'RESOLVED':
             return { ...state, status: 'saved' }; // Assume we're good after resolving
        case 'SAVE_ERROR':
            return { ...state, status: 'error' };
        case 'RESET':
            return {
                status: 'saved',
                lastSaved: action.page.updatedAt.toDate().toLocaleTimeString(),
                serverVersion: action.page.version,
                clientVersion: action.page.version,
                serverContent: null,
                serverTitle: null,
            };
        default:
            return state;
    }
}

export function PageEditor({ page: initialPage }: PageEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState(initialPage.title);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const [state, dispatch] = useReducer(editorReducer, {
      status: 'saved',
      lastSaved: initialPage.updatedAt.toDate().toLocaleTimeString(),
      serverVersion: initialPage.version,
      clientVersion: initialPage.version,
      serverContent: null,
      serverTitle: null,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disabling these to use the Link extension's more advanced options
        link: false,
      }),
      Placeholder.configure({
        placeholder: "Start writing your notes here... Type '/' for commands.",
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
      })
    ],
    content: initialPage.content,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none w-full max-w-full',
      },
    },
    onUpdate: () => {
      if (state.status !== 'conflict') {
          dispatch({ type: 'EDITING' });
          handleDebouncedSave();
      }
    },
  });

  const handleDebouncedSave = useDebouncedCallback(async () => {
    if (!editor || !user || state.status === 'conflict') return;
    
    const contentJSON = editor.getJSON();

    try {
      const result = await savePageClient(initialPage.id, title, contentJSON, state.clientVersion);
      if (result.status === 'ok') {
        dispatch({ type: 'SAVE_SUCCESS', newVersion: result.newVersion, timestamp: new Date().toLocaleTimeString() });
      }
    } catch (error: any) {
        if (error.response?.status === 409) { // Conflict
            const conflictData = await error.response.json();
            dispatch({ type: 'CONFLICT', serverVersion: conflictData.serverVersion, serverContent: conflictData.serverContent, serverTitle: conflictData.serverTitle });
        } else {
            console.error('Error saving page:', error);
            dispatch({ type: 'SAVE_ERROR' });
            toast({ variant: 'destructive', title: 'Save Error', description: 'Could not save changes.' });
        }
    }
  }, 1500);
  
  const handleTitleDebounce = useDebouncedCallback(() => {
    if (state.status !== 'conflict') {
        dispatch({ type: 'EDITING' });
        handleDebouncedSave();
    }
  }, 1500);

  // Live updates from Firestore for external changes
  useEffect(() => {
      if (!user) return;
      const unsub = onSnapshot(doc(db, "users", user.uid, "pages", initialPage.id), (doc) => {
          const serverPage = doc.data() as Page;
          if (serverPage && serverPage.version > state.clientVersion) {
              console.log("Conflict detected from snapshot listener.");
              dispatch({ type: 'CONFLICT', serverVersion: serverPage.version, serverContent: serverPage.content, serverTitle: serverPage.title });
          }
      });
      return () => unsub();
  }, [initialPage.id, user, state.clientVersion]);


  // Effect to reset state when the page prop changes
  useEffect(() => {
    if (editor && initialPage) {
        setTitle(initialPage.title);
        dispatch({ type: 'RESET', page: initialPage });
        
        // Check if content is different before resetting to avoid losing unsaved changes
        const isSameContent = JSON.stringify(editor.getJSON()) === JSON.stringify(initialPage.content);
        if(!isSameContent) {
            editor.commands.setContent(initialPage.content, false);
        }
    }
  }, [initialPage, editor]);
  
  const handleKeepMyChanges = async () => {
    if (!editor || !user) return;
    // To force an overwrite, we set the client version to the server version
    // and save again. A more robust implementation might use a specific `force=true` param.
    const newVersion = state.serverVersion;
    dispatch({ type: 'EDITING' });
    try {
       const result = await savePageClient(initialPage.id, title, editor.getJSON(), newVersion);
       if(result.status === 'ok') {
           dispatch({ type: 'SAVE_SUCCESS', newVersion: result.newVersion, timestamp: new Date().toLocaleTimeString() });
           toast({ title: "Your changes have been saved." });
       }
    } catch(e) {
        dispatch({ type: 'SAVE_ERROR' });
        toast({ variant: 'destructive', title: 'Error', description: 'Could not force save.' });
    }
  };

  const handleDiscardMyChanges = () => {
    if (editor && state.serverContent && state.serverTitle) {
      editor.commands.setContent(state.serverContent, false);
      setTitle(state.serverTitle);
      dispatch({ type: 'SAVE_SUCCESS', newVersion: state.serverVersion, timestamp: new Date().toLocaleTimeString() });
      toast({ title: 'Your changes were discarded.' });
    }
  };

  const getStatusMessage = () => {
      switch(state.status) {
          case 'saving': return 'Saving...';
          case 'saved': return `Saved at ${state.lastSaved}`;
          case 'conflict': return 'Conflict detected!';
          case 'error': return 'Error saving';
          default: return 'Ready';
      }
  }

  const handleRestore = (content: any, title: string) => {
    if(editor) {
        editor.commands.setContent(content, false);
        setTitle(title);
        dispatch({ type: 'EDITING' });
        handleDebouncedSave();
        setIsHistoryOpen(false);
        toast({ title: 'Version Restored', description: 'The page has been updated to the selected version.'});
    }
  }

  if (!editor) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-hidden">
        {state.status === 'conflict' && (
            <Alert variant="destructive" className="m-4 rounded-lg">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Conflict Detected</AlertTitle>
                <AlertDescription className="flex justify-between items-center">
                    <p>Another user has saved changes to this page. To avoid data loss, please review their changes.</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleDiscardMyChanges}>Discard My Changes</Button>
                        <Button size="sm" onClick={handleKeepMyChanges}>Keep My Changes</Button>
                    </div>
                </AlertDescription>
            </Alert>
        )}
        <div className="p-4 border-b flex justify-between items-center">
            <div>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        handleTitleDebounce();
                    }}
                    className="w-full text-3xl font-bold bg-transparent outline-none border-none focus:ring-0"
                    placeholder="Page Title"
                    disabled={state.status === 'conflict'}
                />
                <p className="text-xs text-muted-foreground mt-1">{getStatusMessage()}</p>
            </div>
            <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
                <History className="mr-2 h-4 w-4" />
                History
            </Button>
        </div>
      <div className="relative flex-1 overflow-y-auto p-8" onClick={() => editor.commands.focus()}>
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
        <AttachmentUploader pageId={initialPage.id} />
      </div>
      <VersionHistoryDrawer 
        page={initialPage}
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)}
        onRestore={handleRestore}
        currentContent={editor.getJSON()}
      />
    </div>
  );
}
