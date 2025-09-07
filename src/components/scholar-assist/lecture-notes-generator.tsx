
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { InputForm, type InputFormValues } from './shared/input-form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { StudyMaterialRequest, StudyMaterialResponse } from '@/ai/flows/learning-tool-flow';
import { Button } from '../ui/button';
import { Loader2, Copy } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

export function LectureNotesGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [result, setResult] = useState<StudyMaterialResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (values: InputFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const requestPayload: StudyMaterialRequest = {
        sourceText: values.sourceText,
        generationType: 'notes',
        notesOptions: {
          style: values.noteStyle,
          complexity: values.complexity,
        },
      };

      const response = await fetch('/api/learning-tool/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate notes.');
      }

      const data: StudyMaterialResponse = await response.json();
      setResult(data);

    } catch (error) {
      console.error("Notes generation failed:", error);
      toast({ variant: 'destructive', title: 'Generation Failed', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
      setResult(null);
  }
  
  const handleCopy = () => {
    if (!result?.notesContent) return;
    const fullText = `${result.title}\n\n${result.notesContent}`;
    navigator.clipboard.writeText(fullText);
    toast({ title: '✓ Copied to clipboard!' });
  };


  if (result && result.notesContent) {
    return (
        <Card className="flex-1 flex flex-col">
            <CardHeader>
                <CardTitle>{result.title}</CardTitle>
                <CardDescription>Your AI-generated notes are ready.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                 <ScrollArea className="h-full border rounded-md p-4 bg-muted/50 max-h-[50vh]">
                     <div className="whitespace-pre-wrap">
                        {result.notesContent}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleReset}>Generate New Notes</Button>
                <Button onClick={handleCopy}><Copy className="mr-2 h-4 w-4"/> Copy</Button>
            </CardFooter>
        </Card>
    )
  }

  return (
    <InputForm
      onGenerate={handleGenerate}
      isLoading={isLoading}
      showNoteOptions
    />
  );
}
