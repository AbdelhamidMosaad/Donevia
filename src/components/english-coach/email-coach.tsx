
'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Sparkles, Check, X, ArrowRight, Wand2, Lightbulb, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { EmailCoachResponse } from '@/lib/types/email-coach';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { improveEmail } from '@/ai/flows/email-coach-flow';

interface EmailCoachProps {
    result: EmailCoachResponse | null;
    setResult: (result: EmailCoachResponse | null) => void;
}

export function EmailCoach({ result, setResult }: EmailCoachProps) {
  const [emailText, setEmailText] = useState('');
  const [context, setContext] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleImproveEmail = async () => {
    if (!emailText.trim() || !context.trim()) {
      toast({ variant: 'destructive', title: 'Please enter your email and its context.' });
      return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const data = await improveEmail({ emailText, context });
      setResult(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = () => {
      if (!result?.improvedEmail) return;
      navigator.clipboard.writeText(result.improvedEmail);
      toast({ title: '✓ Copied to clipboard!' });
  }

  const renderResults = () => {
    if (!result) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Your feedback will appear here.</p>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Wand2 /> Improved Version</CardTitle>
            <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy to clipboard">
              <Copy className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-foreground/90">{result.improvedEmail}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Corrections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.corrections.map((item, index) => (
              <div key={index} className="p-3 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <X className="h-4 w-4 shrink-0" />
                  <p className="line-through">{item.original}</p>
                </div>
                <div className="flex items-center gap-2 text-green-600 mt-1 text-sm">
                  <Check className="h-4 w-4 shrink-0" />
                  <p>{item.correction}</p>
                </div>
                <div className="mt-2 pl-6 text-xs text-muted-foreground">
                    <p>{item.explanation}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lightbulb /> Writing Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             {result.tips.map((item, index) => (
                <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400">
                    <p className="font-semibold">{item.tip}</p>
                    {item.example && <p className="text-sm text-muted-foreground italic mt-1">e.g., "{item.example}"</p>}
                </div>
             ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 h-full min-h-0">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Email Draft</CardTitle>
          <CardDescription>Write your email and provide its context below.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
            <div className="space-y-1.5">
                <Label htmlFor="context">Context</Label>
                <Input 
                    id="context"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="e.g., A formal request to a client for a deadline extension"
                />
            </div>
          <div className="flex-1 flex flex-col space-y-1.5">
             <Label htmlFor="email-text">Email Content</Label>
             <Textarea
                id="email-text"
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                placeholder="Subject: ...&#10;&#10;Dear...,"
                className="flex-1 text-base resize-none"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleImproveEmail} disabled={isLoading || !emailText.trim() || !context.trim()} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            {isLoading ? 'Analyzing...' : 'Improve My Email'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col min-h-0">
        <CardHeader>
          <CardTitle>AI Feedback</CardTitle>
          <CardDescription>Review the AI's suggestions to improve your email.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          <ScrollArea className="h-full pr-4 -mr-4">
            {isLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span>AI is analyzing your email...</span>
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
