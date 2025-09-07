
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, HelpCircle, Copy, BrainCircuit } from 'lucide-react';
import type { GeneratedLearningContent } from '@/lib/types';
import { LectureNotesView } from './lecture-notes-view';
import { QuizView } from './quiz-view';
import { FlashcardView } from './flashcard-view';
import { Button } from '../ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface GeneratedContentDisplayProps {
  content: GeneratedLearningContent | null;
  isLoading: boolean;
}

export function GeneratedContentDisplay({ content, isLoading }: GeneratedContentDisplayProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!user || !content) {
        toast({ variant: 'destructive', title: "Nothing to save" });
        return;
    }

    try {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'learningToolEntries'), {
            userId: user.uid,
            sourceTitle: "Generated Content", // Consider enhancing this later
            content: content,
            createdAt: serverTimestamp(),
        });
        toast({ title: 'Success!', description: 'Your learning materials have been saved.' });
    } catch (error) {
        console.error("Error saving content: ", error);
        toast({ variant: 'destructive', title: 'Error saving content', description: (error as Error).message });
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (!content) {
    return (
      <Card className="flex flex-col items-center justify-center h-full text-center">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full">
            <BrainCircuit className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4 font-headline text-2xl">Your Materials Appear Here</CardTitle>
          <CardDescription>Provide some content and let the AI work its magic!</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Your Generated Materials</CardTitle>
                <CardDescription>Review, study, and save your new content.</CardDescription>
            </div>
            <Button onClick={handleSave}>Save to My Library</Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <Tabs defaultValue="notes" className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notes"><BookOpen className="mr-2 h-4 w-4"/>Notes</TabsTrigger>
            <TabsTrigger value="quiz"><HelpCircle className="mr-2 h-4 w-4"/>Quiz</TabsTrigger>
            <TabsTrigger value="flashcards"><Copy className="mr-2 h-4 w-4"/>Flashcards</TabsTrigger>
          </TabsList>
          <TabsContent value="notes" className="flex-1 overflow-y-auto mt-4">
             <LectureNotesView notes={content.lectureNotes} />
          </TabsContent>
          <TabsContent value="quiz" className="flex-1 overflow-y-auto mt-4">
            <QuizView questions={content.quiz} />
          </TabsContent>
          <TabsContent value="flashcards" className="flex-1 overflow-y-auto mt-4">
            <FlashcardView flashcards={content.flashcards} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
