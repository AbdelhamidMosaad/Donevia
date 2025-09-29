
'use client';

import { useState, useEffect, useRef } from 'react';
import type { JournalEntry } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from 'use-debounce';
import { Editor } from '@tiptap/react';
import { DocEditor } from '@/components/docs/doc-editor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Sparkles, Smile, Meh, Frown, Tags } from 'lucide-react';
import { useRouter } from 'next/navigation';
import moment from 'moment';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { analyzeJournalEntry } from '@/ai/flows/journal-analysis-flow';

type Analysis = {
    grammar: any[],
    tone: string,
    suggestions: string[]
}

export function JournalEditor({ entry: initialEntry }: { entry: JournalEntry }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [entry, setEntry] = useState(initialEntry);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const debouncedSave = useDebouncedCallback(async (updatedEntry: Partial<JournalEntry>) => {
    if (!user) return;
    const entryRef = doc(db, 'users', user.uid, 'journalEntries', entry.id);
    try {
      await updateDoc(entryRef, {
        ...updatedEntry,
        updatedAt: serverTimestamp(),
      });
      // Do not show toast on auto-save
    } catch (e) {
      console.error("Error saving entry:", e);
      toast({ variant: 'destructive', title: 'Error saving entry.' });
    }
  }, 1500);

  const handleFieldChange = (field: keyof JournalEntry, value: any) => {
    const updatedEntry = { ...entry, [field]: value };
    setEntry(updatedEntry);
    debouncedSave({ [field]: value });
  };
  
  const handleAnalyze = async () => {
    if(!editorInstance) return;
    setIsAiLoading(true);
    setAnalysis(null);
    try {
        const textContent = editorInstance.getText();
        const result = await analyzeJournalEntry({ text: textContent });
        setAnalysis(result);
    } catch(e) {
        toast({ variant: 'destructive', title: 'Analysis failed' });
    } finally {
        setIsAiLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/journal')}>
            <ArrowLeft />
          </Button>
          <Input 
            value={entry.title} 
            onChange={(e) => handleFieldChange('title', e.target.value)} 
            className="text-2xl font-bold font-headline h-auto border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {moment(entry.createdAt.toDate()).format('MMMM D, YYYY, h:mm A')}
        </div>
      </div>
      
      <div className="grid md:grid-cols-[1fr_300px] gap-6 flex-1 min-h-0">
        <div className="border rounded-lg flex flex-col h-full">
            <DocEditor
                doc={{ ...entry, content: entry.content }}
                onEditorInstance={setEditorInstance}
                onContentChange={(newContent) => handleFieldChange('content', newContent)}
            />
        </div>
        <div className="space-y-4">
            <h3 className="font-semibold text-lg">Entry Details</h3>
            <div>
                <label className="text-sm font-medium">Mood</label>
                <div className="flex gap-2 mt-2">
                    {(['Happy', 'Neutral', 'Sad'] as const).map(mood => (
                        <Button key={mood} variant={entry.mood === mood ? 'default' : 'outline'} size="icon" onClick={() => handleFieldChange('mood', mood)}>
                            {mood === 'Happy' && <Smile />}
                            {mood === 'Neutral' && <Meh />}
                            {mood === 'Sad' && <Frown />}
                        </Button>
                    ))}
                </div>
            </div>
             <div>
                <label className="text-sm font-medium">Tags</label>
                <Input placeholder="Add tags, comma separated" defaultValue={entry.tags?.join(', ')} onBlur={(e) => handleFieldChange('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}/>
            </div>
            
            <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-lg">AI Analysis</h3>
                <Button onClick={handleAnalyze} disabled={isAiLoading} className="w-full">
                    {isAiLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    {isAiLoading ? 'Analyzing...' : 'Analyze Entry'}
                </Button>
                {analysis && (
                    <div className="space-y-2 text-sm">
                        <p><strong>Tone:</strong> {analysis.tone}</p>
                        <div>
                            <strong>Suggestions:</strong>
                            <ul className="list-disc pl-5">
                                {analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
