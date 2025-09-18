
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { StudyMaterialRequest, Flashcard } from '@/lib/types';
import { addCardsToDeck } from '@/lib/flashcards';
import { generateStudyMaterial } from '@/ai/flows/generate-study-material';


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
      const requestPayload: StudyMaterialRequest = {
        sourceText: text,
        generationType: 'flashcards',
        flashcardsOptions: {
            numCards: 10,
            style: 'basic',
        }
      };

      const result = await generateStudyMaterial(requestPayload);

      const cards = result.flashcardContent;

      if (cards && cards.length > 0) {
        await addCardsToDeck(user.uid, deckId, cards);
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
          {loading ? <Loader2 /> : <Sparkles />}
          {loading ? 'Generating...' : 'Generate Cards'}
        </Button>
      </CardFooter>
    </Card>
  );
}
