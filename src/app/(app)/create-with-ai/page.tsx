
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Repeat as RephraseIcon, Linkedin } from 'lucide-react';
import { EmailCoach } from '@/components/english-coach/email-coach';
import { RephraseCoach } from '@/components/english-coach/rephrase-coach';
import { LinkedInEnhancer } from '@/components/english-coach/linkedin-enhancer';

import type { RephraseResponse } from '@/lib/types/rephrase';
import type { LinkedInPostResponse } from '@/lib/types/linkedin-post';
import type { EmailCoachResponse } from '@/lib/types/email-coach';
import { CreateWithAiIcon } from '@/components/icons/tools/create-with-ai-icon';

export default function CreateWithAiPage() {
  const [rephraseResult, setRephraseResult] = useState<RephraseResponse | null>(null);
  const [linkedinResult, setLinkedinResult] = useState<LinkedInPostResponse | null>(null);
  const [emailResult, setEmailResult] = useState<EmailCoachResponse | null>(null);

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-4">
        <CreateWithAiIcon className="h-10 w-10 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Create with AI</h1>
          <p className="text-muted-foreground">
            A suite of AI-powered tools to enhance your writing.
          </p>
        </div>
      </div>

      <Tabs defaultValue="rephrase" className="flex-1 flex flex-col min-h-0">
        <TabsList>
          <TabsTrigger value="rephrase">
            <RephraseIcon className="mr-2 h-4 w-4" />
            Rephrase
          </TabsTrigger>
          <TabsTrigger value="linkedin">
            <Linkedin className="mr-2 h-4 w-4" />
            LinkedIn Post
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            Email Coach
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rephrase" className="flex-1 mt-4">
            <RephraseCoach result={rephraseResult} setResult={setRephraseResult} />
        </TabsContent>
        <TabsContent value="linkedin" className="flex-1 mt-4">
            <LinkedInEnhancer result={linkedinResult} setResult={setLinkedinResult} />
        </TabsContent>
        <TabsContent value="email" className="flex-1 mt-4">
            <EmailCoach result={emailResult} setResult={setEmailResult} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
