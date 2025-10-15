
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { StudyMaterialResponse } from '@/lib/types';
import { QuizTaker } from './quiz-taker';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { HelpCircle, Tag } from 'lucide-react';
import { deleteSavedQuiz } from '@/lib/quizzes';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

type SavedQuiz = StudyMaterialResponse & { id: string };

export function SavedQuizzes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<SavedQuiz | null>(null);
  const [tagFilter, setTagFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'savedQuizzes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const quizzes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedQuiz));
      setSavedQuizzes(quizzes);
    });
    return () => unsubscribe();
  }, [user]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    savedQuizzes.forEach(quiz => quiz.tags?.forEach(tag => tags.add(tag)));
    return Array.from(tags);
  }, [savedQuizzes]);

  const filteredQuizzes = useMemo(() => {
    return savedQuizzes.filter(quiz => {
        const tagMatch = tagFilter === 'all' || quiz.tags?.includes(tagFilter);
        const searchMatch = searchFilter === '' || quiz.title.toLowerCase().includes(searchFilter.toLowerCase());
        return tagMatch && searchMatch;
    });
  }, [savedQuizzes, tagFilter, searchFilter]);
  
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
        <div className="flex gap-4 pt-2">
            <Input 
                placeholder="Search by title..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="max-w-sm"
            />
            <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by tag..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {allTags.map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </CardHeader>
      <CardContent>
        {filteredQuizzes.length > 0 ? (
          <div className="space-y-4">
            {filteredQuizzes.map(quiz => (
              <div key={quiz.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">{quiz.title}</h3>
                  <p className="text-sm text-muted-foreground">{quiz.quizContent?.length} questions</p>
                  {quiz.tags && quiz.tags.length > 0 && (
                      <div className="flex gap-2 mt-1">
                          {quiz.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                      </div>
                  )}
                </div>
                <Button onClick={() => setSelectedQuiz(quiz)}>Retake Quiz</Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
            <HelpCircle className="h-10 w-10 mb-2" />
            <p>No saved quizzes found for the current filters.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
