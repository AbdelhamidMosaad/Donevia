
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { InputForm, type InputFormValues } from './shared/input-form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { Loader2, Download, RefreshCw, Save } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { generateLectureNotes, type LectureNotesResponse } from '@/ai/flows/lecture-notes-flow';
import { saveAs } from 'file-saver';
import { Packer, Document, Paragraph, TextRun, HeadingLevel } from 'docx';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export function LectureNotesGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<LectureNotesResponse | null>(null);

  const handleGenerate = async (values: InputFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const data = await generateLectureNotes({ sourceText: values.sourceText });
      setResult(data);
    } catch (error) {
      console.error("Note generation failed:", error);
      toast({ variant: 'destructive', title: 'Generation Failed', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  const handleExportWord = () => {
    if (!result) return;
    
    const docChildren = [
        new Paragraph({ text: result.title, heading: HeadingLevel.TITLE }),
        new Paragraph({ text: result.overview, heading: HeadingLevel.HEADING_3, style: "Heading3" }),
    ];

    result.sections.forEach(section => {
        docChildren.push(new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_2, style: "Heading2" }));
        section.content.forEach(point => {
            docChildren.push(new Paragraph({ text: point, bullet: { level: 0 } }));
        });
    });

    docChildren.push(new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2, style: "Heading2" }));
    docChildren.push(new Paragraph(result.summary));

    const doc = new Document({ sections: [{ children: docChildren }] });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${result.title.replace(/ /g, '_')}_notes.docx`);
    });
    toast({ title: '✓ Exporting as Word document' });
  };
  
  const handleSaveToDocs = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    
    const contentBlocks: any[] = [
      { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: result.title }] },
      { type: 'paragraph', content: [{ type: 'text', text: result.overview, marks: [{ type: 'italic' }] }] },
    ];

    result.sections.forEach(section => {
        contentBlocks.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: section.heading }] });
        contentBlocks.push({
            type: 'bulletList',
            content: section.content.map(point => ({
                type: 'listItem',
                content: [{ type: 'paragraph', content: [{ type: 'text', text: point }] }]
            }))
        });
    });

    contentBlocks.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Summary' }] });
    contentBlocks.push({ type: 'paragraph', content: [{ type: 'text', text: result.summary }] });

    try {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'docs'), {
            title: result.title,
            content: { type: 'doc', content: contentBlocks },
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        toast({ title: '✓ Saved to Docs' });
        router.push(`/docs/${docRef.id}`);
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error saving to Docs' });
    } finally {
        setIsSaving(false);
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          <h3 className="text-xl font-semibold font-headline">Generating Your Notes...</h3>
          <p className="text-muted-foreground">The AI is processing your document. This may take a moment.</p>
        </div>
      );
    }
    if (result) {
      return (
        <Card className="flex-1 flex flex-col h-full">
          <CardHeader>
            <CardTitle>{result.title}</CardTitle>
            <CardDescription>Your AI-generated lecture notes are ready.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-4 -mr-4">
              <div className="space-y-6 prose prose-sm dark:prose-invert max-w-none">
                <blockquote className="border-l-4 pl-4 italic">{result.overview}</blockquote>
                {result.sections.map((section, i) => (
                  <div key={i}>
                    <h3>{section.heading}</h3>
                    <ul>
                      {section.content.map((point, j) => <li key={j}>{point}</li>)}
                    </ul>
                  </div>
                ))}
                <h3>Summary</h3>
                <p>{result.summary}</p>
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="outline" onClick={handleReset}><RefreshCw/> Generate New</Button>
            <Button onClick={handleSaveToDocs} disabled={isSaving}>
                {isSaving ? <Loader2/> : <Save/>}
                Save to Docs
            </Button>
            <Button variant="outline" onClick={handleExportWord}><Download/> Export .docx</Button>
          </CardFooter>
        </Card>
      );
    }
    return <InputForm onGenerate={handleGenerate} generationType="notes" />;
  }

  return <div className="flex flex-col h-full gap-6">{renderContent()}</div>;
}
