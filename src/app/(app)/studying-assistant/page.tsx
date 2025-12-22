
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuizGenerator } from '@/components/scholar-assist/quiz-generator';
import { FlashcardGenerator } from '@/components/scholar-assist/flashcard-generator';
import { MindMapGenerator } from '@/components/scholar-assist/mind-map-generator';
import { HelpCircle, Layers, Save, GitBranch, MessageSquare, Notebook } from 'lucide-react';
import { StudyingAssistantIcon } from '@/components/icons/tools/studying-assistant-icon';
import { SavedQuizzes } from '@/components/scholar-assist/saved-quizzes';
import type { StudyMaterialResponse } from '@/lib/types';
import type { MindMapResponse } from '@/lib/types/mindmap-generator';
import { ChatWithPdf } from '@/components/scholar-assist/chat-with-pdf';
import { LectureNotesGenerator } from '@/components/scholar-assist/lecture-notes-generator';

export default function StudyingAssistantPage() {
  const [quizResult, setQuizResult] = useState<StudyMaterialResponse | null>(null);
  const [flashcardsResult, setFlashcardsResult] = useState<StudyMaterialResponse | null>(null);
  const [mindMapResult, setMindMapResult] = useState<MindMapResponse | null>(null);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-4">
        <StudyingAssistantIcon className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Studying Assistant</h1>
          <p className="text-muted-foreground">
            Generate study materials from your documents and text.
          </p>
        </div>
      </div>

      <Tabs defaultValue="notes" className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="notes">
            <Notebook className="mr-2 h-4 w-4" />
            Lecture Notes
          </TabsTrigger>
          <TabsTrigger value="quiz">
            <HelpCircle className="mr-2 h-4 w-4" />
            Quiz Generator
          </TabsTrigger>
          <TabsTrigger value="saved-quizzes">
            <Save className="mr-2 h-4 w-4" />
            Saved Quizzes
          </TabsTrigger>
          <TabsTrigger value="flashcards">
            <Layers className="mr-2 h-4 w-4" />
            Flashcards
          </TabsTrigger>
          <TabsTrigger value="mindmap">
            <GitBranch className="mr-2 h-4 w-4" />
            Mind Map
          </TabsTrigger>
          <TabsTrigger value="chat-pdf">
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat with PDF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="flex-1 mt-4">
          <LectureNotesGenerator />
        </TabsContent>
        <TabsContent value="quiz" className="flex-1 mt-4">
          <QuizGenerator result={quizResult} setResult={setQuizResult} />
        </TabsContent>
        <TabsContent value="saved-quizzes" className="flex-1 mt-4">
          <SavedQuizzes />
        </TabsContent>
        <TabsContent value="flashcards" className="flex-1 mt-4">
          <FlashcardGenerator result={flashcardsResult} setResult={setFlashcardsResult} />
        </TabsContent>
        <TabsContent value="mindmap" className="flex-1 mt-4">
          <MindMapGenerator result={mindMapResult} setResult={setMindMapResult} />
        </TabsContent>
        <TabsContent value="chat-pdf" className="flex-1 mt-4">
          <ChatWithPdf />
        </TabsContent>
      </Tabs>
    </div>
  );
}

    