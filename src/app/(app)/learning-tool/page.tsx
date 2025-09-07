
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LectureNotesGenerator } from '@/components/scholar-assist/lecture-notes-generator';
import { QuizGenerator } from '@/components/scholar-assist/quiz-generator';
import { GraduationCap, FileText, HelpCircle } from 'lucide-react';

export default function LearningToolPage() {
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-4">
        <GraduationCap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Learning Assistant</h1>
          <p className="text-muted-foreground">
            Generate notes, quizzes, and flashcards from your study materials.
          </p>
        </div>
      </div>

      <Tabs defaultValue="notes" className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="notes">
            <FileText className="mr-2 h-4 w-4" />
            Lecture Notes
          </TabsTrigger>
          <TabsTrigger value="quiz">
             <HelpCircle className="mr-2 h-4 w-4" />
            Quiz Generator
          </TabsTrigger>
          <TabsTrigger value="flashcards" disabled>
            Flashcards (soon)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="flex-1 mt-4">
            <LectureNotesGenerator />
        </TabsContent>
        <TabsContent value="quiz" className="flex-1 mt-4">
            <QuizGenerator />
        </TabsContent>
        <TabsContent value="flashcards" className="flex-1 mt-4">
            {/* Placeholder for Flashcards */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
