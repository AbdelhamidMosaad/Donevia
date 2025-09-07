
'use client';

import * as React from 'react';
import { useState } from 'react';
import { Flashcard } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlashcardViewProps {
  flashcards: Flashcard[];
}

export function FlashcardView({ flashcards }: FlashcardViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev + 1) % flashcards.length), 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length), 150);
  };

  if (flashcards.length === 0) {
    return <p>No flashcards available.</p>;
  }

  const currentFlashcard = flashcards[currentIndex];

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className="w-full max-w-xl h-64 perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
            className="relative w-full h-full cursor-pointer preserve-3d"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6 }}
        >
            {/* Front of the card */}
            <div className="absolute w-full h-full backface-hidden">
                <Card className="w-full h-full flex items-center justify-center p-6 text-center">
                    <p className="text-xl font-semibold">{currentFlashcard.front}</p>
                </Card>
            </div>
            {/* Back of the card */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180">
                <Card className="w-full h-full flex items-center justify-center p-6 text-center bg-muted">
                    <p>{currentFlashcard.back}</p>
                </Card>
            </div>
        </motion.div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Card {currentIndex + 1} of {flashcards.length}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handlePrev}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => setIsFlipped(!isFlipped)}>
            <RefreshCw className="mr-2 h-4 w-4"/>
            Flip Card
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Add this to your globals.css or a style tag if needed for the 3D effect
const style = `
  .perspective-1000 { perspective: 1000px; }
  .preserve-3d { transform-style: preserve-3d; }
  .backface-hidden { backface-visibility: hidden; }
  .rotate-y-180 { transform: rotateY(180deg); }
`;

if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = style;
    document.head.appendChild(styleElement);
}
