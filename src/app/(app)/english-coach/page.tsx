
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GrammarCoach } from '@/components/english-coach/grammar-coach';
import { Languages, BookOpen, Mail } from 'lucide-react';
import { VocabularyCoach } from '@/components/english-coach/vocabulary-coach';
import { EmailCoach } from '@/components/english-coach/email-coach';

export default function EnglishCoachPage() {
  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-4">
        <Languages className="h-8 w-8 text-primary" />
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
            Grammar Coach
          </TabsTrigger>
          <TabsTrigger value="vocabulary">
            <BookOpen className="mr-2 h-4 w-4" />
            Vocabulary Coach
          </TabsTrigger>
           <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email Coach
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grammar" className="flex-1 mt-4">
           <GrammarCoach />
        </TabsContent>
        <TabsContent value="vocabulary" className="flex-1 mt-4">
            <VocabularyCoach />
        </TabsContent>
        <TabsContent value="email" className="flex-1 mt-4">
            <EmailCoach />
        </TabsContent>
      </Tabs>
    </div>
  );
}
