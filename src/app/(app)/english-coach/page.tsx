'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

      <Tabs defaultValue="grammar" className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="grammar">
            Grammar Coach
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grammar" className="flex-1 mt-4">
            <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
                <h3 className="text-xl font-semibold font-headline">Grammar Coach</h3>
                <p className="text-muted-foreground">The UI for the grammar coach will be implemented in the next step.</p>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
