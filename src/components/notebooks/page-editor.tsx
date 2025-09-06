

'use client';

import { useEffect, useState, useReducer, useCallback, RefObject, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import type { Page } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EditorToolbar } from './editor-toolbar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FontFamily } from '@/lib/tiptap/font-family';
import { FontSize } from '@/lib/tiptap/font-size';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { usePageSaver } from '@/hooks/use-page-saver';

interface PageEditorProps {
  page: Page;
  onCanvasColorChange: (color: string) => void;
  editorPanelRef: RefObject<HTMLDivElement>;
}

export function PageEditor({ page: initialPage, onCanvasColorChange, editorPanelRef }: PageEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState(initialPage.title);

  const {
    state,
    dispatch,
    savePage,
    resolveConflict,
    isSaving,
    lastSaved,
  } = usePageSaver(initialPage);

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
      Subscript,
      Superscript,
      FontFamily,
      FontSize,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        textStyle: false, 
        underline: false, 
      }),
      Placeholder.configure({
        placeholder: "Start writing your notes here...",
      }),
      Underline.configure({
        HTMLAttributes: {
          class: 'underline',
        },
      }),
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

  const handleManualSave = useCallback(() => {
    if (!editor) return;
    savePage(title, editor.getJSON(), true); // true for manual save
  }, [editor, savePage, title]);


  // Auto-save on content or title changes
  useEffect(() => {
    if (state.status !== 'unsaved' || !editor) return;
    const content = editor.getJSON();
    savePage(title, content);
  }, [state.status, title, editor, savePage]);


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
  }, [initialPage.id, user, state.clientVersion, editor, dispatch]);


  // Effect to reset state when the page prop changes
  useEffect(() => {
    if (editor && initialPage) {
        setTitle(initialPage.title);
        dispatch({ type: 'RESET', page: initialPage });
        
        const isSameContent = JSON.stringify(editor.getJSON()) === JSON.stringify(initialPage.content);
        if(!isSameContent) {
            editor.commands.setContent(initialPage.content, false);
        }
    }
  }, [initialPage, editor, dispatch]);
  
  const handleKeepMyChanges = async () => {
    if (!editor) return;
    resolveConflict('client', editor.getJSON(), title);
  };

  const handleDiscardMyChanges = () => {
    if (editor && state.serverContent && state.serverTitle) {
      editor.commands.setContent(state.serverContent, false);
      setTitle(state.serverTitle);
      resolveConflict('server');
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
      if (isSaving) {
        return <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/>Saving...</span>;
      }
      switch(state.status) {
          case 'saved': return `Saved at ${lastSaved}`;
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
             <EditorToolbar editor={editor} onColorChange={handleColorSelect} initialColor={initialPage.canvasColor} onManualSave={handleManualSave} saveStatus={state.status} container={editorPanelRef.current} />
        </div>
       
        <div className="relative flex-1 overflow-y-auto" onClick={() => editor.commands.focus()}>
            <EditorContent editor={editor} />
        </div>
    </div>
  );
}
