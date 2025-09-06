

'use client';

import { useEffect, useState, RefObject } from 'react';
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
import type { Page } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { EditorToolbar } from './editor-toolbar';
import { Button } from '@/components/ui/button';
import { Loader2, Save, History, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePageSaver } from '@/hooks/use-page-saver';
import { AttachmentUploader } from './attachment-uploader';
import { VersionHistoryDrawer } from './version-history/version-history-drawer';
import { saveRevisionClient } from '@/lib/client-helpers';
import { slashCommands } from '../docs/slash-commands';
import { Image as TipTapImage } from '@tiptap/extension-image';
import { History as HistoryExtension } from '@tiptap/extension-history';

interface PageEditorProps {
  page: Page;
  onCanvasColorChange: (color: string) => void;
  editorPanelRef: RefObject<HTMLDivElement>;
}

export function PageEditor({ page: initialPage, onCanvasColorChange: setCanvasColor, editorPanelRef }: PageEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    page,
    saveStatus,
    isDirty,
    onContentChange,
    onTitleChange,
    onCanvasColorChange,
    saveManually,
    setPage: setPageFromHook,
  } = usePageSaver(initialPage);
  
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        history: false, // Use the dedicated History extension
      }),
      HistoryExtension,
      Placeholder.configure({ placeholder: "Type '/' for commands or start writing..." }),
      Underline,
      Link.configure({ openOnClick: true, autolink: true, linkOnPaste: true }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      slashCommands,
      TipTapImage,
    ],
    content: page.content,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-full focus:outline-none p-4 md:p-8',
      },
    },
    onUpdate: ({ editor }) => {
      onContentChange(editor.getJSON());
    },
  });
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTitleChange(e.target.value);
  }

  const handleCanvasColorSelect = (color: string) => {
    setCanvasColor(color); // Propagate up for the parent component's style
    onCanvasColorChange(color); // Update state in the saver hook
  };

  const handleRestoreVersion = async (content: any, title: string) => {
     if (!user || !editor) return;

     // 1. Save the current state as a revision before restoring
     await saveRevisionClient(page.id, page.title, editor.getJSON());

     // 2. Update editor and local state
     editor.commands.setContent(content, false);
     setPageFromHook(prev => ({...prev, title, content, version: prev.version + 1})); // Manually bump version to be safe
     
     // 3. Trigger a save of the restored content
     onContentChange(content);
     onTitleChange(title);
     
     setIsVersionHistoryOpen(false);
     toast({title: 'Version Restored', description: 'The page has been updated to the selected version.'});
  }

  // Sync editor when the page from the hook changes (e.g., after a save or conflict)
  useEffect(() => {
    if (editor && page) {
      const isSameContent = JSON.stringify(editor.getJSON()) === JSON.stringify(page.content);
      if (!isSameContent) {
        editor.commands.setContent(page.content, false);
      }
    }
  }, [page, editor]);
  
  if (!editor) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-hidden">
        <div className="p-4 border-b pr-16 relative">
            <div className="flex items-center gap-4">
                <input
                    type="text"
                    value={page.title}
                    onChange={handleTitleChange}
                    className="flex-grow w-full text-2xl font-bold bg-transparent outline-none border-none focus:ring-0 text-black"
                    placeholder="Page Title"
                />
            </div>
             <EditorToolbar editor={editor} />
             <div className="absolute top-4 right-16 flex items-center gap-2">
                 <Button onClick={saveManually} disabled={!isDirty || saveStatus === 'saving'} size="sm">
                    {saveStatus === 'saving' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save Now'}
                 </Button>
            </div>
        </div>
       
        <div className="relative flex-1 overflow-y-auto" onClick={() => editor.commands.focus()}>
            <EditorContent editor={editor} />
            <AttachmentUploader pageId={page.id} />
        </div>
         <VersionHistoryDrawer
            isOpen={isVersionHistoryOpen}
            onClose={() => setIsVersionHistoryOpen(false)}
            page={page}
            currentContent={editor.getJSON()}
            onRestore={handleRestoreVersion}
        />
    </div>
  );
}
