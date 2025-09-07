
'use client';

import { GeneratedLearningContent } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LectureNotesView } from './lecture-notes-view';
import { QuizView } from './quiz-view';
import { FlashcardView } from './flashcard-view';

interface GeneratedContentDisplayProps {
  content: GeneratedLearningContent;
}

export function GeneratedContentDisplay({ content }: GeneratedContentDisplayProps) {
  const hasNotes = !!content.lectureNotes;
  const hasQuiz = !!content.quiz && content.quiz.length > 0;
  const hasFlashcards = !!content.flashcards && content.flashcards.length > 0;

  const defaultTab = hasNotes ? 'notes' : hasQuiz ? 'quiz' : 'flashcards';

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        {hasNotes && <TabsTrigger value="notes">Lecture Notes</TabsTrigger>}
        {hasQuiz && <TabsTrigger value="quiz">Quiz</TabsTrigger>}
        {hasFlashcards && <TabsTrigger value="flashcards">Flashcards</TabsTrigger>}
      </TabsList>
      
      {hasNotes && (
        <TabsContent value="notes">
          <LectureNotesView notes={content.lectureNotes!} />
        </TabsContent>
      )}
      {hasQuiz && (
        <TabsContent value="quiz">
          <QuizView questions={content.quiz!} />
        </TabsContent>
      )}
      {hasFlashcards && (
        <TabsContent value="flashcards">
          <FlashcardView flashcards={content.flashcards!} />
        </TabsContent>
      )}
    </Tabs>
  );
}
