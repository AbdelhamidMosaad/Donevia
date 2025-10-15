
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '../ui/label';
import { generatePronunciationPractice, type PronunciationPracticeResponse } from '@/ai/flows/pronunciation-coach-flow';
import { generateAudio } from '@/ai/flows/tts-flow';
import { Slider } from '../ui/slider';

const topics = [
    'th (think, that)',
    'r and l (right, light)',
    'v and w (very, well)',
    'short i vs long e (ship, sheep)',
    'cat vs cut (æ vs ʌ)',
    'pool vs pull (uː vs ʊ)',
    'cat vs bet (æ vs ɛ)',
    'cot vs caught (ɒ vs ɔː)',
    's vs sh (see, she)',
    'z vs s (zoo, sue)',
    'p vs b (pat, bat)',
    'f vs v (fan, van)',
    'ch vs j (cheap, jeep)',
    'The \'ng\' sound (singer, finger)',
    'Diphthongs (my, cow, boy)',
    'Syllable stress in words',
    'Linking sounds in phrases',
    'Silent letters (know, island)',
    'Word endings (-s, -ed)'
];
type TtsEngine = 'gemini' | 'browser';
const geminiVoices = ['Algenib', 'Antares', 'Arcturus', 'Capella', 'Deneb', 'Hadrian', 'Mira', 'Procyon', 'Regulus', 'Sirius', 'Spica', 'Vega'];

interface PronunciationCoachProps {
    result: PronunciationPracticeResponse | null;
    setResult: (result: PronunciationPracticeResponse | null) => void;
}

function HighlightedText({ text }: { text: string }) {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={index} className="text-primary font-bold">{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
        </>
    );
}

export function PronunciationCoach({ result, setResult }: PronunciationCoachProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [topic, setTopic] = useState(topics[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [audioState, setAudioState] = useState<Record<string, { loading: boolean, data: string | null }>>({});

  const [ttsEngine, setTtsEngine] = useState<TtsEngine>('gemini');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string | undefined>();
  const [selectedGeminiVoice, setSelectedGeminiVoice] = useState<string>(geminiVoices[0]);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechPitch, setSpeechPitch] = useState(1);
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
    const cleanText = text.replace(/\*\*/g, '');
    if (audioState[cleanText]?.data && audioRef.current) {
        audioRef.current.src = audioState[cleanText]!.data!;
        audioRef.current.play();
        return;
    }

    if (ttsEngine === 'browser' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) {
            utterance.voice = voice;
        }
        utterance.rate = speechRate;
        utterance.pitch = speechPitch;
        window.speechSynthesis.speak(utterance);
    } else { // Gemini TTS
        setAudioState(prev => ({...prev, [cleanText]: { loading: true, data: null }}));
        try {
          const result = await generateAudio({ text: cleanText, voice: selectedGeminiVoice });
          if (audioRef.current && result.media) {
            audioRef.current.src = result.media;
            audioRef.current.play();
             setAudioState(prev => ({...prev, [cleanText]: { loading: false, data: result.media }}));
          } else {
             throw new Error('Audio generation returned no media.');
          }
        } catch (err) {
          toast({ variant: 'destructive', title: 'Failed to generate audio' });
          setAudioState(prev => ({...prev, [cleanText]: { loading: false, data: null }}));
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
                        <span className="font-semibold text-lg"><HighlightedText text={item.text} /></span>
                        <span className="text-muted-foreground ml-2 text-sm">({item.ipa})</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => playAudio(item.text)} disabled={audioState[item.text.replace(/\*\*/g, '')]?.loading}>
                        {audioState[item.text.replace(/\*\*/g, '')]?.loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4" />}
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
          {ttsEngine === 'browser' && voices.length > 0 ? (
            <>
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
              <div className="space-y-1.5">
                  <Label htmlFor="rate-slider">Rate: {speechRate.toFixed(1)}</Label>
                  <Slider id="rate-slider" min={0.5} max={2} step={0.1} value={[speechRate]} onValueChange={(v) => setSpeechRate(v[0])} />
              </div>
              <div className="space-y-1.5">
                  <Label htmlFor="pitch-slider">Pitch: {speechPitch.toFixed(1)}</Label>
                  <Slider id="pitch-slider" min={0} max={2} step={0.1} value={[speechPitch]} onValueChange={(v) => setSpeechPitch(v[0])} />
              </div>
            </>
          ) : ttsEngine === 'gemini' && (
             <div className="space-y-1.5">
                <Label htmlFor="gemini-voice-select">Gemini Voice</Label>
                <Select value={selectedGeminiVoice} onValueChange={setSelectedGeminiVoice}>
                    <SelectTrigger id="gemini-voice-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                    {geminiVoices.map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
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
