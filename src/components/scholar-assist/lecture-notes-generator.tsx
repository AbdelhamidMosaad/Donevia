'use client';

import { useState } from 'react';
import { InputForm, type InputFormValues } from './shared/input-form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { generateLectureNotes } from '@/ai/flows/generate-lecture-notes-flow';
import type { LectureNotesResponse } from '@/lib/types/lecture-notes';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { marked } from 'marked';

// A component to display the generated notes
const NotesDisplay = ({ result, onReset }: { result: LectureNotesResponse, onReset: () => void }) => {
    return (
        <Card className="flex-1 flex flex-col h-full">
            <CardHeader>
                <CardTitle>{result.title}</CardTitle>
                <CardDescription>Your AI-generated lecture notes are ready.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <ScrollArea className="h-full pr-4 -mr-4">
                    <div
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: marked(result.notes) as string }}
                    />
                </ScrollArea>
            </CardContent>
            <CardFooter>
                <Button variant="outline" onClick={onReset}>Generate New Notes</Button>
            </CardFooter>
        </Card>
    );
};


export function LectureNotesGenerator() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<LectureNotesResponse | null>(null);

    const handleGenerate = async (values: InputFormValues) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in.' });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const data = await generateLectureNotes({ sourceText: values.sourceText! });
            setResult(data);
        } catch (error: any) {
            console.error("Lecture notes generation failed:", error);
            toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setResult(null);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
                    <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                    <h3 className="text-xl font-semibold font-headline">Generating Your Notes...</h3>
                    <p className="text-muted-foreground">The AI is structuring your content. This may take a moment.</p>
                </div>
            );
        }
        if (result) {
            return <NotesDisplay result={result} onReset={handleReset} />;
        }
        return <InputForm onGenerate={handleGenerate} generationType="notes" />;
    }

    return (
        <div className="flex flex-col h-full gap-6">
            {renderContent()}
        </div>
    );
}
