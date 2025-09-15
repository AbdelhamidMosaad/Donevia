'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '../ui/label';
import { generatePronunciationPractice, type PronunciationPracticeResponse } from '@/ai/flows/pronunciation-coach-flow';
import { generateAudio } from '@/ai/flows/tts-flow';

const topics = ['th', 'r/l', 'v/w', 'short i / long e', 's/z'];
type TtsEngine = 'gemini' | 'browser';

export function PronunciationCoach() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [topic, setTopic] = useState('th');
  const [result, setResult] = useState<PronunciationPracticeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audioState, setAudioState] = useState<Record<string, { loading: boolean, data: string | null }>>({});

  const [ttsEngine, setTtsEngine] = useState<TtsEngine>('gemini');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      if (window.speechSynthesis) {
        const getVoices = () => {
          const availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
          setVoices(availableVoices);
          if (!selectedVoice && availableVoices.length > 0) {
            const defaultVoice = availableVoices.find(v => v.default);
            setSelectedVoice(defaultVoice ? defaultVoice.name : availableVoices[0].name);
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

    try {
      const data = await generatePronunciationPractice({ level, topic });
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
  
  const playAudio = async (text: string) => {
    if (audioState[text]?.data && audioRef.current) {
        audioRef.current.src = audioState[text]!.data!;
        audioRef.current.play();
        return;
    }

    if (ttsEngine === 'browser' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) {
            utterance.voice = voice;
        }
        window.speechSynthesis.speak(utterance);
    } else { // Gemini TTS
        setAudioState(prev => ({...prev, [text]: { loading: true, data: null }}));
        try {
          const result = await generateAudio(text);
          if (audioRef.current && result.media) {
            audioRef.current.src = result.media;
            audioRef.current.play();
             setAudioState(prev => ({...prev, [text]: { loading: false, data: result.media }}));
          } else {
             throw new Error('Audio generation returned no media.');
          }
        } catch (err) {
          toast({ variant: 'destructive', title: 'Failed to generate audio' });
          setAudioState(prev => ({...prev, [text]: { loading: false, data: null }}));
        }
    }
  }

  const renderResults = () => {
    if (!result) return null;

    return (
      <Card className="flex flex-col h-full mt-6">
        <CardHeader>
          <CardTitle>Practice Session: '{result.focus}'</CardTitle>
          <CardDescription>Listen to the audio and practice repeating the words and phrases.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 space-y-4">
           <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-r-md">
             <h4 className="font-bold">Practice Tip</h4>
             <p>{result.practiceTip}</p>
           </div>
           <ul className="space-y-3">
              {result.practiceItems.map((item, index) => (
                <li key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div>
                        <span className="font-semibold text-lg">{item.text}</span>
                        <span className="text-muted-foreground ml-2 text-sm">({item.ipa})</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => playAudio(item.text)} disabled={audioState[item.text]?.loading}>
                        {audioState[item.text]?.loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4" />}
                    </Button>
                </li>
              ))}
           </ul>
        </CardContent>
        <CardFooter>
            <Button variant="outline" onClick={() => setResult(null)}>Start a New Session</Button>
        </CardFooter>
      </Card>
    );
  };

  const renderInitialState = () => (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>Pronunciation Practice</CardTitle>
        <CardDescription>Select a sound to focus on and your level to begin.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center">
        <div className="max-w-sm mx-auto space-y-4 w-full">
          <div className="space-y-1.5">
            <Label htmlFor="level-select">Your Level</Label>
            <Select value={level} onValueChange={(v: any) => setLevel(v)}>
              <SelectTrigger id="level-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="topic-select">Focus Sound</Label>
            <Select value={topic} onValueChange={(v: any) => setTopic(v)}>
              <SelectTrigger id="topic-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {topics.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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
            {isLoading ? 'Generating...' : 'Generate Practice Words'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full min-h-0">
      {isLoading ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          <span>AI is preparing your practice session...</span>
        </div>
      ) : result ? renderResults() : renderInitialState()}
    </div>
  );
}
