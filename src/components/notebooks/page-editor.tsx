

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

interface PageEditorProps {
  page: Page;
  onCanvasColorChange: (color: string) => void;
  editorPanelRef: RefObject<HTMLDivElement>;
}

export function PageEditor({ page: initialPage, onCanvasColorChange, editorPanelRef }: PageEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState(initialPage.title);

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
      // Logic removed
    },
  });

  // Effect to reset state when the page prop changes
  useEffect(() => {
    if (editor && initialPage) {
        setTitle(initialPage.title);
        
        const isSameContent = JSON.stringify(editor.getJSON()) === JSON.stringify(initialPage.content);
        if(!isSameContent) {
            editor.commands.setContent(initialPage.content, false);
        }
    }
  }, [initialPage, editor]);
  
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

  if (!editor) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-hidden">
        <div className="p-4 border-b pr-16">
            <div className="flex items-center gap-4">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                    }}
                    className="flex-grow w-full text-2xl font-bold bg-transparent outline-none border-none focus:ring-0 text-black"
                    placeholder="Page Title"
                />
            </div>
             <EditorToolbar editor={editor} onColorChange={handleColorSelect} initialColor={initialPage.canvasColor} container={editorPanelRef.current} />
        </div>
       
        <div className="relative flex-1 overflow-y-auto" onClick={() => editor.commands.focus()}>
            <EditorContent editor={editor} />
        </div>
    </div>
  );
}
