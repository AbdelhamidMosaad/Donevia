
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { InputForm, type InputFormValues } from './shared/input-form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { StudyMaterialRequest, StudyMaterialResponse, Flashcard } from '@/lib/types';
import { Button } from '../ui/button';
import { Loader2, Copy, Download, ChevronLeft, ChevronRight, RefreshCw, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SaveToDeckDialog } from './shared/save-to-deck-dialog';
import { generateStudyMaterial } from '@/ai/flows/generate-study-material';

interface FlashcardGeneratorProps {
  result: StudyMaterialResponse | null;
  setResult: (result: StudyMaterialResponse | null) => void;
}

export function FlashcardGenerator({ result, setResult }: FlashcardGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleGenerate = async (values: InputFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setCurrentCardIndex(0);
    setIsFlipped(false);

    try {
      const requestPayload: StudyMaterialRequest = {
        sourceText: values.sourceText,
        generationType: 'flashcards',
        flashcardsOptions: {
            numCards: values.numCards,
            style: values.cardStyle,
        },
      };

      const data = await generateStudyMaterial(requestPayload);
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
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };
  
  const handleCopy = () => {
    if (!result?.flashcardContent) return;
    let text = `${result.title}\n\n`;
    result.flashcardContent.forEach((card, i) => {
      text += `Card ${i + 1}\nFront: ${card.front}\nBack: ${card.back}\n\n`;
    });
    navigator.clipboard.writeText(text);
    toast({ title: '✓ Copied to clipboard!' });
  };
  
  const handleDownload = () => {
    if (!result?.flashcardContent) return;
    let text = `${result.title}\n\n`;
    result.flashcardContent.forEach((card, i) => {
      text += `Card ${i + 1}\nFront: ${card.front}\nBack: ${card.back}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.title.replace(/ /g, '_')}_flashcards.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: '✓ Download started' });
  };
  
  const navigateCard = (direction: 'prev' | 'next') => {
    setIsFlipped(false);
    if (direction === 'prev') {
        setCurrentCardIndex(i => Math.max(0, i - 1));
    } else {
        setCurrentCardIndex(i => Math.min((result?.flashcardContent?.length || 1) - 1, i + 1));
    }
  }

  const currentCard = result?.flashcardContent?.[currentCardIndex];
  const totalCards = result?.flashcardContent?.length || 0;

  const renderFlashcardTaker = () => {
    if (!result || !result.flashcardContent || !currentCard) return null;
    
    return (
      <>
        <Card className="flex-1 flex flex-col h-full">
            <CardHeader>
                <CardTitle>{result.title}</CardTitle>
                <CardDescription>Your AI-generated flashcards are ready. Click a card to flip it.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-full text-center font-semibold text-lg">{currentCardIndex + 1} / {totalCards}</div>
                <div className="w-full max-w-xl h-72 perspective-1000">
                    <div 
                        className={cn(
                            "relative w-full h-full transition-transform duration-700 transform-style-3d",
                            isFlipped && "rotate-y-180"
                        )}
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <div className="absolute w-full h-full backface-hidden rounded-xl p-6 flex items-center justify-center text-center bg-primary text-primary-foreground shadow-lg cursor-pointer">
                            <p className="text-2xl font-bold">{currentCard.front}</p>
                        </div>
                        <div className="absolute w-full h-full backface-hidden rounded-xl p-6 flex items-center justify-center text-center bg-card border shadow-lg cursor-pointer rotate-y-180">
                            <p className="text-lg">{currentCard.back}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                    <Button variant="outline" onClick={() => navigateCard('prev')} disabled={currentCardIndex === 0}>
                        <ChevronLeft /> Previous
                    </Button>
                    <Button onClick={() => setIsFlipped(!isFlipped)}>
                        <RefreshCw /> Flip Card
                    </Button>
                    <Button variant="outline" onClick={() => navigateCard('next')} disabled={currentCardIndex === totalCards - 1}>
                        Next <ChevronRight />
                    </Button>
                </div>
            </CardContent>
            <CardFooter className="flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={handleReset}>Generate New Flashcards</Button>
                <Button onClick={() => setIsSaveOpen(true)}><Save/> Save to Deck</Button>
                <Button variant="outline" onClick={handleCopy}><Copy/> Copy Text</Button>
                <Button variant="outline" onClick={handleDownload}><Download/> Download .txt</Button>
            </CardFooter>
        </Card>
        <SaveToDeckDialog
            isOpen={isSaveOpen}
            onOpenChange={setIsSaveOpen}
            cards={result.flashcardContent}
            deckNameSuggestion={result.title}
            onSaveComplete={handleReset}
        />
      </>
    );
  };

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <h3 className="text-xl font-semibold font-headline">Generating Your Flashcards...</h3>
                <p className="text-muted-foreground">The AI is preparing your study material. This may take a moment.</p>
            </div>
        );
    }
    if (result) {
        return renderFlashcardTaker();
    }
    return <InputForm onGenerate={handleGenerate} generationType="flashcards" />;
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {renderContent()}
    </div>
  );
}
