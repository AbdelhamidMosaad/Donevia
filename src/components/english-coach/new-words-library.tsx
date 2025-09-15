
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { UserVocabularyWord } from '@/lib/types';
import type { MasteryLevel, VocabularyLevel } from '@/lib/types/vocabulary';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Volume2, Trash2, Loader2, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteUserVocabularyWord, updateUserVocabularyWordLevel } from '@/lib/vocabulary';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { generateAudio } from '@/ai/flows/tts-flow';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import * as XLSX from 'xlsx';

type TtsEngine = 'gemini' | 'browser';

export function NewWordsLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vocabulary, setVocabulary] = useState<UserVocabularyWord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [audioState, setAudioState] = useState<Record<string, { loading: boolean, data: string | null }>>({});
  const [levelFilter, setLevelFilter] = useState<'all' | VocabularyLevel>('all');

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

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'vocabulary'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVocabulary(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserVocabularyWord)));
    });
    return () => unsubscribe();
  }, [user]);

  const filteredWords = useMemo(() => {
    return vocabulary.filter(word => {
        const searchMatch = word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            word.meaning.toLowerCase().includes(searchQuery.toLowerCase());
        const levelMatch = levelFilter === 'all' || word.sourceLevel === levelFilter;
        return searchMatch && levelMatch;
    });
  }, [vocabulary, searchQuery, levelFilter]);

  const handleDelete = async (wordId: string) => {
    if (!user) return;
    try {
      await deleteUserVocabularyWord(user.uid, wordId);
      toast({ title: 'Word deleted' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete word' });
    }
  };

  const handleMasteryLevelChange = async (wordId: string, level: MasteryLevel) => {
    if (!user) return;
    try {
      await updateUserVocabularyWordLevel(user.uid, wordId, level);
      toast({ title: 'Mastery level updated!' });
    } catch (error) {
       toast({ variant: 'destructive', title: 'Failed to update level.' });
    }
  }

  const playAudio = async (word: string) => {
    if (audioState[word]?.data && audioRef.current) {
        audioRef.current.src = audioState[word]!.data!;
        audioRef.current.play();
        return;
    }

    if (ttsEngine === 'browser' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        const voice = voices.find(v => v.name === selectedVoice);
        if (voice) {
            utterance.voice = voice;
        }
        window.speechSynthesis.speak(utterance);
    } else { // Gemini TTS
        setAudioState(prev => ({...prev, [word]: { loading: true, data: null }}));
        try {
          const result = await generateAudio(word);
          if (audioRef.current && result.media) {
            audioRef.current.src = result.media;
            audioRef.current.play();
             setAudioState(prev => ({...prev, [word]: { loading: false, data: result.media }}));
          } else {
             throw new Error('Audio generation returned no media.');
          }
        } catch (err) {
          toast({ variant: 'destructive', title: 'Failed to generate audio' });
          setAudioState(prev => ({...prev, [word]: { loading: false, data: null }}));
        }
    }
  }

  const handleExport = () => {
    const dataToExport = filteredWords.map(word => ({
        Word: word.word,
        Pronunciation: word.pronunciation,
        Meaning: word.meaning,
        Example: word.example,
        'Mastery Level': word.masteryLevel,
        'Source Level': word.sourceLevel,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vocabulary");
    XLSX.writeFile(workbook, "my_vocabulary.xlsx");
    toast({ title: "Exporting to Excel..." });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Vocabulary</CardTitle>
        <CardDescription>A collection of all the new words you've learned.</CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Input 
                placeholder="Search words..."
                className="max-w-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
             <div className="flex items-center gap-2">
                <Label htmlFor="level-filter" className="text-sm font-medium">Level</Label>
                 <Select value={levelFilter} onValueChange={(v: any) => setLevelFilter(v)}>
                    <SelectTrigger id="level-filter" className="w-[180px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="A1">A1</SelectItem>
                        <SelectItem value="A2">A2</SelectItem>
                        <SelectItem value="B1">B1</SelectItem>
                        <SelectItem value="B2">B2</SelectItem>
                        <SelectItem value="C1">C1</SelectItem>
                        <SelectItem value="C2">C2</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Label htmlFor="tts-engine-select" className="text-sm font-medium">TTS Engine</Label>
                    <Select value={ttsEngine} onValueChange={(v: TtsEngine) => setTtsEngine(v)}>
                        <SelectTrigger id="tts-engine-select" className="w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="gemini">Gemini AI</SelectItem>
                        <SelectItem value="browser">Browser</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 {ttsEngine === 'browser' && voices.length > 0 && (
                    <div className="flex items-center gap-2">
                        <Label htmlFor="voice-select" className="text-sm font-medium">Voice</Label>
                        <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                            <SelectTrigger id="voice-select" className="w-[180px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {voices.map(v => (
                                    <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
             <Button variant="outline" onClick={handleExport}><FileDown /> Export Excel</Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Word</TableHead>
              <TableHead>Meaning</TableHead>
              <TableHead>Example</TableHead>
              <TableHead>Source Level</TableHead>
              <TableHead>Mastery</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWords.length > 0 ? (
                filteredWords.map((word) => (
                    <TableRow key={word.id}>
                        <TableCell className="font-semibold">{word.word} <em className="text-muted-foreground">{word.pronunciation}</em></TableCell>
                        <TableCell>{word.meaning}</TableCell>
                        <TableCell>"{word.example}"</TableCell>
                        <TableCell>{word.sourceLevel}</TableCell>
                        <TableCell>
                          <Select 
                            value={word.masteryLevel} 
                            onValueChange={(level: MasteryLevel) => handleMasteryLevelChange(word.id, level)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Novice">Novice</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Mastered">Mastered</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                           <Button variant="ghost" size="icon" onClick={() => playAudio(word.word)} disabled={audioState[word.word]?.loading}>
                             {audioState[word.word]?.loading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Volume2 className="h-4 w-4" />}
                           </Button>
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>This will permanently delete the word "{word.word}" from your vocabulary.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(word.id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                           </AlertDialog>
                        </TableCell>
                    </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">No words found. Generate some in the Vocabulary Coach!</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
