
'use client';

import { useState } from 'react';
import type { FlashcardToolCard } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '../ui/card';

interface StudyCardProps {
  card: FlashcardToolCard;
}

export function StudyCard({ card }: StudyCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when card changes
  useState(() => {
    setIsFlipped(false);
  });

  return (
    <div className="w-full max-w-2xl h-80 perspective-1000 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 transform-style-3d",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front of the card */}
        <Card className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 text-center bg-card">
          <p className="text-2xl font-bold">{card.front}</p>
        </Card>
        {/* Back of the card */}
        <Card className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 text-center bg-primary text-primary-foreground rotate-y-180">
          <p className="text-xl">{card.back}</p>
        </Card>
      </div>
    </div>
  );
}
