
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { InputForm, type InputFormValues } from './shared/input-form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { StudyMaterialRequest, StudyMaterialResponse } from '@/ai/flows/learning-tool-flow';
import { Button } from '../ui/button';
import { Loader2, Copy, Download, Save } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { addDoc as addFirestoreDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export function LectureNotesGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [result, setResult] = useState<StudyMaterialResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingToDocs, setIsSavingToDocs] = useState(false);

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
  
  const handleDownload = () => {
    if (!result?.notesContent) return;
    const fullText = `${result.title}\n\n${result.notesContent}`;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.title.replace(/ /g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: '✓ Download started' });
  };

  const handleSaveToDocs = async () => {
    if (!user || !result || !result.notesContent) {
      toast({ variant: 'destructive', title: 'Could not save document.' });
      return;
    }

    setIsSavingToDocs(true);

    // Convert plain text to TipTap JSON format
    const contentJSON = {
      type: 'doc',
      content: result.notesContent.split('\n').map(paragraph => ({
        type: 'paragraph',
        content: paragraph ? [{ type: 'text', text: paragraph }] : [],
      })),
    };
    
    try {
      const docRef = await addFirestoreDoc(collection(db, 'users', user.uid, 'docs'), {
        title: result.title,
        content: contentJSON,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        folderId: null,
      });
      toast({
        title: '✓ Saved to Docs',
        description: `"${result.title}" has been created.`,
      });
      router.push(`/docs/${docRef.id}`);
    } catch (e) {
      console.error("Error saving document: ", e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save document. Please try again.',
      });
    } finally {
      setIsSavingToDocs(false);
    }
  }

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <h3 className="text-xl font-semibold font-headline">Generating Your Notes...</h3>
                <p className="text-muted-foreground">The AI is creating your study material. This may take a moment.</p>
            </div>
        );
    }
    if (result && result.notesContent) {
        return (
            <Card className="flex-1 flex flex-col h-full">
                <CardHeader>
                    <CardTitle>{result.title}</CardTitle>
                    <CardDescription>Your AI-generated notes are ready.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                    <ScrollArea className="h-full border rounded-md p-4 bg-muted/50">
                        <div className="whitespace-pre-wrap font-sans">
                            {result.notesContent}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="flex-wrap justify-end gap-2">
                    <Button variant="outline" onClick={handleReset}>Generate New Notes</Button>
                    <Button onClick={handleSaveToDocs} disabled={isSavingToDocs}>
                        {isSavingToDocs ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSavingToDocs ? 'Saving...' : 'Save to Docs'}
                    </Button>
                    <Button variant="outline" onClick={handleCopy}><Copy className="mr-2 h-4 w-4"/> Copy Text</Button>
                    <Button variant="outline" onClick={handleDownload}><Download className="mr-2 h-4 w-4"/> Download .txt</Button>
                </CardFooter>
            </Card>
        )
    }
     return <InputForm onGenerate={handleGenerate} generationType="notes" />;
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {renderContent()}
    </div>
  )
}
