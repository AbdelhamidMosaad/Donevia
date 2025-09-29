
'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Sparkles, Check, X, MessageSquareQuote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { GrammarCorrectionResponse } from '@/lib/types/grammar';
import { checkGrammarWithAI } from '@/ai/flows/grammar-coach-flow';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog';

interface GrammarCoachProps {
    text?: string;
    onCorrection?: (correctedText: string) => void;
}

export function GrammarCoach({ text, onCorrection }: GrammarCoachProps) {
  const [inputText, setInputText] = useState(text || '');
  const [result, setResult] = useState<GrammarCorrectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  
  const handleOpen = (open: boolean) => {
      if(open && text) {
          setInputText(text);
          handleCheckGrammar(text);
      }
      setIsOpen(open);
  }

  const handleCheckGrammar = async (textToCheck: string) => {
    if (!textToCheck.trim()) {
      toast({ variant: 'destructive', title: 'Please enter some text.' });
      return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const data = await checkGrammarWithAI({ text: textToCheck });
      setResult(data);
    } catch (error) {
      console.error('Grammar check failed:', error);
      toast({
        variant: 'destructive',
        title: 'Grammar Check Failed',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApplyCorrection = () => {
    if(result && onCorrection) {
        onCorrection(result.corrected_text);
    }
    setIsOpen(false);
  }

  const renderResults = () => {
    if (!result) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Your feedback will appear here.</p>
        </div>
      );
    }
    if (result.errors.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-green-600">
          <Check className="h-12 w-12 mb-2" />
          <p className="font-semibold">No errors found!</p>
          <p className="text-sm">Your text looks great.</p>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
          <h3 className="font-bold text-lg">Final Polished Version:</h3>
          <p className="mt-2 text-primary/90">{result.corrected_text}</p>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-2">Error Breakdown:</h3>
          {result.errors.map((error: any, index: number) => (
            <div key={index} className="p-4 border rounded-lg mb-4 bg-muted/50">
              <div className="flex items-center gap-4 text-destructive">
                <X className="h-5 w-5 shrink-0" />
                <p className="line-through">{error.original}</p>
              </div>
              <div className="flex items-center gap-4 text-green-600 mt-2">
                <Check className="h-5 w-5 shrink-0" />
                <p>{error.correction}</p>
              </div>
              <div className="mt-2 pl-9 text-sm text-muted-foreground">
                <p>{error.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  if (onCorrection) {
      return (
        <Dialog open={isOpen} onOpenChange={handleOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-inherit hover:bg-black/10">
                    <MessageSquareQuote className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Grammar & Style Check</DialogTitle>
                    <DialogDescription>Review the AI's suggestions and apply them to your note.</DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        <span>AI is analyzing your text...</span>
                        </div>
                    ) : (
                        renderResults()
                    )}
                </div>
                 {result && (
                    <DialogFooter>
                        <Button onClick={handleApplyCorrection}>Apply & Close</Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
      )
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 h-full">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
          <CardDescription>Enter the text you want to have reviewed.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste your text here..."
            className="flex-1 text-base resize-none"
            rows={15}
          />
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleCheckGrammar(inputText)} disabled={isLoading || !inputText.trim()} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            {isLoading ? 'Analyzing...' : 'Check My Grammar'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>AI Feedback</CardTitle>
          <CardDescription>Review the suggestions and corrections for your text.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span>AI is analyzing your text...</span>
            </div>
          ) : (
            renderResults()
          )}
        </CardContent>
      </Card>
    </div>
  );
}
