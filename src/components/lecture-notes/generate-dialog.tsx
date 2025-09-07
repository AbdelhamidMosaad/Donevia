
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { LectureNotesRequest, LectureNotesResponse } from '@/lib/types';
import { Loader2, Copy } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface GenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const placeholderText = `Artificial intelligence (AI) is intelligence demonstrated by machines, as opposed to the natural intelligence displayed by animals including humans. AI applications include advanced web search engines (e.g., Google), recommendation systems (used by YouTube, Amazon and Netflix), understanding human speech (such as Siri and Alexa), self-driving cars (e.g., Tesla), automated decision-making and competing at the highest level in strategic game systems (such as chess and Go).

As machines become increasingly capable, tasks considered to require "intelligence" are often removed from the definition of AI, a phenomenon known as the AI effect. For instance, optical character recognition is frequently excluded from things considered to be AI, having become a routine technology.

The various sub-fields of AI research are centered around particular goals and the use of particular tools. The traditional goals of AI research include reasoning, knowledge representation, planning, learning, natural language processing, perception, and the ability to move and manipulate objects. General intelligence (the ability to solve an arbitrary problem) is among the field's long-term goals.`;


export function GenerateDialog({ open, onOpenChange }: GenerateDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sourceText, setSourceText] = useState(placeholderText);
  const [noteStyle, setNoteStyle] = useState<'detailed' | 'bullet' | 'outline' | 'summary'>('detailed');
  const [complexity, setComplexity] = useState<'simple' | 'medium' | 'advanced'>('medium');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LectureNotesResponse | null>(null);

  const handleGenerate = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in' });
        return;
    }
    if (!sourceText.trim()) {
        toast({ variant: 'destructive', title: 'Source text cannot be empty' });
        return;
    }
    
    setIsLoading(true);
    setResult(null);

    try {
        const requestPayload: LectureNotesRequest = {
            sourceText,
            style: noteStyle,
            complexity,
        };
        const response = await fetch('/api/lecture-notes/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${await user.getIdToken()}`,
            },
            body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate notes.');
        }

        const data: LectureNotesResponse = await response.json();
        setResult(data);

    } catch (error) {
        console.error("Note generation failed:", error);
        toast({ variant: 'destructive', title: 'Generation Failed', description: (error as Error).message });
    } finally {
        setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.notes) return;
    navigator.clipboard.writeText(result.notes);
    toast({ title: '✓ Copied to clipboard!' });
  };
  
  const handleReset = () => {
    setResult(null);
    setSourceText(placeholderText);
    setNoteStyle('detailed');
    setComplexity('medium');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Generate Lecture Notes</DialogTitle>
          <DialogDescription>
            Create structured lecture notes from any text using AI.
          </DialogDescription>
        </DialogHeader>
        
        {!result ? (
            <div className="grid md:grid-cols-2 gap-6 py-4 flex-1 min-h-0">
                <div className="flex flex-col gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                        <Label htmlFor="sourceText">Source Text</Label>
                        <Textarea
                            id="sourceText"
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                            className="flex-1 resize-none"
                            placeholder="Paste your source text here..."
                        />
                    </div>
                     <Button onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isLoading ? 'Generating...' : 'Generate Notes'}
                    </Button>
                </div>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="noteStyle">Note Style</Label>
                        <Select value={noteStyle} onValueChange={(v: any) => setNoteStyle(v)}>
                            <SelectTrigger id="noteStyle"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="detailed">Detailed Notes</SelectItem>
                                <SelectItem value="bullet">Bullet Points</SelectItem>
                                <SelectItem value="outline">Outline Format</SelectItem>
                                <SelectItem value="summary">Summary</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                        <Label htmlFor="complexity">Complexity Level</Label>
                        <Select value={complexity} onValueChange={(v: any) => setComplexity(v)}>
                            <SelectTrigger id="complexity"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="simple">Simple</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        ) : (
            <div className="py-4 flex-1 min-h-0 flex flex-col gap-4">
                <ScrollArea className="flex-1 border rounded-md p-4 bg-muted/50">
                     <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
                        <h4>{result.title}</h4>
                        <p>{result.notes}</p>
                    </div>
                </ScrollArea>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleReset}>Generate New Notes</Button>
                    <Button onClick={handleCopy}><Copy className="mr-2 h-4 w-4"/> Copy</Button>
                </div>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
