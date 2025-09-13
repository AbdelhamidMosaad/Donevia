
'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Sparkles, Check, X, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Label } from '../ui/label';

// Define the structure of a LanguageTool match
interface LanguageToolMatch {
  message: string;
  shortMessage: string;
  replacements: { value: string }[];
  offset: number;
  length: number;
  context: { text: string; offset: number; length: number; };
  rule: { id: string; description: string; issueType: string; category: { id: string; name: string; }; };
}

// Define the structure of a Sapling AI edit
interface SaplingEdit {
    start: number;
    end: number;
    replacement: string;
    general_error_type: string;
}

type Mode = 'languagetool' | 'sapling';

export function GrammarCoach() {
  const [inputText, setInputText] = useState('');
  const [ltMatches, setLtMatches] = useState<LanguageToolMatch[]>([]);
  const [saplingEdits, setSaplingEdits] = useState<SaplingEdit[]>([]);
  const [correctedText, setCorrectedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('languagetool');

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
    setLtMatches([]);
    setSaplingEdits([]);
    setCorrectedText('');

    try {
      const response = await fetch('/api/english-coach/check-grammar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ text: inputText, mode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check grammar.');
      }

      const data = await response.json();
      if(mode === 'languagetool') {
          setLtMatches(data.matches);
      } else {
          setSaplingEdits(data.edits);
          // Reconstruct corrected text from edits for Sapling
          let newText = inputText;
          data.edits.slice().reverse().forEach((edit: SaplingEdit) => {
              newText = newText.slice(0, edit.start) + edit.replacement + newText.slice(edit.end);
          });
          setCorrectedText(newText);
      }
      
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

  const getHighlightedText = (text: string, matches: any[], isSapling: boolean) => {
      let lastIndex = 0;
      const parts: (string | JSX.Element)[] = [];
      matches.forEach((match, i) => {
          const offset = isSapling ? match.start : match.offset;
          const length = isSapling ? match.end - match.start : match.length;
          parts.push(text.substring(lastIndex, offset));
          parts.push(
              <span key={i} className="bg-yellow-200 dark:bg-yellow-800/70 rounded-md px-1">
                  {text.substring(offset, offset + length)}
              </span>
          );
          lastIndex = offset + length;
      });
      parts.push(text.substring(lastIndex));
      return <p className="whitespace-pre-wrap leading-relaxed">{parts}</p>;
  }

  const renderLanguageToolResults = () => (
    <div className="space-y-6">
        <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-bold mb-2">Highlighted Text:</h3>
            {getHighlightedText(inputText, ltMatches, false)}
        </div>
        <div>
            <h3 className="font-bold text-lg mb-2">Suggestions:</h3>
            {ltMatches.map((match, index) => (
                <div key={index} className="p-4 border rounded-lg mb-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground font-semibold">{match.rule.category.name}</p>
                    <p className="font-semibold mb-2">{match.message}</p>
                    <div className="flex items-center gap-4 text-destructive text-sm">
                        <X className="h-4 w-4 shrink-0"/>
                        <p className="line-through">...{match.context.text}...</p>
                    </div>
                    {match.replacements.length > 0 && (
                        <div className="flex items-center gap-4 text-green-600 mt-2 text-sm">
                            <Check className="h-4 w-4 shrink-0"/>
                            <p>Suggestion: <span className="font-semibold">{match.replacements[0].value}</span></p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
  );
  
  const renderSaplingResults = () => (
    <div className="space-y-6">
        <div className="p-4 bg-muted/50 rounded-lg">
             <h3 className="font-bold text-lg mb-2">Corrected Text:</h3>
             <p className="text-lg text-primary">{correctedText}</p>
        </div>
        <div>
            <h3 className="font-bold text-lg mb-2">Corrections:</h3>
            {saplingEdits.map((edit, index) => (
                 <div key={index} className="p-4 border rounded-lg mb-4 bg-muted/50">
                    <div className="flex items-center gap-4 text-destructive text-sm">
                        <X className="h-4 w-4 shrink-0"/>
                        <p className="line-through">{inputText.substring(edit.start, edit.end)}</p>
                    </div>
                    <div className="flex items-center gap-4 text-green-600 mt-2 text-sm">
                        <Check className="h-4 w-4 shrink-0"/>
                        <p>{edit.replacement}</p>
                    </div>
                     {edit.general_error_type && (
                         <div className="mt-2 pl-9 text-sm text-muted-foreground">
                            <p>({edit.general_error_type})</p>
                        </div>
                     )}
                 </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="grid md:grid-cols-2 gap-6 h-full">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Input Text</CardTitle>
           <div className="flex justify-between items-center">
              <CardDescription>Enter the text you want to have reviewed.</CardDescription>
                <div className="flex items-center gap-2">
                    <Label htmlFor="mode-toggle">Mode</Label>
                    <ToggleGroup id="mode-toggle" type="single" value={mode} onValueChange={(value: Mode) => value && setMode(value)} size="sm">
                        <ToggleGroupItem value="languagetool">LanguageTool</ToggleGroupItem>
                        <ToggleGroupItem value="sapling">Sapling</ToggleGroupItem>
                    </ToggleGroup>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste your text here..."
            className="flex-1 text-base"
            rows={15}
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleCheckGrammar} disabled={isLoading || !inputText.trim()} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isLoading ? 'Analyzing...' : `Check with ${mode === 'sapling' ? 'Sapling AI' : 'LanguageTool'}`}
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Analysis & Suggestions</CardTitle>
          <CardDescription>Review the suggestions to improve your text.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              <span>AI is analyzing your text...</span>
            </div>
          ) : (mode === 'languagetool' && ltMatches.length > 0) ? (
            renderLanguageToolResults()
          ) : (mode === 'sapling' && saplingEdits.length > 0) ? (
            renderSaplingResults()
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Your feedback will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
