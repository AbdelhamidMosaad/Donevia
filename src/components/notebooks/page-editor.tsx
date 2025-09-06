

'use client';

import { useEffect, useState, useReducer, useCallback, RefObject } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import type { Page } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { savePageClient } from '@/lib/client-helpers';
import { EditorToolbar } from './editor-toolbar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FontFamily } from '@/lib/tiptap/font-family';
import { FontSize } from '@/lib/tiptap/font-size';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';

interface PageEditorProps {
  page: Page;
  onCanvasColorChange: (color: string) => void;
  editorPanelRef: RefObject<HTMLDivElement>;
}

type EditorStatus = 'saved' | 'saving' | 'conflict' | 'error' | 'unsaved';
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
  | { type: 'SAVING' }
  | { type: 'SAVE_SUCCESS'; newVersion: number; timestamp: string }
  | { type: 'CONFLICT'; serverVersion: number; serverContent: any; serverTitle: string; }
  | { type: 'RESOLVED' }
  | { type: 'SAVE_ERROR' }
  | { type: 'RESET'; page: Page };


function editorReducer(state: EditorState, action: EditorAction): EditorState {
    switch(action.type) {
        case 'EDITING':
            return { ...state, status: 'unsaved' };
        case 'SAVING':
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

export function PageEditor({ page: initialPage, onCanvasColorChange, editorPanelRef }: PageEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState(initialPage.title);

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
      Color.configure({
        types: ['textStyle'],
      }),
      TextStyle.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      FontFamily,
      FontSize,
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        textStyle: false, // Disable StarterKit's textStyle to use the standalone one
      }),
      Placeholder.configure({
        placeholder: "Start writing your notes here...",
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
      })
    ],
    content: initialPage.content,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-full focus:outline-none p-4 md:p-8',
      },
    },
    onUpdate: () => {
      if (state.status !== 'conflict') {
          dispatch({ type: 'EDITING' });
      }
    },
  });

  const handleSave = useCallback(async () => {
    if (!editor || !user || state.status === 'conflict' || state.status === 'saving') return;
    
    dispatch({ type: 'SAVING' });
    const contentJSON = editor.getJSON();

    try {
      const result = await savePageClient(initialPage.id, title, contentJSON, state.clientVersion, initialPage.canvasColor || null);
      if (result.status === 'ok') {
        dispatch({ type: 'SAVE_SUCCESS', newVersion: result.newVersion, timestamp: new Date().toLocaleTimeString() });
        toast({ title: '✓ Progress Saved' });
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
  }, [editor, user, state.status, state.clientVersion, initialPage.id, initialPage.canvasColor, title, toast]);
  

  // Auto-save timer
  useEffect(() => {
    const saveInterval = 5 * 60 * 1000; // 5 minutes
    
    if (state.status === 'unsaved' && editor) {
      const timer = setTimeout(() => {
        handleSave();
      }, saveInterval);
      return () => clearTimeout(timer);
    }
  }, [state.status, handleSave, editor]);


  // Live updates from Firestore for external changes
  useEffect(() => {
      if (!user || !editor) return;
      const unsub = onSnapshot(doc(db, "users", user.uid, "pages", initialPage.id), (doc) => {
          const serverPage = doc.data() as Page;
          if (serverPage && serverPage.version > state.clientVersion) {
              console.log("Conflict detected from snapshot listener.");
              dispatch({ type: 'CONFLICT', serverVersion: serverPage.version, serverContent: serverPage.content, serverTitle: serverPage.title });
          }
      });
      return () => unsub();
  }, [initialPage.id, user, state.clientVersion, editor]);


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
    const newVersion = state.serverVersion;
    dispatch({ type: 'SAVING' });
    try {
       const result = await savePageClient(initialPage.id, title, editor.getJSON(), newVersion, initialPage.canvasColor || null);
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
  
   const handleColorSelect = async (color: string) => {
        if (!user) return;
        onCanvasColorChange(color);
        const pageRef = doc(db, 'users', user.uid, 'pages', initialPage.id);
        try {
            await updateDoc(pageRef, { canvasColor: color });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save color choice.' });
        }
    };

  const getStatusMessage = () => {
      switch(state.status) {
          case 'saving': return <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/>Saving...</span>;
          case 'saved': return `Saved at ${state.lastSaved}`;
          case 'conflict': return 'Conflict detected!';
          case 'error': return 'Error saving';
          case 'unsaved': return 'Unsaved changes';
          default: return 'Ready';
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
        <div className="p-4 border-b pr-16">
            <div className="flex items-center gap-4">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        dispatch({ type: 'EDITING' });
                    }}
                    className="flex-grow w-full text-2xl font-bold bg-transparent outline-none border-none focus:ring-0 text-black"
                    placeholder="Page Title"
                    disabled={state.status === 'conflict'}
                />
                <div className="text-xs text-muted-foreground whitespace-nowrap">{getStatusMessage()}</div>
            </div>
             <EditorToolbar editor={editor} onColorChange={handleColorSelect} initialColor={initialPage.canvasColor} onManualSave={handleSave} saveStatus={state.status} container={editorPanelRef.current} />
        </div>
       
        <div className="relative flex-1 overflow-y-auto" onClick={() => editor.commands.focus()}>
            <EditorContent editor={editor} />
        </div>
    </div>
  );
}
