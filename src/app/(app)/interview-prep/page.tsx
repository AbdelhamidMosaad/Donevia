
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InterviewPrepIcon } from '@/components/icons/tools/interview-prep-icon';
import { MockInterview } from '@/components/interview-prep/mock-interview';
import { AnswerBuilder } from '@/components/interview-prep/answer-builder';
import { PerformanceHistory } from '@/components/interview-prep/performance-history';
import { ResourceHub } from '@/components/interview-prep/resource-hub';

export default function InterviewPrepPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-6">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <InterviewPrepIcon className="h-10 w-10 text-primary"/>
            <div>
                <h1 className="text-3xl font-bold font-headline">Interview Prep</h1>
                <p className="text-muted-foreground">Practice and improve your job interview skills with an AI coach.</p>
            </div>
        </div>
        <Button>
          <PlusCircle /> New Mock Interview
        </Button>
      </div>

       <Tabs defaultValue="mock-interview" className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="mock-interview">Mock Interview</TabsTrigger>
          <TabsTrigger value="answer-builder">Answer Builder</TabsTrigger>
          <TabsTrigger value="history">Performance History</TabsTrigger>
          <TabsTrigger value="resources">Resource Hub</TabsTrigger>
        </TabsList>
        
        <TabsContent value="mock-interview" className="flex-1 mt-4">
            <MockInterview />
        </TabsContent>
        <TabsContent value="answer-builder" className="flex-1 mt-4">
           <AnswerBuilder />
        </TabsContent>
        <TabsContent value="history" className="flex-1 mt-4">
            <PerformanceHistory />
        </TabsContent>
        <TabsContent value="resources" className="flex-1 mt-4">
           <ResourceHub />
        </TabsContent>
      </Tabs>
    </div>
  );
}
