
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import type { UserVocabularyWord } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Volume2, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteUserVocabularyWord } from '@/lib/vocabulary';
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

export function NewWordsLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [vocabulary, setVocabulary] = useState<UserVocabularyWord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [audioState, setAudioState] = useState<Record<string, { loading: boolean, data: string | null }>>({});

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'vocabulary'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVocabulary(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserVocabularyWord)));
    });
    return () => unsubscribe();
  }, [user]);

  const filteredWords = useMemo(() => {
    return vocabulary.filter(word => 
      word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.meaning.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vocabulary, searchQuery]);

  const handleDelete = async (wordId: string) => {
    if (!user) return;
    try {
      await deleteUserVocabularyWord(user.uid, wordId);
      toast({ title: 'Word deleted' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to delete word' });
    }
  };

  const playAudio = async (word: string) => {
    if (audioState[word]?.data) {
        new Audio(audioState[word]!.data!).play();
        return;
    }
    setAudioState(prev => ({...prev, [word]: { loading: true, data: null }}));
    try {
      const audioResult = await generateAudio(word);
      new Audio(audioResult.media).play();
      setAudioState(prev => ({...prev, [word]: { loading: false, data: audioResult.media }}));
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to generate audio' });
      setAudioState(prev => ({...prev, [word]: { loading: false, data: null }}));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Vocabulary</CardTitle>
        <CardDescription>A collection of all the new words you've learned.</CardDescription>
        <Input 
          placeholder="Search words..."
          className="max-w-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Word</TableHead>
              <TableHead>Meaning</TableHead>
              <TableHead>Example</TableHead>
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
                    <TableCell colSpan={4} className="text-center h-24">No words found. Generate some in the Vocabulary Coach!</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
