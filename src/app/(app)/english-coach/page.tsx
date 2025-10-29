
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GrammarCoach } from '@/components/english-coach/grammar-coach';
import { BookOpen, Mic, MessageSquareQuote, MessageCircle, BookMarked, Waves } from 'lucide-react';
import { VocabularyCoach } from '@/components/english-coach/vocabulary-coach';
import { ShadowingCoach } from '@/components/english-coach/shadowing-coach';
import { NewWordsLibrary } from '@/components/english-coach/new-words-library';
import { EnglishCoachIcon } from '@/components/icons/tools/english-coach-icon';
import { ReadingCoach } from '@/components/english-coach/reading-coach';
import { PronunciationCoach } from '@/components/english-coach/pronunciation-coach';
import { ConversationCoach } from '@/components/english-coach/conversation-coach';

import type { GrammarCorrectionResponse } from '@/lib/types/grammar';
import type { VocabularyCoachResponse } from '@/lib/types/vocabulary';
import type { ConversationTextResponse } from '@/ai/flows/conversation-coach-flow';
import type { ShadowingResponse } from '@/ai/flows/shadowing-coach-flow';
import type { PronunciationPracticeResponse } from '@/ai/flows/pronunciation-coach-flow';
import type { ReadingComprehensionExercise } from '@/lib/types/reading-comprehension';

export default function EnglishCoachPage() {
  // State lifted from child components
  const [grammarResult, setGrammarResult] = useState<GrammarCorrectionResponse | null>(null);
  const [vocabularyResult, setVocabularyResult] = useState<VocabularyCoachResponse | null>(null);
  const [conversationResult, setConversationResult] = useState<ConversationTextResponse | null>(null);
  const [shadowingResult, setShadowingResult] = useState<ShadowingResponse | null>(null);
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationPracticeResponse | null>(null);
  const [readingResult, setReadingResult] = useState<ReadingComprehensionExercise | null>(null);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-4">
        <EnglishCoachIcon className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">English Coach</h1>
          <p className="text-muted-foreground">
            Improve your English skills with personalized AI coaching.
          </p>
        </div>
      </div>

      <Tabs defaultValue="grammar" className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="grammar">
            <MessageSquareQuote className="mr-2 h-4 w-4" />
            Grammar Coach
          </TabsTrigger>
          <TabsTrigger value="vocabulary">
            <BookOpen className="mr-2 h-4 w-4" />
            Vocabulary Coach
          </TabsTrigger>
          <TabsTrigger value="conversation">
            <MessageCircle className="mr-2 h-4 w-4" />
            Conversation
          </TabsTrigger>
           <TabsTrigger value="new-words">
            <BookOpen className="mr-2 h-4 w-4" />
            New Words
          </TabsTrigger>
          <TabsTrigger value="shadowing">
            <Mic className="mr-2 h-4 w-4" />
            Shadowing Coach
          </TabsTrigger>
          <TabsTrigger value="pronunciation">
            <Waves className="mr-2 h-4 w-4" />
            Pronunciation
          </TabsTrigger>
           <TabsTrigger value="reading">
            <BookMarked className="mr-2 h-4 w-4" />
            Reading Coach
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grammar" className="flex-1 mt-4">
           <GrammarCoach result={grammarResult} setResult={setGrammarResult}/>
        </TabsContent>
        <TabsContent value="vocabulary" className="flex-1 mt-4">
            <VocabularyCoach result={vocabularyResult} setResult={setVocabularyResult} />
        </TabsContent>
         <TabsContent value="conversation" className="flex-1 mt-4">
            <ConversationCoach result={conversationResult} setResult={setConversationResult} />
        </TabsContent>
         <TabsContent value="new-words" className="flex-1 mt-4">
            <NewWordsLibrary />
        </TabsContent>
        <TabsContent value="shadowing" className="flex-1 mt-4">
            <ShadowingCoach result={shadowingResult} setResult={setShadowingResult} />
        </TabsContent>
        <TabsContent value="pronunciation" className="flex-1 mt-4">
            <PronunciationCoach result={pronunciationResult} setResult={setPronunciationResult} />
        </TabsContent>
         <TabsContent value="reading" className="flex-1 mt-4">
            <ReadingCoach result={readingResult} setResult={setReadingResult} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
