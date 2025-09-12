'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GrammarCoach } from '@/components/english-coach/grammar-coach';
import { Languages } from 'lucide-react';

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
        </TabsList>

        <TabsContent value="grammar" className="flex-1 mt-4">
           <GrammarCoach />
        </TabsContent>
      </Tabs>
    </div>
  );
}
