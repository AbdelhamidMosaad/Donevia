
'use client';

import type { FlashcardToolCard } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card } from '../ui/card';

interface StudyCardProps {
  card: FlashcardToolCard;
  isFlipped: boolean;
  onFlip: () => void;
}

export function StudyCard({ card, isFlipped, onFlip }: StudyCardProps) {
  return (
    <div className="w-full max-w-2xl h-80 perspective-1000 cursor-pointer" onClick={onFlip}>
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
