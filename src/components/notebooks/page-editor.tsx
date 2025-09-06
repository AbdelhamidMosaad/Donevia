
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import type { Page } from '@/lib/types';
import { useDebouncedCallback } from 'use-debounce';
import { useAuth } from '@/hooks/use-auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateSearchIndexClient } from '@/lib/client-helpers';
import { EditorToolbar } from './editor-toolbar';
import { AttachmentUploader } from './attachment-uploader';

interface PageEditorProps {
  page: Page;
}

export function PageEditor({ page }: PageEditorProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState('Saved');
  const [title, setTitle] = useState(page.title);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your notes here... Type '/' for commands.",
      }),
    ],
    content: page.content,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none w-full max-w-full',
      },
    },
    onUpdate: () => {
      setStatus('Saving...');
      handleDebouncedSave();
    },
  });

  const handleDebouncedSave = useDebouncedCallback(async () => {
    if (!editor || !user) return;
    const contentJSON = editor.getJSON();
    const pageRef = doc(db, 'users', user.uid, 'pages', page.id);
    try {
      await updateDoc(pageRef, {
        content: contentJSON,
        updatedAt: serverTimestamp(),
      });
      // Update search index in the background
      await updateSearchIndexClient(page.id, title, contentJSON);
      setStatus(`Saved at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error saving page:', error);
      setStatus('Error');
    }
  }, 1500);

  const handleTitleChange = useDebouncedCallback(async (newTitle: string) => {
      if(!user || !newTitle || newTitle === page.title) return;
      const pageRef = doc(db, 'users', user.uid, 'pages', page.id);
      await updateDoc(pageRef, { title: newTitle });
  }, 500);


  useEffect(() => {
    if (editor && page) {
        setTitle(page.title);
        // Check if content is different before resetting to avoid losing unsaved changes
        const isSameContent = JSON.stringify(editor.getJSON()) === JSON.stringify(page.content);
        if(!isSameContent) {
            editor.commands.setContent(page.content, false);
        }
    }
  }, [page, editor]);
  
  if (!editor) {
    return null;
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-hidden">
        <div className="p-4 border-b">
            <input
                type="text"
                value={title}
                onChange={(e) => {
                    setTitle(e.target.value);
                    handleTitleChange(e.target.value);
                }}
                className="w-full text-3xl font-bold bg-transparent outline-none border-none focus:ring-0"
                placeholder="Page Title"
            />
             <p className="text-xs text-muted-foreground mt-1">{status}</p>
        </div>
      <div className="relative flex-1 overflow-y-auto p-8">
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
        <AttachmentUploader pageId={page.id} />
      </div>
    </div>
  );
}
