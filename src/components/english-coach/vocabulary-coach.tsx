
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Download, Save, Volume2, Play, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { VocabularyCoachResponse, VocabularyLevel, HighlightedWord } from '@/lib/types/vocabulary';
import { generateVocabularyStory } from '@/ai/flows/vocabulary-coach-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SaveToDeckDialog } from '../scholar-assist/shared/save-to-deck-dialog';
import { generateAudio } from '@/ai/flows/tts-flow';
import { addUserVocabularyWords } from '@/lib/vocabulary';

function highlightStory(story: string): React.ReactNode {
    const parts = story.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="bg-yellow-200 dark:bg-yellow-400 dark:text-black p-1 rounded">{part.slice(2, -2)}</strong>;
        }
        return part;
    });
}

type TtsEngine = 'gemini' | 'browser';

export function VocabularyCoach() {
  const [level, setLevel] = useState<VocabularyLevel>('B1');
  const [result, setResult] = useState<VocabularyCoachResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveToDeckOpen, setIsSaveToDeckOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [audioState, setAudioState] = useState<Record<string, {loading: boolean, data: string | null}>>({});
  const [isStoryPlaying, setIsStoryPlaying] = useState(false);
  const [ttsEngine, setTtsEngine] = useState<TtsEngine>('gemini');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
   useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      if (window.speechSynthesis) {
        const getVoices = () => {
          const availableVoices = window.speechSynthesis.getVoices();
          const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
          setVoices(englishVoices);
          if (!selectedVoice && englishVoices.length > 0) {
            const defaultVoice = englishVoices.find(v => v.default);
            setSelectedVoice(defaultVoice ? defaultVoice.name : englishVoices[0].name);
          }
        };
        getVoices();
        window.speechSynthesis.onvoiceschanged = getVoices;
      }
    }
  }, [selectedVoice]);


  const handleGenerate = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setAudioState({});

    try {
      const data = await generateVocabularyStory({ level });
      setResult(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
    const playAudio = async (text: string, isStory = false) => {
    if (isStory) {
      setIsStoryPlaying(true);
    }
    
    if (audioState[text]?.data && audioRef.current) {
      audioRef.current.src = audioState[text]!.data!;
      audioRef.current.play();
      if (isStory) {
        audioRef.current.onended = () => setIsStoryPlaying(false);
      }
      return;
    }

    if (ttsEngine === 'browser' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = voices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
      }
      if (isStory) {
        utterance.onend = () => setIsStoryPlaying(false);
      }
      window.speechSynthesis.speak(utterance);
    } else { // Gemini TTS
      setAudioState(prev => ({ ...prev, [text]: { loading: true, data: null } }));
      try {
        const audioResult = await generateAudio(text);
        setAudioState(prev => ({ ...prev, [text]: { loading: false, data: audioResult.media } }));
        if (audioRef.current) {
          audioRef.current.src = audioResult.media;
          audioRef.current.play();
           if (isStory) {
            audioRef.current.onended = () => setIsStoryPlaying(false);
          }
        }
      } catch (err) {
        console.error(`Failed to generate audio for ${text}`, err);
        toast({ variant: 'destructive', title: 'Audio Generation Failed' });
        setAudioState(prev => ({ ...prev, [text]: { loading: false, data: null } }));
         if (isStory) {
          setIsStoryPlaying(false);
        }
      }
    }
  };

  const stopStoryAudio = () => {
    setIsStoryPlaying(false);
    if (ttsEngine === 'browser') {
        window.speechSynthesis.cancel();
    } else if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
  };
  
  const handleExportWord = () => {
    if (!result) return;
    let content = `Story (Level: ${level})\n\n${result.story.replace(/\*\*/g, '')}\n\nVocabulary\n\n`;
    result.vocabulary.forEach(item => {
        content += `- ${item.word} (${item.pronunciation}): ${item.meaning}\n  Example: ${item.example}\n\n`;
    });
    
    const blob = new Blob([content], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `vocabulary_story_${level}.doc`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast({ title: 'Exported as Word document.' });
  }

  const handleSaveToDocs = async () => {
      if (!user || !result) return;
      setIsSaving(true);
      
      const docContent = {
          type: 'doc',
          content: [
              { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: `Vocabulary Story (Level: ${level})` }] },
              { type: 'paragraph', content: [{ type: 'text', text: result.story.replace(/\*\*/g, '') }] },
              { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Vocabulary' }] },
              ...result.vocabulary.flatMap(item => [
                  { type: 'paragraph', content: [{ type: 'text', text: `${item.word} ${item.pronunciation}`, marks: [{type: 'bold'}] }] },
                  { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: `${item.meaning}\nExample: ${item.example}` }] }] }
              ])
          ]
      };

      try {
          const docRef = await addDoc(collection(db, 'users', user.uid, 'docs'), {
              title: `Vocabulary Story: ${level}`,
              content: docContent,
              ownerId: user.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              folderId: null,
          });
          toast({ title: '✓ Saved to Docs' });
          router.push(`/docs/${docRef.id}`);
      } catch (error) {
          console.error("Error saving to docs: ", error);
          toast({ variant: 'destructive', title: 'Failed to save document.' });
      } finally {
          setIsSaving(false);
      }
  }

  const handleSaveToLibrary = async () => {
    if (!user || !result?.vocabulary) return;
    setIsSaving(true);
    try {
      await addUserVocabularyWords(user.uid, result.vocabulary, level);
      toast({ title: 'New words saved to your library!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save words.', description: (error as Error).message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
    <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Vocabulary Coach</CardTitle>
          <CardDescription>Generate a story to learn new words in context.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-6">
          {!result ? (
             <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50 h-full">
                <div className="max-w-xs mx-auto space-y-4">
                    <div className="space-y-1 text-left">
                        <Label htmlFor="level-select">Select Your Level (CEFR)</Label>
                        <Select value={level} onValueChange={(v: VocabularyLevel) => setLevel(v)}>
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
                    <div className="space-y-1 text-left">
                        <Label htmlFor="tts-engine-select">Text-to-Speech Engine</Label>
                        <Select value={ttsEngine} onValueChange={(v: TtsEngine) => setTtsEngine(v)}>
                            <SelectTrigger id="tts-engine-select"><SelectValue /></SelectTrigger>
                            <SelectContent>
                            <SelectItem value="gemini">Gemini AI</SelectItem>
                            <SelectItem value="browser">Browser-based</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {ttsEngine === 'browser' && voices.length > 0 && (
                        <div className="space-y-1 text-left">
                            <Label htmlFor="voice-select">Voice</Label>
                            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                                <SelectTrigger id="voice-select"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {voices.map(v => (
                                        <SelectItem key={v.name} value={v.name}>{v.name} ({v.lang})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                        <Sparkles />
                        {isLoading ? 'Generating...' : 'Generate Story'}
                    </Button>
                </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6 h-full min-h-0">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Your Story (Level: ${level})</h3>
                         {isStoryPlaying ? (
                            <Button variant="destructive" size="sm" onClick={stopStoryAudio}>
                                <StopCircle /> Stop
                            </Button>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => playAudio(result.story.replace(/\*\*/g, ''), true)} disabled={audioState[result.story]?.loading}>
                                <Play />
                                Listen to Story
                            </Button>
                        )}
                    </div>
                    <ScrollArea className="border rounded-lg p-4 bg-background h-full">
                       <p className="whitespace-pre-wrap leading-relaxed">{highlightStory(result.story)}</p>
                    </ScrollArea>
                </div>
                <div className="flex flex-col gap-4">
                     <h3 className="text-lg font-semibold">Your 5 Words to Memorize</h3>
                     <ScrollArea className="border rounded-lg p-4 bg-background h-full">
                        <div className="space-y-4">
                            {result.vocabulary.map((item) => (
                                <div key={item.word}>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-primary">{item.word}</p>
                                        <p className="text-sm text-muted-foreground">{item.pronunciation}</p>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7" 
                                            onClick={() => playAudio(item.word)}
                                            disabled={audioState[item.word]?.loading}
                                        >
                                            {audioState[item.word]?.loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                    <blockquote className="border-l-2 pl-4 italic mt-1">
                                       <p>{item.meaning}</p>
                                       <p className="mt-1 text-sm text-muted-foreground">e.g., "{item.example}"</p>
                                    </blockquote>
                                </div>
                            ))}
                        </div>
                     </ScrollArea>
                </div>
            </div>
          )}
        </CardContent>
        {result && (
             <CardFooter className="justify-end gap-2">
                <Button variant="outline" onClick={() => setResult(null)}>Generate Another</Button>
                <Button onClick={handleSaveToLibrary} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save/>}
                    Save to Library
                </Button>
                <Button variant="outline" onClick={handleExportWord}><Download/> Export as Word</Button>
                <Button variant="outline" onClick={() => setIsSaveToDeckOpen(true)}><Save/> Save to Flashcards</Button>
                <Button onClick={handleSaveToDocs} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save/>}
                    Save to Docs
                </Button>
            </CardFooter>
        )}
    </Card>
    {result && (
        <SaveToDeckDialog
            isOpen={isSaveToDeckOpen}
            onOpenChange={setIsSaveToDeckOpen}
            cards={result.vocabulary.map(v => ({front: `${v.word} ${v.pronunciation}`, back: `${v.meaning}\n\nExample: ${v.example}`}))}
            deckNameSuggestion={`Vocabulary: ${level}`}
            onSaveComplete={() => setIsSaveToDeckOpen(false)}
        />
    )}
    </>
  );
}

  