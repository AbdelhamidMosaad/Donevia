
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { StickyNote } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { Palette, Check, CaseSensitive, Flag, MessageSquareQuote, ImageIcon, X, Upload, Loader2, Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Sparkles, Wand2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { GrammarCoach } from './english-coach/grammar-coach';
import Image from 'next/image';
import { getAuth } from 'firebase/auth';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useDebouncedCallback } from 'use-debounce';
import { Toggle } from './ui/toggle';
import { Separator } from './ui/separator';
import { rephraseText } from '@/ai/flows/rephrase-flow';
import type { RephraseResponse } from '@/lib/types/rephrase';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

interface StickyNoteDialogProps {
  note: StickyNote;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onNoteDeleted: () => void;
}

const backgroundColors = ['#fff176', '#ff8a65', '#81d4fa', '#aed581', '#ce93d8', '#fdcbf1', '#fdfd96'];
const textColors = ['#000000', '#FFFFFF', '#ef4444', '#3b82f6', '#16a34a', '#7c3aed'];

const StickyNoteToolbar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="p-1 border-b flex items-center gap-1 flex-wrap" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
        <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()}><Bold size={16}/></Toggle>
        <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()}><Italic size={16}/></Toggle>
        <Separator orientation="vertical" className="h-6 mx-1"/>
        <Toggle size="sm" pressed={editor.isActive('heading', { level: 1 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={16}/></Toggle>
        <Toggle size="sm" pressed={editor.isActive('heading', { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={16}/></Toggle>
        <Toggle size="sm" pressed={editor.isActive('heading', { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={16}/></Toggle>
        <Separator orientation="vertical" className="h-6 mx-1"/>
        <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}><List size={16}/></Toggle>
        <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16}/></Toggle>
    </div>
  )
}

function RephraseDialog({ text, onApply, onOpenChange, open }: { text: string, onApply: (newText: string) => void, onOpenChange: (open: boolean) => void, open: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RephraseResponse | null>(null);
  const { toast } = useToast();

  const handleRephrase = useCallback(async () => {
    if (!text) return;
    setIsLoading(true);
    setResult(null);
    try {
      const data = await rephraseText({ text });
      setResult(data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Rephrasing Failed' });
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  }, [text, onOpenChange, toast]);

  useEffect(() => {
    if (open) {
      handleRephrase();
    }
  }, [open, handleRephrase]);

  const handleSelectVersion = (version: string) => {
    onApply(version);
    onOpenChange(false);
  };
  
  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    toast({ title: '✓ Copied to clipboard!' });
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles/> Rephrase Suggestions</DialogTitle>
          <DialogDescription>Select a version to apply it to your note.</DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          )}
          {result && (
            <div className="space-y-4">
              {result.rephrasedVersions.map((item, index) => (
                <Card key={index} className="cursor-pointer hover:border-primary" onClick={() => handleSelectVersion(item.version)}>
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-base">Version {index + 1}</CardTitle>
                     <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleCopy(item.version)}} className="h-7 w-7"><Copy className="h-4 w-4"/></Button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-primary">{item.version}</p>
                    <p className="text-xs text-muted-foreground mt-2">{item.explanation}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function StickyNoteDialog({ note, isOpen, onOpenChange, onNoteDeleted }: StickyNoteDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState(note.title);
  const [bgColor, setBgColor] = useState(note.color);
  const [textColor, setTextColor] = useState(note.textColor);
  const [priority, setPriority] = useState<StickyNote['priority']>(note.priority || 'Medium');
  const [imageUrl, setImageUrl] = useState(note.imageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRephraseOpen, setIsRephraseOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  const noteRef = user ? doc(db, 'users', user.uid, 'stickyNotes', note.id) : null;
  
  const debouncedUpdate = useDebouncedCallback(async (field: keyof StickyNote, value: any) => {
     if (!noteRef) return;
     try {
       await updateDoc(noteRef, { [field]: value, updatedAt: serverTimestamp() });
     } catch (e) { console.error('Error updating note:', e); }
  }, 500);

  const uploadFile = useCallback(async (file: File) => {
    if (!user || !noteRef) return;
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({ variant: 'destructive', title: 'File too large', description: 'Please upload images smaller than 5MB.' });
      return;
    }
    setIsUploading(true);

    const idToken = await getAuth().currentUser?.getIdToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('idToken', idToken!);
    
    try {
        const res = await fetch('/api/notes/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const { url } = await res.json();
        
        await updateDoc(noteRef, { imageUrl: url, updatedAt: serverTimestamp() });
        setImageUrl(url);
        toast({ title: 'Image uploaded successfully!' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Upload failed', description: (e as Error).message });
    } finally {
        setIsUploading(false);
    }
  }, [user, noteRef, toast]);


  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Type your note here...',
      }),
    ],
    content: note.content || note.text, // Handle legacy plain text
    editorProps: {
        attributes: {
            class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none p-2',
            style: `color: ${textColor}`
        },
        handlePaste: (view, event) => {
            const items = (event.clipboardData || (window as any).clipboardData).items;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.indexOf('image') === 0) {
                    const file = item.getAsFile();
                    if (file) {
                        uploadFile(file);
                        return true; // Prevent default paste behavior
                    }
                }
            }
            return false; // Let tiptap handle other pastes
        },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      debouncedUpdate('content', json);
    },
    onSelectionUpdate: ({ editor }) => {
        const { from, to } = editor.state.selection;
        setSelectedText(editor.state.doc.textBetween(from, to, ' '));
    }
  });
  
  useEffect(() => {
    setTitle(note.title);
    setBgColor(note.color);
    setTextColor(note.textColor);
    setPriority(note.priority || 'Medium');
    setImageUrl(note.imageUrl);

    if (editor) {
        editor.setOptions({
            editorProps: { attributes: { style: `color: ${note.textColor}` }}
        })
        if (JSON.stringify(editor.getJSON()) !== JSON.stringify(note.content)) {
            editor.commands.setContent(note.content || note.text || '', false);
        }
    }
  }, [note, editor]);
  
  useEffect(() => {
    if (editor && textColor !== note.textColor) {
         editor.setOptions({
            editorProps: { attributes: { style: `color: ${textColor}` }}
        })
    }
  }, [textColor, editor, note.textColor]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    debouncedUpdate('title', newTitle);
  }

  const handleColorChange = async (newColor: string, type: 'background' | 'text') => {
    const fieldToUpdate = type === 'background' ? 'color' : 'textColor';
    const stateUpdateFn = type === 'background' ? setBgColor : setTextColor;
    stateUpdateFn(newColor);
    debouncedUpdate(fieldToUpdate, newColor);
  };
  
  const handlePriorityChange = async (newPriority: StickyNote['priority']) => {
    setPriority(newPriority);
    debouncedUpdate('priority', newPriority);
  };
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    uploadFile(file);
  };
  
  const handleRemoveImage = async () => {
    if (!noteRef) return;
    setImageUrl(undefined);
    debouncedUpdate('imageUrl', deleteField());
  };

  const handleGrammarCheckClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="p-0 border-none shadow-2xl max-w-2xl w-full h-auto max-h-[80vh] flex flex-col" 
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <DialogHeader className="p-4 border-b" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
          <DialogTitle>
             <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-lg w-full"
                placeholder="Note Title"
                style={{ color: 'inherit' }}
            />
          </DialogTitle>
        </DialogHeader>
        <StickyNoteToolbar editor={editor}/>
        <div className="flex-1 p-2 overflow-y-auto space-y-4">
            {imageUrl && (
              <div className="relative group p-2">
                <Image src={imageUrl} alt={title || 'Note image'} width={500} height={300} className="rounded-md object-cover w-full" />
                <Button variant="destructive" size="icon" className="absolute top-4 right-4 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={handleRemoveImage}><X/></Button>
              </div>
            )}
            <EditorContent editor={editor} />
        </div>
        <DialogFooter className="p-2 border-t flex justify-between items-center" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
             <div onClick={handleGrammarCheckClick} className="flex items-center gap-1">
                <GrammarCoach text={editor?.getText()} onCorrection={(corrected) => editor?.commands.setContent(corrected, true)} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-inherit hover:bg-black/10" onClick={() => setIsRephraseOpen(true)} disabled={!selectedText}>
                    <Sparkles className="h-4 w-4"/>
                </Button>
             </div>
             <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-inherit hover:bg-black/10" onClick={() => fileInputRef.current?.click()}>
                    {isUploading ? <Loader2 className="animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                
                <Select onValueChange={handlePriorityChange} value={priority}>
                <SelectTrigger className="w-[120px] h-8 text-xs bg-transparent border-black/10 hover:bg-black/10">
                    <Flag className="h-3 w-3 mr-1"/>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
                </Select>
                <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-inherit hover:bg-black/10">
                    <Palette className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                    <div className="flex gap-1">
                    {backgroundColors.map((c) => (
                        <button
                        key={c}
                        onClick={() => handleColorChange(c, 'background')}
                        className={cn('h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center')}
                        style={{ backgroundColor: c }}
                        >
                        {bgColor === c && <Check className="h-4 w-4 text-black" />}
                        </button>
                    ))}
                    </div>
                </PopoverContent>
                </Popover>
                <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-inherit hover:bg-black/10">
                    <CaseSensitive className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                    <div className="flex gap-1">
                    {textColors.map((c) => (
                        <button
                        key={c}
                        onClick={() => handleColorChange(c, 'text')}
                        className={cn('h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center')}
                        style={{ backgroundColor: c }}
                        >
                        {textColor === c && <Check className="h-4 w-4" style={{ color: c === '#FFFFFF' ? '#000000' : '#FFFFFF' }} />}
                        </button>
                    ))}
                    </div>
                </PopoverContent>
                </Popover>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {editor && (
      <RephraseDialog 
        open={isRephraseOpen} 
        onOpenChange={setIsRephraseOpen}
        text={selectedText}
        onApply={(newText) => {
            const { from, to } = editor.state.selection;
            editor.chain().focus().deleteRange({ from, to }).insertContent(newText).run();
        }}
      />
    )}
    </>
  );
}
