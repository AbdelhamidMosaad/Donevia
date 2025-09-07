
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LectureNotesGenerator } from '@/components/scholar-assist/lecture-notes-generator';
import { QuizGenerator } from '@/components/scholar-assist/quiz-generator';
import { FlashcardGenerator } from '@/components/scholar-assist/flashcard-generator';
import { GraduationCap, FileText, HelpCircle, Copy } from 'lucide-react';

export default function LearningToolPage() {

  return (
    <div className="flex flex-col h-full gap-6">
       <div className="flex items-center gap-4">
        <GraduationCap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">AI Learning Tool</h1>
          <p className="text-muted-foreground">
            Generate notes, quizzes, and flashcards from any document or text.
          </p>
        </div>
      </div>

      <Tabs defaultValue="notes" className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notes"><FileText className="mr-2 h-4 w-4"/> Lecture Notes</TabsTrigger>
          <TabsTrigger value="quiz"><HelpCircle className="mr-2 h-4 w-4"/> Quizzes</TabsTrigger>
          <TabsTrigger value="flashcards"><Copy className="mr-2 h-4 w-4"/> Flashcards</TabsTrigger>
        </TabsList>
        <TabsContent value="notes" className="mt-4">
            <LectureNotesGenerator />
        </TabsContent>
        <TabsContent value="quiz" className="mt-4">
            <QuizGenerator />
        </TabsContent>
        <TabsContent value="flashcards" className="mt-4">
            <FlashcardGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
