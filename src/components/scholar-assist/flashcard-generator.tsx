
'use client';

import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { InputForm } from './shared/input-form';
import type { GeneratedLearningContent, Flashcard } from '@/lib/types';
import { Loader2, ArrowRight } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { motion, AnimatePresence } from 'framer-motion';

function FlashcardCard({ card }: { card: Flashcard }) {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div className="w-full h-64 perspective-1000">
            <motion.div
                className="relative w-full h-full transform-style-3d transition-transform duration-700"
                initial={false}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* Front of card */}
                <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 bg-card border rounded-lg shadow-md">
                     <p className="text-xl font-semibold text-center">{card.front}</p>
                </div>
                {/* Back of card */}
                <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 bg-primary text-primary-foreground border rounded-lg shadow-md" style={{ transform: 'rotateY(180deg)' }}>
                    <p className="text-center">{card.back}</p>
                </div>
            </motion.div>
        </div>
    );
}


export function FlashcardGenerator() {
    const [generatedContent, setGeneratedContent] = useState<GeneratedLearningContent | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    return (
        <div className="grid md:grid-cols-2 gap-6">
            <InputForm 
                onGenerationStart={() => setIsLoading(true)}
                onGenerationComplete={(content) => {
                    setGeneratedContent(content);
                    setIsLoading(false);
                }}
                onGenerationError={() => setIsLoading(false)}
                generationType='flashcards'
                title="Generate Flashcards"
                description="Upload a document or paste text to create flashcards for key concepts."
            />
            <Card className="min-h-[400px]">
                <CardContent className="p-6 h-full">
                     {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
                            <Loader2 className="h-16 w-16 animate-spin mb-4" />
                            <h3 className="text-xl font-semibold font-headline">Generating Flashcards...</h3>
                            <p>The AI is working its magic. This may take a moment.</p>
                        </div>
                    ) : generatedContent?.flashcards && generatedContent.flashcards.length > 0 ? (
                        <Carousel className="w-full max-w-xs mx-auto">
                            <CarouselContent>
                                {generatedContent.flashcards.map((card, index) => (
                                    <CarouselItem key={index}>
                                        <div className="p-1">
                                            <FlashcardCard card={card} />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                            Your generated flashcards will appear here.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
