
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Flashcard } from '@/ai/flows/learning-tool-flow';
import { addCard } from '@/lib/flashcards';
import { writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { doc, collection } from 'firebase/firestore';


interface AIGeneratorProps {
  deckId: string;
}

export function AIGenerator({ deckId }: AIGeneratorProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({ variant: 'destructive', title: 'Please enter some text to generate cards from.' });
      return;
    }
    if (!user) return;
    
    console.log('Attempting to generate flashcards from text.');
    setLoading(true);

    try {
      const response = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ sourceText: text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate flashcards.');
      }

      const { cards } = await response.json() as { cards: Flashcard[] };

      if (cards && cards.length > 0) {
        const batch = writeBatch(db);
        cards.forEach(cardData => {
            const cardRef = doc(collection(db, 'users', user.uid, 'flashcardDecks', deckId, 'cards'));
            batch.set(cardRef, {
                deckId,
                front: cardData.front,
                back: cardData.back,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        });
        await batch.commit();

        toast({
          title: `✓ ${cards.length} Cards Added!`,
          description: "AI-generated cards have been added to your deck.",
        });
        setText('');
      } else {
        toast({ variant: 'destructive', title: 'No cards were generated. Try refining your text.' });
      }
    } catch (err) {
      console.error("Error generating cards:", err);
      toast({ variant: 'destructive', title: 'Error generating cards', description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> AI Flashcard Generator</CardTitle>
        <CardDescription>
            Paste any text below (e.g., lecture notes, an article) and let AI create flashcards for you automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste text here to generate flashcards..."
          className="w-full min-h-[150px]"
          rows={6}
        />
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerate} disabled={loading || !text.trim()}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4"/>}
          {loading ? 'Generating...' : 'Generate Cards'}
        </Button>
      </CardFooter>
    </Card>
  );
}
