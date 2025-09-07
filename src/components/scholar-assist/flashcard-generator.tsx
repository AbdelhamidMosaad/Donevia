
'use client';

import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { InputForm } from './shared/input-form';
import type { StudyMaterialResponse, StudyMaterialRequest, Flashcard } from '@/ai/flows/learning-tool-flow';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { Loader2, Copy, BrainCircuit } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { AnimatePresence, motion } from 'framer-motion';

export function FlashcardGenerator() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [result, setResult] = useState<StudyMaterialResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFlipped, setIsFlipped] = useState(false);

    const handleGenerate = async (values: { sourceText: string }) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in.' });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const requestPayload: StudyMaterialRequest = {
                sourceText: values.sourceText,
                generationType: 'flashcards',
            };
            const response = await fetch('/api/learning-tool/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
                body: JSON.stringify(requestPayload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate flashcards.');
            }

            const data: StudyMaterialResponse = await response.json();
            setResult(data);

        } catch (error) {
            console.error("Flashcard generation failed:", error);
            toast({ variant: 'destructive', title: 'Generation Failed', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setResult(null);
        setIsFlipped(false);
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <h3 className="text-xl font-semibold font-headline">Generating Flashcards...</h3>
                <p className="text-muted-foreground">The AI is creating your study material. This may take a moment.</p>
            </div>
        );
    }
    
    if (result && result.flashcardContent) {
        return (
             <div className="flex flex-col items-center justify-center gap-6">
                <h2 className="text-2xl font-bold font-headline">{result.title}</h2>
                 <Carousel className="w-full max-w-lg" onSelect={() => setIsFlipped(false)}>
                    <CarouselContent>
                        {result.flashcardContent.map((flashcard, index) => (
                            <CarouselItem key={index}>
                                <div className="p-1">
                                <Card 
                                    className="h-80 flex flex-col items-center justify-center p-6 text-center cursor-pointer"
                                    onClick={() => setIsFlipped(!isFlipped)}
                                >
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={isFlipped ? 'definition' : 'term'}
                                            initial={{ rotateY: 90, opacity: 0 }}
                                            animate={{ rotateY: 0, opacity: 1 }}
                                            exit={{ rotateY: -90, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="w-full h-full flex flex-col justify-center items-center"
                                        >
                                            {isFlipped ? (
                                                <p className="text-lg">{flashcard.definition}</p>
                                            ) : (
                                                <h3 className="text-2xl font-semibold">{flashcard.term}</h3>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>
                                </Card>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
                <Button variant="outline" onClick={handleReset}>Generate New Flashcards</Button>
            </div>
        );
    }
    
    return <InputForm onGenerate={handleGenerate} />;
}
