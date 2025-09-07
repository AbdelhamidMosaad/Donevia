
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, BrainCircuit, CheckSquare, Sparkles } from 'lucide-react';
import { LectureNotesGenerator } from '@/components/scholar-assist/lecture-notes-generator';
import { QuizGenerator } from '@/components/scholar-assist/quiz-generator';
import { FlashcardGenerator } from '@/components/scholar-assist/flashcard-generator';

export default function LearningToolPage() {
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-4">
        <BrainCircuit className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">AI Learning Tool</h1>
          <p className="text-muted-foreground">Generate quizzes, flashcards, and notes from any text.</p>
        </div>
      </div>
      
      <Tabs defaultValue="quiz" className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quiz"><CheckSquare className="mr-2 h-4 w-4"/>Quiz</TabsTrigger>
          <TabsTrigger value="flashcards"><Sparkles className="mr-2 h-4 w-4"/>Flashcards</TabsTrigger>
          <TabsTrigger value="notes"><FileText className="mr-2 h-4 w-4"/>Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="quiz" className="mt-4">
          <QuizGenerator />
        </TabsContent>
        <TabsContent value="flashcards" className="mt-4">
           <FlashcardGenerator />
        </TabsContent>
        <TabsContent value="notes" className="mt-4">
           <LectureNotesGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
