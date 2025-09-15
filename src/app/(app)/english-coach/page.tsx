'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GrammarCoach } from '@/components/english-coach/grammar-coach';
import { BookOpen, Mail, Mic, MessageSquareQuote, BookMarked, Waves } from 'lucide-react';
import { VocabularyCoach } from '@/components/english-coach/vocabulary-coach';
import { EmailCoach } from '@/components/english-coach/email-coach';
import { ShadowingCoach } from '@/components/english-coach/shadowing-coach';
import { NewWordsLibrary } from '@/components/english-coach/new-words-library';
import { EnglishCoachIcon } from '@/components/icons/tools/english-coach-icon';
import { ReadingCoach } from '@/components/english-coach/reading-coach';
import { PronunciationCoach } from '@/components/english-coach/pronunciation-coach';

export default function EnglishCoachPage() {
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
           <TabsTrigger value="new-words">
            <BookOpen className="mr-2 h-4 w-4" />
            New Words
          </TabsTrigger>
           <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email Coach
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
           <GrammarCoach />
        </TabsContent>
        <TabsContent value="vocabulary" className="flex-1 mt-4">
            <VocabularyCoach />
        </TabsContent>
         <TabsContent value="new-words" className="flex-1 mt-4">
            <NewWordsLibrary />
        </TabsContent>
        <TabsContent value="email" className="flex-1 mt-4">
            <EmailCoach />
        </TabsContent>
        <TabsContent value="shadowing" className="flex-1 mt-4">
            <ShadowingCoach />
        </TabsContent>
        <TabsContent value="pronunciation" className="flex-1 mt-4">
            <PronunciationCoach />
        </TabsContent>
         <TabsContent value="reading" className="flex-1 mt-4">
            <ReadingCoach />
        </TabsContent>
      </Tabs>
    </div>
  );
}
