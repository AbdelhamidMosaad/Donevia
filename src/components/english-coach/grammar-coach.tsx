
'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Sparkles, Check, X, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { GrammarCorrectionResponse } from '@/ai/flows/grammar-coach-flow';

export function GrammarCoach() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<GrammarCorrectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleCheckGrammar = async () => {
    if (!inputText.trim()) {
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
      const response = await fetch('/api/english-coach/check-grammar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check grammar.');
      }

      const data: GrammarCorrectionResponse = await response.json();
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
  
  const handleExport = (format: 'pdf' | 'word') => {
      toast({
          title: 'Coming Soon!',
          description: `Export to ${format} will be available in a future update.`
      })
  }

  const handleSave = () => {
       toast({
          title: 'Coming Soon!',
          description: `Saving your sessions will be available in a future update.`
      })
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
            className="flex-1 text-base"
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleCheckGrammar} disabled={isLoading || !inputText.trim()} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isLoading ? 'Analyzing...' : 'Check Grammar'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>AI Feedback</CardTitle>
          <CardDescription>Review the AI's suggestions and corrections for your text.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span>AI is analyzing your text...</span>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {result.analysis.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div>
                    <h4 className="font-semibold">Original:</h4>
                    <p className="text-muted-foreground italic">"{item.original}"</p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Issues:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {item.issues.map((issue, i) => (
                        <li key={i} className="text-sm text-destructive/80 flex items-start gap-2">
                          <X className="h-4 w-4 mt-0.5 shrink-0" /> {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                   <div>
                    <h4 className="font-semibold">Correction:</h4>
                     <p className="text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                       <Check className="h-4 w-4 mt-0.5 shrink-0"/> {item.correction}
                    </p>
                  </div>
                </div>
              ))}
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <h3 className="font-bold text-lg">Final Polished Version:</h3>
                <p className="mt-2 text-primary/90">{result.finalPolishedVersion}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Your grammar feedback will appear here.</p>
            </div>
          )}
        </CardContent>
        {result && (
            <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={handleSave}><FileText className="mr-2 h-4 w-4" /> Save</Button>
                <Button variant="outline" onClick={() => handleExport('word')}><Download className="mr-2 h-4 w-4" /> Export as Word</Button>
                <Button variant="outline" onClick={() => handleExport('pdf')}><Download className="mr-2 h-4 w-4" /> Export as PDF</Button>
            </CardFooter>
        )}
      </Card>
    </div>
  );
}
