
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { StudyMaterialResponse } from '@/lib/types';
import { QuizTaker } from './quiz-taker';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { HelpCircle } from 'lucide-react';
import { deleteSavedQuiz } from '@/lib/quizzes';
import { useToast } from '@/hooks/use-toast';

type SavedQuiz = StudyMaterialResponse & { id: string };

export function SavedQuizzes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<SavedQuiz | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'savedQuizzes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quizzes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedQuiz));
      setSavedQuizzes(quizzes);
    });
    return () => unsubscribe();
  }, [user]);
  
  const handleDeleteQuiz = async (quizId: string) => {
    if (!user) return;
    try {
        await deleteSavedQuiz(user.uid, quizId);
        toast({ title: "Quiz deleted."});
        if(selectedQuiz?.id === quizId) {
            setSelectedQuiz(null);
        }
    } catch(e) {
        toast({ variant: 'destructive', title: "Error deleting quiz."});
    }
  }

  if (selectedQuiz) {
    return <QuizTaker result={selectedQuiz} onReset={() => setSelectedQuiz(null)} onDelete={() => handleDeleteQuiz(selectedQuiz.id)} isSavedQuiz={true} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved Quizzes</CardTitle>
        <CardDescription>Review and retake quizzes you have saved.</CardDescription>
      </CardHeader>
      <CardContent>
        {savedQuizzes.length > 0 ? (
          <div className="space-y-4">
            {savedQuizzes.map(quiz => (
              <div key={quiz.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">{quiz.title}</h3>
                  <p className="text-sm text-muted-foreground">{quiz.quizContent?.length} questions</p>
                </div>
                <Button onClick={() => setSelectedQuiz(quiz)}>Retake Quiz</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
            <HelpCircle className="h-10 w-10 mb-2" />
            <p>You haven't saved any quizzes yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
