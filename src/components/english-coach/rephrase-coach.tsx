
'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { RephraseResponse } from '@/ai/flows/rephrase-flow';
import { rephraseText } from '@/ai/flows/rephrase-flow';
import { ScrollArea } from '../ui/scroll-area';

export function RephraseCoach() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<RephraseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleRephrase = async () => {
    if (!inputText.trim()) {
      toast({ variant: 'destructive', title: 'Please enter some text to rephrase.' });
      return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const data = await rephraseText({ text: inputText });
      setResult(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Rephrasing Failed',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderResults = () => {
    if (!result) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Rephrased versions will appear here.</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {result.rephrasedVersions.map((item, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>Version {index + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold text-primary">{item.version}</p>
              <p className="text-sm text-muted-foreground mt-2">
                <span className="font-bold">Why it's better:</span> {item.explanation}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 h-full min-h-0">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Rephrase Tool</CardTitle>
          <CardDescription>Enter a sentence or short text to get improved versions.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="e.g., I go shop yesterday and buy some fruits."
            className="flex-1 text-base resize-none"
            rows={10}
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleRephrase} disabled={isLoading || !inputText.trim()} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            {isLoading ? 'Rephrasing...' : 'Rephrase Text'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col min-h-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wand2 /> AI Suggestions</CardTitle>
          <CardDescription>Improved versions of your text and why they're better.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <ScrollArea className="h-full pr-4 -mr-4">
            {isLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span>AI is working its magic...</span>
                </div>
            ) : (
                renderResults()
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
