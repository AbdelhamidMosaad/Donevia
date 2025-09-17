
'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Sparkles, Wand2, Copy, Linkedin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { LinkedInPostResponse } from '@/lib/types/linkedin-post';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { enhanceLinkedInPost } from '@/ai/flows/linkedin-post-flow';

export function LinkedInEnhancer() {
  const [draftText, setDraftText] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<LinkedInPostResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleEnhancePost = async () => {
    if (!draftText.trim()) {
      toast({ variant: 'destructive', title: 'Please enter a draft for your post.' });
      return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const data = await enhanceLinkedInPost({ draftText, notes });
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
    if (!result?.enhancedPost) return;
    navigator.clipboard.writeText(result.enhancedPost);
    toast({ title: '✓ Copied to clipboard!' });
  }

  const renderResults = () => {
    if (!result) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>Your enhanced post will appear here.</p>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Wand2 /> Enhanced Post</CardTitle>
            <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy to clipboard">
                  <Copy className="h-4 w-4" />
                </Button>
                 <Button asChild variant="outline" size="sm">
                    <a href={`https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(result.enhancedPost)}`} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="mr-2 h-4 w-4"/>
                        Post on LinkedIn
                    </a>
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-foreground/90 bg-muted/50 p-4 rounded-md">{result.enhancedPost}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Why it's better</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{result.explanation}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 h-full min-h-0">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>LinkedIn Post Draft</CardTitle>
          <CardDescription>Write your post draft and add any specific instructions for the AI.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4">
          <div className="flex-1 flex flex-col space-y-1.5">
             <Label htmlFor="draft-text">Your Draft</Label>
             <Textarea
                id="draft-text"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="e.g., Finished my new project today. It was about making a to-do list app. Learned a lot."
                className="flex-1 text-base resize-none"
                rows={10}
            />
          </div>
           <div className="space-y-1.5">
                <Label htmlFor="notes">Optional Notes</Label>
                <Input 
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Make the tone more celebratory, mention React."
                />
            </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleEnhancePost} disabled={isLoading || !draftText.trim()} className="w-full">
            <Sparkles className="mr-2 h-4 w-4" />
            {isLoading ? 'Enhancing...' : 'Enhance My Post'}
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex flex-col min-h-0">
        <CardHeader>
          <CardTitle>AI-Enhanced Version</CardTitle>
          <CardDescription>Review the AI's professional rewrite of your post.</CardDescription>
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
