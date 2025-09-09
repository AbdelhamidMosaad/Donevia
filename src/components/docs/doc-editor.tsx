
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
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
import { Loader2, Maximize, Minimize } from 'lucide-react';
import { Image as TipTapImage } from '@tiptap/extension-image';
import { FontSize } from '@/lib/tiptap/font-size';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { CharacterCount } from '@tiptap/extension-character-count';
import { FontFamily } from '@/lib/tiptap/font-family';
import { TextTransform } from '@/lib/tiptap/text-transform';
import { cn } from '@/lib/utils';
import { Callout } from '@/lib/tiptap/callout';
import { Button } from '../ui/button';


interface DocEditorProps {
  doc: Doc;
  onEditorInstance?: (editor: Editor) => void;
}

// Helper function to recursively remove undefined values from an object
function deepCleanUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj === undefined ? null : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(deepCleanUndefined);
  }
  
  const cleaned: { [key: string]: any } = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = deepCleanUndefined(value);
    }
  }
  return cleaned;
}


export function DocEditor({ doc: initialDoc, onEditorInstance }: DocEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [docData, setDocData] = useState(initialDoc);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const debouncedSave = useDebouncedCallback(async (updatedDoc: Doc) => {
    if (!user) return;
    setSaveStatus('saving');
    const docRef = doc(db, 'users', user.uid, 'docs', updatedDoc.id);

    const dataToSave = {
      title: updatedDoc.title,
      content: updatedDoc.content,
      backgroundColor: updatedDoc.backgroundColor,
      margin: updatedDoc.margin,
      fullWidth: updatedDoc.fullWidth,
      updatedAt: serverTimestamp(),
    };
    
    const cleanedData = deepCleanUndefined(dataToSave);

    try {
      await updateDoc(docRef, cleanedData);
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
        history: true,
        heading: {
            levels: [1, 2, 3, 4, 5, 6],
        },
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
      slashCommands.configure({
        suggestion: {
          appendTo: () => editorContainerRef.current,
        },
      }),
      TipTapImage.configure({
        inline: true,
        allowBase64: true,
      }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Superscript,
      Subscript,
      CharacterCount,
      TextTransform,
      Callout,
    ],
    content: docData.content,
    editorProps: {
      attributes: {
        id: 'editor',
        class: 'prose prose-black dark:prose-invert max-w-full focus:outline-none p-4 md:p-8',
      },
    },
    onUpdate: ({ editor }) => {
      const newContent = editor.getJSON();
      const updatedDoc = { ...docData, content: newContent };
      setDocData(updatedDoc);
      debouncedSave(updatedDoc);
    },
    onCreate: ({ editor }) => {
      onEditorInstance?.(editor);
    },
  });
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    const updatedDoc = { ...docData, title: newTitle };
    setDocData(updatedDoc);
    debouncedSave(updatedDoc);
  };
  
  const handleBackgroundColorChange = (color: string) => {
    const updatedDoc = { ...docData, backgroundColor: color };
    setDocData(updatedDoc);
    debouncedSave(updatedDoc);
  }
  
  const handleMarginChange = (margin: 'small' | 'medium' | 'large') => {
    const updatedDoc = { ...docData, margin };
    setDocData(updatedDoc);
    debouncedSave(updatedDoc);
  };

  const handleFullWidthToggle = () => {
    const updatedDoc = { ...docData, fullWidth: !docData.fullWidth };
    setDocData(updatedDoc);
    debouncedSave(updatedDoc);
  };

  const toggleFullscreen = useCallback(() => {
    const elem = editorContainerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        toast({ variant: 'destructive', title: 'Error entering fullscreen.', description: err.message });
      });
    } else {
      document.exitFullscreen();
    }
  }, [toast]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
  
  const marginClasses = {
      small: 'py-8',
      medium: 'py-16',
      large: 'py-24',
  };

  return (
    <div ref={editorContainerRef} className="flex-1 flex flex-col h-full overflow-y-hidden bg-background">
        <div className="p-4 border-b pr-16 relative bg-card">
            <EditorToolbar 
                editor={editor} 
                backgroundColor={docData.backgroundColor || '#FFFFFF'}
                onBackgroundColorChange={handleBackgroundColorChange}
                margin={docData.margin || 'medium'}
                onMarginChange={handleMarginChange}
                fullWidth={!!docData.fullWidth}
                onFullWidthToggle={handleFullWidthToggle}
              />
             <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-muted-foreground">
                {saveStatus === 'saving' && <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>}
                {saveStatus === 'saved' && <span>Saved</span>}
                <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
            </div>
        </div>
       
        <div 
          className="relative flex-1 overflow-y-auto" 
          onClick={() => editor.commands.focus()}
          style={{ backgroundColor: docData.backgroundColor || '#FFFFFF' }}
        >
            <div className={cn(
                "bg-transparent transition-all",
                marginClasses[docData.margin || 'medium'],
                !docData.fullWidth ? "max-w-4xl mx-auto" : "px-4 md:px-8"
            )}>
              <EditorContent editor={editor} />
            </div>
        </div>
        <div className="border-t text-xs text-muted-foreground p-2 flex justify-end gap-4 bg-card">
            <span>Words: {editor.storage.characterCount.words()}</span>
            <span>Characters: {editor.storage.characterCount.characters()}</span>
        </div>
    </div>
  );
}
