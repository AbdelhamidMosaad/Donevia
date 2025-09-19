
'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Download, Save, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { useRouter } from 'next/navigation';
import { generateConversation, generateConversationAudio } from '@/ai/flows/conversation-coach-flow';
import type { ConversationCoachResponse } from '@/lib/types/conversation-coach';
import { Input } from '../ui/input';
import { SaveToDeckDialog } from '../scholar-assist/shared/save-to-deck-dialog';

const topics = ['Technology', 'Health', 'Travel', 'Work', 'Movies', 'Books', 'Food', 'Hobbies'];

export function ConversationCoach() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [topic, setTopic] = useState('Technology');
  const [level, setLevel] = useState<'A1'|'A2'|'B1'|'B2'|'C1'|'C2'>('B1');
  const [numSpeakers, setNumSpeakers] = useState<2|3>(2);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [result, setResult] = useState<ConversationCoachResponse | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isSaveToDeckOpen, setIsSaveToDeckOpen] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showAnswers, setShowAnswers] = useState(false);


  const handleGenerate = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setAudioSrc(null);
    setUserAnswers({});
    setShowAnswers(false);

    try {
      const data = await generateConversation({ level, topic, numSpeakers });
      setResult(data);
      
      // Automatically trigger audio generation
      setIsAudioLoading(true);
      const audioData = await generateConversationAudio({ conversation: data.conversation });
      setAudioSrc(audioData.media);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: (error as Error).message });
    } finally {
      setIsLoading(false);
      setIsAudioLoading(false);
    }
  };

  const handleExportWord = () => {
    if (!result) return;
    let content = `<h1>${result.title}</h1>`;
    content += `<h2>Conversation</h2><p>${result.conversation.map(c => `${c.speaker}: ${c.line}`).join('<br>')}</p>`;
    content += `<h2>Key Phrases</h2>`;
    result.phrases.forEach(p => {
        content += `<p><strong>${p.phrase}:</strong> ${p.explanation}</p>`;
    });
    content += `<h2>Comprehension Questions</h2>`;
    result.questions.forEach((q, i) => {
        content += `<p>${i+1}. ${q.question}<br/>`;
        q.options.forEach(opt => content += `- ${opt}<br/>`);
        content += `<em>Answer: ${q.answer}</em></p>`;
    });

    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + content + footer;
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
    const fileDownload = document.createElement("a");
    document.body.appendChild(fileDownload);
    fileDownload.href = source;
    fileDownload.download = `${result.title.replace(/ /g, '_')}.doc`;
    fileDownload.click();
    document.body.removeChild(fileDownload);
    toast({ title: 'Exported as Word document.' });
  }
  
  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({...prev, [questionIndex]: answer}));
  };

  const renderResults = () => {
    if (!result) return null;

    return (
      <Card className="flex-1 flex flex-col h-full">
        <CardHeader>
          <CardTitle>{result.title}</CardTitle>
          <CardDescription>Your AI-generated conversation is ready.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Conversation</span>
                         {isAudioLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : audioSrc && (
                            <audio controls src={audioSrc} className="h-8" />
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {result.conversation.map((line, index) => (
                        <p key={index}><strong>{line.speaker}:</strong> {line.line}</p>
                    ))}
                </CardContent>
              </Card>
              <Card>
                 <CardHeader><CardTitle>Key Phrases</CardTitle></CardHeader>
                 <CardContent className="space-y-3">
                    {result.phrases.map((p, i) => (
                        <div key={i}>
                            <p className="font-semibold text-primary">{p.phrase}</p>
                            <p className="text-sm">{p.explanation}</p>
                        </div>
                    ))}
                 </CardContent>
              </Card>
               <Card>
                 <CardHeader><CardTitle>Comprehension Check</CardTitle></CardHeader>
                 <CardContent className="space-y-4">
                    {result.questions.map((q, i) => (
                        <div key={i}>
                            <p className="font-semibold">{i+1}. {q.question}</p>
                            <Select onValueChange={(val) => handleAnswerChange(i, val)} disabled={showAnswers}>
                                <SelectTrigger><SelectValue placeholder="Select your answer..."/></SelectTrigger>
                                <SelectContent>
                                    {q.options.map((opt, j) => <SelectItem key={j} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {showAnswers && (
                                <p className={`mt-1 text-sm ${userAnswers[i] === q.answer ? 'text-green-600' : 'text-destructive'}`}>
                                    Correct Answer: {q.answer}
                                </p>
                            )}
                        </div>
                    ))}
                    <Button onClick={() => setShowAnswers(true)} disabled={showAnswers}>Check Answers</Button>
                 </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="justify-end gap-2">
            <Button variant="outline" onClick={() => setResult(null)}>Generate New</Button>
            <Button onClick={() => setIsSaveToDeckOpen(true)}><Save/> Save Phrases to Deck</Button>
            <Button variant="outline" onClick={handleExportWord}><Download/> Export Word</Button>
        </CardFooter>
      </Card>
    );
  };

  const renderInitialState = () => (
     <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle>Conversation Coach</CardTitle>
          <CardDescription>Generate a dialogue to practice your listening and comprehension skills.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
            <div className="max-w-md mx-auto space-y-4 w-full">
                <div className="space-y-1.5">
                    <Label htmlFor="topic-input">Conversation Topic</Label>
                    <Input id="topic-input" placeholder="e.g., Ordering food at a restaurant" value={topic} onChange={(e) => setTopic(e.target.value)}/>
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="level-select">Your Level (CEFR)</Label>
                    <Select value={level} onValueChange={(v: any) => setLevel(v)}>
                        <SelectTrigger id="level-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="A1">A1 (Beginner)</SelectItem>
                            <SelectItem value="A2">A2 (Elementary)</SelectItem>
                            <SelectItem value="B1">B1 (Intermediate)</SelectItem>
                            <SelectItem value="B2">B2 (Upper-Intermediate)</SelectItem>
                            <SelectItem value="C1">C1 (Advanced)</SelectItem>
                            <SelectItem value="C2">C2 (Proficient)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-1.5">
                    <Label htmlFor="speakers-select">Number of Speakers</Label>
                    <Select value={String(numSpeakers)} onValueChange={(v) => setNumSpeakers(Number(v) as 2|3)}>
                        <SelectTrigger id="speakers-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="2">Two</SelectItem>
                           <SelectItem value="3">Three</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading || !topic.trim()} className="w-full">
                    <Sparkles />
                    {isLoading ? 'Generating...' : 'Generate Conversation'}
                </Button>
            </div>
        </CardContent>
    </Card>
  );

  return (
    <div className="h-full min-h-0">
        {result ? renderResults() : renderInitialState()}
        {result && (
            <SaveToDeckDialog
                isOpen={isSaveToDeckOpen}
                onOpenChange={setIsSaveToDeckOpen}
                cards={result.phrases.map(p => ({ front: p.phrase, back: p.explanation }))}
                deckNameSuggestion={`Phrases from "${result.title}"`}
                onSaveComplete={() => setIsSaveToDeckOpen(false)}
            />
        )}
    </div>
  );
}
