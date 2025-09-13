'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Play, Pause, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { generateShadowingArticle, type ShadowingResponse } from '@/ai/flows/shadowing-coach-flow';
import { generateAudio } from '@/ai/flows/tts-flow';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '../ui/label';

const topics = ['Technology', 'Health', 'Travel', 'History', 'Art', 'Business', 'Science', 'Everyday Life'];
const PAUSE_DURATION_MS = 3000; // 3 seconds pause for the user to repeat

type SessionState = 'idle' | 'playing' | 'paused' | 'generating';
type TtsEngine = 'gemini' | 'browser';

export function ShadowingCoach() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    const [topic, setTopic] = useState<string>('Technology');
    const [article, setArticle] = useState<ShadowingResponse | null>(null);
    const [sessionState, setSessionState] = useState<SessionState>('idle');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [ttsEngine, setTtsEngine] = useState<TtsEngine>('gemini');
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoice, setSelectedVoice] = useState<string | undefined>();


    const audioRef = useRef<HTMLAudioElement | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const getVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                setVoices(availableVoices);
                if (!selectedVoice && availableVoices.length > 0) {
                    const defaultVoice = availableVoices.find(v => v.lang.startsWith('en') && v.default);
                    setSelectedVoice(defaultVoice ? defaultVoice.name : availableVoices[0].name);
                }
            };
            getVoices();
            window.speechSynthesis.onvoiceschanged = getVoices;
        }
    }, [selectedVoice]);

    const handleGenerate = async () => {
        if (!user) return;
        setSessionState('generating');
        setArticle(null);

        try {
            const result = await generateShadowingArticle({ topic });
            setArticle(result);
            setCurrentIndex(0);
            setSessionState('idle');
        } catch (error) {
            console.error("Failed to generate article:", error);
            toast({ variant: 'destructive', title: 'Failed to generate article' });
            setSessionState('idle');
        }
    };
    
    const playNextPhrase = useCallback(async () => {
        if (!article || currentIndex >= article.phrases.length) {
            setSessionState('idle');
            toast({ title: 'Shadowing session complete!' });
            return;
        }

        setSessionState('playing');
        
        try {
            const phrase = article.phrases[currentIndex];

            if (ttsEngine === 'browser' && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(phrase);
                const voice = voices.find(v => v.name === selectedVoice);
                if (voice) {
                    utterance.voice = voice;
                }
                utterance.onend = () => {
                    timeoutRef.current = setTimeout(() => {
                        setCurrentIndex(prev => prev + 1);
                    }, PAUSE_DURATION_MS);
                };
                window.speechSynthesis.speak(utterance);
            } else { // Gemini TTS
                const audioData = await generateAudio(phrase);
                
                if (audioRef.current) {
                    audioRef.current.src = audioData.media;
                    audioRef.current.play();
                    
                    audioRef.current.onended = () => {
                        timeoutRef.current = setTimeout(() => {
                            setCurrentIndex(prev => prev + 1);
                        }, PAUSE_DURATION_MS);
                    };
                }
            }

        } catch (error) {
            console.error("Failed to play audio:", error);
            toast({ variant: 'destructive', title: 'Could not play audio for the phrase.' });
            timeoutRef.current = setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, PAUSE_DURATION_MS);
        }
    }, [article, currentIndex, toast, ttsEngine, voices, selectedVoice]);


    useEffect(() => {
        if (sessionState === 'playing' && article) {
            playNextPhrase();
        }
        
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.onended = null;
            }
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, [sessionState, currentIndex, article, playNextPhrase]);

    const handlePlayPause = () => {
        if (sessionState === 'playing') {
            setSessionState('paused');
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (ttsEngine === 'browser') {
                window.speechSynthesis.pause();
            } else {
                audioRef.current?.pause();
            }
        } else { // 'paused' or 'idle'
            setSessionState('playing');
             if (ttsEngine === 'browser' && sessionState === 'paused') {
                window.speechSynthesis.resume();
            }
        }
    };

    const handleStop = () => {
        setSessionState('idle');
        setCurrentIndex(0);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (ttsEngine === 'browser') {
            window.speechSynthesis.cancel();
        } else if (audioRef.current) {
             audioRef.current.pause();
             audioRef.current.currentTime = 0;
        }
    };
    
     useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio();
        }
    }, []);

    const renderInitialState = () => (
        <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50 h-full">
            <div className="max-w-xs mx-auto space-y-4">
                 <div className="space-y-1 text-left">
                    <Label htmlFor="topic-select">Select a Topic</Label>
                    <Select value={topic} onValueChange={setTopic}>
                        <SelectTrigger id="topic-select"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {topics.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
                                {voices.filter(v => v.lang.startsWith('en')).map(v => (
                                    <SelectItem key={v.name} value={v.name}>{v.name} ({v.lang})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <Button onClick={handleGenerate} disabled={sessionState === 'generating'} className="w-full">
                    {sessionState === 'generating' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {sessionState === 'generating' ? 'Generating...' : 'Generate Article'}
                </Button>
            </div>
        </div>
    );

    const renderSession = () => {
        if (!article) return null;
        return (
            <div className="space-y-4">
                 <div className="flex items-center justify-center gap-4">
                    <Button onClick={handlePlayPause} size="lg">
                        {sessionState === 'playing' ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
                        {sessionState === 'playing' ? 'Pause' : (sessionState === 'paused' ? 'Resume' : 'Play')}
                    </Button>
                    <Button onClick={handleStop} variant="destructive" size="lg">
                        <StopCircle className="mr-2 h-5 w-5" /> Stop
                    </Button>
                </div>

                <Card className="h-96">
                    <CardHeader>
                        <CardTitle>{article.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-lg leading-relaxed">
                        {article.phrases.map((phrase, index) => (
                            <span key={index} className={index === currentIndex && sessionState === 'playing' ? 'bg-primary/20 p-1 rounded' : 'p-1'}>
                                {phrase}{' '}
                            </span>
                        ))}
                    </CardContent>
                </Card>
               
            </div>
        );
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Shadowing Coach</CardTitle>
                <CardDescription>Listen to a phrase, then repeat it in the pause to practice your pronunciation and fluency.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                 {sessionState === 'generating' ? (
                     <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
                        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                        <h3 className="text-xl font-semibold font-headline">Generating Your Article...</h3>
                        <p className="text-muted-foreground">The AI is preparing your shadowing material.</p>
                    </div>
                ) : article ? renderSession() : renderInitialState()}
            </CardContent>
        </Card>
    );
}
