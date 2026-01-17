'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';
import { enhanceCVSection, type CVSectionEnhancementResponse } from '@/ai/flows/cv-enhancement-flow';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

interface CVSectionProps {
  title: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  context?: { section: string; jobTitle?: string; };
}

export function CVSection({ title, value, onChange, placeholder, context }: CVSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<CVSectionEnhancementResponse | null>(null);
  const { toast } = useToast();

  const handleGetSuggestion = async () => {
    if (!context || !value.trim()) {
      toast({ variant: 'destructive', title: 'Please enter some text to get a suggestion.' });
      return;
    }
    setIsLoading(true);
    setSuggestion(null);
    try {
      const result = await enhanceCVSection({
        section: context.section,
        originalText: value,
        jobTitle: context.jobTitle,
      });
      setSuggestion(result);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to get suggestion.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="font-semibold">{title}</label>
        {context && (
            <Button variant="ghost" size="sm" onClick={handleGetSuggestion} disabled={isLoading || !value.trim()}>
                {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                Suggest
            </Button>
        )}
      </div>
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={5} />
      {suggestion && (
          <Card className="mt-2 bg-primary/5">
              <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> AI Suggestion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                  <p className="whitespace-pre-wrap p-3 bg-background rounded-md">{suggestion.enhancedText}</p>
                   <div>
                        <h4 className="font-semibold text-sm">Tips:</h4>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground">
                            {suggestion.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                        </ul>
                    </div>
                  <Button size="sm" onClick={() => onChange(suggestion.enhancedText)}>Use this version</Button>
              </CardContent>
          </Card>
      )}
    </div>
  );
}
