
'use client';

import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { InputForm } from './shared/input-form';
import type { GeneratedLearningContent } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { remark } from 'remark';
import html from 'remark-html';

async function markdownToHtml(markdown: string) {
    const result = await remark().use(html).process(markdown);
    return result.toString();
}

export function LectureNotesGenerator() {
    const [generatedContent, setGeneratedContent] = useState<GeneratedLearningContent | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [htmlNotes, setHtmlNotes] = useState('');

    const handleGeneration = async (content: GeneratedLearningContent) => {
        setGeneratedContent(content);
        if (content.lectureNotes) {
            const convertedHtml = await markdownToHtml(content.lectureNotes);
            setHtmlNotes(convertedHtml);
        }
    };
    
    return (
        <div className="grid md:grid-cols-2 gap-6">
            <InputForm 
                onGenerationStart={() => setIsLoading(true)}
                onGenerationComplete={(content) => {
                    handleGeneration(content);
                    setIsLoading(false);
                }}
                onGenerationError={() => setIsLoading(false)}
                generationType='notes'
                title="Generate Lecture Notes"
                description="Upload a document or paste text to create structured lecture notes."
            />
            <Card className="min-h-[400px]">
                <CardContent className="p-6 h-full">
                     {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
                            <Loader2 className="h-16 w-16 animate-spin mb-4" />
                            <h3 className="text-xl font-semibold font-headline">Generating Notes...</h3>
                            <p>The AI is working its magic. This may take a moment.</p>
                        </div>
                    ) : htmlNotes ? (
                        <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                            <div
                                className="prose dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: htmlNotes }}
                            />
                        </ScrollArea>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                            Your generated notes will appear here.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
