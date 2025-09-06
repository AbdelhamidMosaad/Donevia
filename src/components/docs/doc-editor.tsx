
'use client';

import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import type { Doc } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from 'use-debounce';
import { EditorToolbar } from './editor-toolbar';
import { slashCommands } from './slash-commands';
import { Loader2 } from 'lucide-react';
import { Image as TipTapImage } from '@tiptap/extension-image';
import BulletList from '@tiptap/extension-bullet-list'
import OrderedList from '@tiptap/extension-ordered-list'
import ListItem from '@tiptap/extension-list-item'

interface DocEditorProps {
  doc: Doc;
}

export function DocEditor({ doc: initialDoc }: DocEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [docData, setDocData] = useState(initialDoc);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const debouncedSave = useDebouncedCallback(async (updatedDoc: Doc) => {
    if (!user) return;
    setSaveStatus('saving');
    const docRef = doc(db, 'users', user.uid, 'docs', updatedDoc.id);
    try {
      await updateDoc(docRef, {
        title: updatedDoc.title,
        content: updatedDoc.content,
        updatedAt: serverTimestamp(),
      });
      setSaveStatus('saved');
    } catch (error) {
      console.error("Error saving document: ", error);
      toast({ variant: 'destructive', title: 'Error saving document' });
      setSaveStatus('idle');
    }
  }, 2000);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Placeholder.configure({ placeholder: "Type '/' for commands..." }),
      Underline,
      Link.configure({ openOnClick: true, autolink: true }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      slashCommands,
      TipTapImage,
      BulletList,
      OrderedList,
      ListItem,
    ],
    content: docData.content,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-full focus:outline-none p-4 md:p-8',
      },
    },
    onUpdate: ({ editor }) => {
      const newContent = editor.getJSON();
      const updatedDoc = { ...docData, content: newContent };
      setDocData(updatedDoc);
      debouncedSave(updatedDoc);
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    const updatedDoc = { ...docData, title: newTitle };
    setDocData(updatedDoc);
    debouncedSave(updatedDoc);
  };

  useEffect(() => {
    if (editor && JSON.stringify(editor.getJSON()) !== JSON.stringify(docData.content)) {
        editor.commands.setContent(docData.content, false);
    }
  }, [docData.content, editor]);
  
  useEffect(() => {
    setDocData(initialDoc);
  }, [initialDoc]);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-hidden">
        <div className="p-4 border-b pr-16 relative">
            <div className="flex items-center gap-4">
                <input
                    type="text"
                    value={docData.title}
                    onChange={handleTitleChange}
                    className="flex-grow w-full text-2xl font-bold bg-transparent outline-none border-none focus:ring-0"
                    placeholder="Document Title"
                />
            </div>
             <EditorToolbar editor={editor} />
             <div className="absolute top-4 right-16 flex items-center gap-2 text-sm text-muted-foreground">
                {saveStatus === 'saving' && <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>}
                {saveStatus === 'saved' && <span>Saved</span>}
            </div>
        </div>
       
        <div className="relative flex-1 overflow-y-auto" onClick={() => editor.commands.focus()}>
            <EditorContent editor={editor} />
        </div>
    </div>
  );
}
