
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Download, Save, Volume2, Play, Pause, StopCircle, Repeat } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { useRouter } from 'next/navigation';
import { generateConversationText, type ConversationTextResponse } from '@/ai/flows/conversation-coach-flow';
import { generateAudio } from '@/ai/flows/tts-flow';
import type { ConversationCoachRequest, ConversationCoachResponse } from '@/lib/types/conversation-coach';
import { Input } from '../ui/input';
import { SaveToDeckDialog } from '../scholar-assist/shared/save-to-deck-dialog';
import { cn } from '@/lib/utils';


const geminiVoices = ['Algenib', 'Achernar', 'Sirius', 'Antares', 'Arcturus', 'Capella', 'Deneb', 'Hadrian', 'Mira', 'Procyon', 'Regulus', 'Vega'];
const topics = ['Technology', 'Health', 'Travel', 'Work', 'Movies', 'Books', 'Food', 'Hobbies', 'Business', 'History', 'Science', 'Art', 'Music', 'Sports', 'Education', 'Fashion', 'Environment', 'Politics', 'Relationships', 'Future Tech'];

type SessionState = 'idle' | 'playing' | 'paused' | 'generating';
type TtsEngine = 'gemini' | 'browser';


export function ConversationCoach() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [topic, setTopic] = useState('Technology');
  const [level, setLevel] = useState<'A1'|'A2'|'B1'|'B2'|'C1'|'C2'>('B1');
  const [numSpeakers, setNumSpeakers] = useState<2|3>(2);
  
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [result, setResult] = useState<ConversationTextResponse | null>(null);
  
  const [audioState, setAudioState] = useState<Record<string, { loading: boolean; data: string | null }>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isSaveToDeckOpen, setIsSaveToDeckOpen] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showAnswers, setShowAnswers] = useState(false);

  const [ttsEngine, setTtsEngine] = useState<TtsEngine>('gemini');
  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedBrowserVoice, setSelectedBrowserVoice] = useState<string | undefined>();
  const [selectedVoices, setSelectedVoices] = useState<string[]>(['Algenib', 'Achernar', 'Sirius']);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
        if (window.speechSynthesis) {
        const getVoices = () => {
          const availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
          setBrowserVoices(availableVoices);
          if (!selectedBrowserVoice && availableVoices.length > 0) {
            const defaultVoice = availableVoices.find(v => v.default);
            setSelectedBrowserVoice(defaultVoice ? defaultVoice.name : availableVoices[0].name);
          }
        };
        getVoices();
        window.speechSynthesis.onvoiceschanged = getVoices;
      }
    }
  }, [selectedBrowserVoice]);

  const handleGenerate = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setSessionState('generating');
    setResult(null);
    setUserAnswers({});
    setShowAnswers(false);
    setCurrentIndex(0);
    setAudioState({});

    try {
      const textData = await generateConversationText({ level, topic, numSpeakers });
      setResult(textData); 
      setSessionState('idle');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: (error as Error).message });
      setSessionState('idle');
    }
  };
  
  const playAudio = useCallback(async (text: string, voice: string, onEnd: () => void) => {
    const audioKey = `${text}-${voice}`;
    if (audioState[audioKey]?.data && audioRef.current) {
      audioRef.current.src = audioState[audioKey]!.data!;
      audioRef.current.play();
      audioRef.current.onended = onEnd;
      return;
    }

    setAudioState(prev => ({ ...prev, [audioKey]: { loading: true, data: null } }));

    if (ttsEngine === 'browser' && 'speechSynthesis' in window) {
        setAudioState(prev => ({...prev, [audioKey]: { loading: false, data: null }})); // No caching for browser
        const utterance = new SpeechSynthesisUtterance(text);
        const browserVoice = browserVoices.find(v => v.name === voice);
        if(browserVoice) utterance.voice = browserVoice;
        utterance.onend = onEnd;
        window.speechSynthesis.speak(utterance);
        return;
    }
    
    try {
      const audioResult = await generateAudio({ text, voice });
      if (audioRef.current && audioResult.media) {
        setAudioState(prev => ({ ...prev, [audioKey]: { loading: false, data: audioResult.media } }));
        audioRef.current.src = audioResult.media;
        audioRef.current.play();
        audioRef.current.onended = onEnd;
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to generate audio' });
      setAudioState(prev => ({ ...prev, [audioKey]: { loading: false, data: null } }));
      onEnd();
    }
  }, [audioState, toast, ttsEngine, browserVoices]);

  const playNextLine = useCallback(() => {
    if (!result || currentIndex >= result.conversation.length) {
      setSessionState('idle');
      toast({ title: 'Conversation finished!' });
      return;
    }

    setSessionState('playing');
    const line = result.conversation[currentIndex];
    let voice: string;
    
    if (ttsEngine === 'gemini') {
        const speakerIndex = Array.from(new Set(result.conversation.map(l => l.speaker))).indexOf(line.speaker);
        voice = selectedVoices[speakerIndex % selectedVoices.length];
    } else {
        voice = selectedBrowserVoice || '';
    }

    playAudio(line.line, voice, () => {
      timeoutRef.current = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, 1000); // 1-second pause
    });
  }, [result, currentIndex, playAudio, selectedVoices, toast, ttsEngine, selectedBrowserVoice]);


  useEffect(() => {
    if (sessionState === 'playing') {
      playNextLine();
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [sessionState, currentIndex, playNextLine]);
  
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
      if (currentIndex >= (result?.conversation.length || 0)) {
          setCurrentIndex(0);
      }
      setSessionState('playing');
      if(sessionState === 'paused') {
        if(ttsEngine === 'browser') window.speechSynthesis.resume();
        else audioRef.current?.play();
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
  
  const handleRepeat = () => {
    if (!result) return;
    const line = result.conversation[currentIndex];
    let voice: string;
    if (ttsEngine === 'gemini') {
        const speakerIndex = Array.from(new Set(result.conversation.map(l => l.speaker))).indexOf(line.speaker);
        voice = selectedVoices[speakerIndex % selectedVoices.length];
    } else {
        voice = selectedBrowserVoice || '';
    }
    playAudio(line.line, voice, () => {});
  };

  const handleLineClick = (index: number) => {
    setCurrentIndex(index);
    setSessionState('playing');
  }

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
  
  const VoiceSelectors = ({ inSession = false }: { inSession?: boolean }) => {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={inSession ? 'tts-engine-session' : 'tts-engine'}>TTS Engine</Label>
          <Select value={ttsEngine} onValueChange={(v: TtsEngine) => setTtsEngine(v)}>
            <SelectTrigger id={inSession ? 'tts-engine-session' : 'tts-engine'}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini">Gemini AI</SelectItem>
              <SelectItem value="browser">Browser-based</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {Array.from({ length: numSpeakers }).map((_, index) => {
          const speakerNames = result ? Array.from(new Set(result.conversation.map(l => l.speaker))) : [];
          const speakerName = speakerNames[index] || `Speaker ${index + 1}`;
          
          if (ttsEngine === 'gemini') {
            return (
              <div key={index} className="space-y-1.5">
                <Label htmlFor={inSession ? `voice-select-session-${index}` : `voice-select-${index}`}>Voice for {speakerName}</Label>
                <Select
                  value={selectedVoices[index]}
                  onValueChange={(value) => {
                    const newVoices = [...selectedVoices];
                    newVoices[index] = value;
                    setSelectedVoices(newVoices);
                  }}
                >
                  <SelectTrigger id={inSession ? `voice-select-session-${index}` : `voice-select-${index}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {geminiVoices.map((v) => ( <SelectItem key={v} value={v}>{v}</SelectItem> ))}
                  </SelectContent>
                </Select>
              </div>
            )
          } else { // browser-based
             return (
                <div key={index} className="space-y-1.5">
                  <Label htmlFor={inSession ? `browser-voice-session-${index}` : `browser-voice-${index}`}>Voice for {speakerName}</Label>
                  <Select 
                      value={selectedVoices[index]} 
                      onValueChange={(value) => {
                        const newVoices = [...selectedVoices];
                        newVoices[index] = value;
                        setSelectedVoices(newVoices);
                      }}
                  >
                    <SelectTrigger id={inSession ? `browser-voice-session-${index}` : `browser-voice-${index}`}><SelectValue/></SelectTrigger>
                    <SelectContent>
                      {browserVoices.map(v => (<SelectItem key={v.name} value={v.name}>{v.name} ({v.lang})</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
             );
          }
        })}
      </div>
    );
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
                  <CardTitle>Conversation Controls</CardTitle>
                  <div className="pt-2">
                    <VoiceSelectors inSession={true} />
                  </div>
                     <div className="flex items-center justify-center gap-2 pt-4">
                        <Button onClick={handlePlayPause}>
                            {sessionState === 'playing' ? <Pause /> : <Play />}
                            {sessionState === 'playing' ? 'Pause' : 'Play'}
                        </Button>
                        <Button onClick={handleRepeat} variant="outline" disabled={sessionState === 'idle'}><Repeat /> Repeat</Button>
                        <Button onClick={handleStop} variant="destructive" disabled={sessionState === 'idle'}><StopCircle /> Stop</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    {result.conversation.map((line, index) => {
                        let voice: string;
                         if (ttsEngine === 'gemini') {
                            const speakerIndex = Array.from(new Set(result.conversation.map(l => l.speaker))).indexOf(line.speaker);
                            voice = selectedVoices[speakerIndex % selectedVoices.length];
                        } else {
                            const speakerIndex = Array.from(new Set(result.conversation.map(l => l.speaker))).indexOf(line.speaker);
                            voice = selectedVoices[speakerIndex % selectedVoices.length] || '';
                        }
                        const audioKey = `${line.line}-${voice}`;
                        const lineAudioState = audioState[audioKey];
                        return (
                            <div key={index} 
                                 className={cn("flex items-center gap-2 p-2 rounded-md cursor-pointer",
                                    currentIndex === index && sessionState === 'playing' ? 'bg-primary/20' : 'hover:bg-muted/50'
                                 )}
                                 onClick={() => handleLineClick(index)}
                            >
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); playAudio(line.line, voice, () => {})}}>
                                    {lineAudioState?.loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4" />}
                                </Button>
                                <p><strong>{line.speaker}:</strong> {line.line}</p>
                            </div>
                        )
                    })}
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
                    <Select value={topic} onValueChange={setTopic}>
                        <SelectTrigger id="topic-input"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {topics.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                    </Select>
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
                <VoiceSelectors />
                <Button onClick={handleGenerate} disabled={sessionState === 'generating'} className="w-full">
                    <Sparkles />
                    {sessionState === 'generating' ? 'Generating...' : 'Generate Conversation'}
                </Button>
            </div>
        </CardContent>
    </Card>
  );

  return (
    <div className="h-full min-h-0">
        {sessionState === 'generating' ? (
             <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <h3 className="text-xl font-semibold font-headline">Generating Conversation...</h3>
                <p className="text-muted-foreground">The AI is crafting your learning session. Please wait.</p>
            </div>
        ) : result ? renderResults() : renderInitialState()
        }
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

