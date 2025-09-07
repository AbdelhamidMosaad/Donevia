
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Loader2 } from 'lucide-react';
import { ScholarAssistInputForm } from '@/components/scholar-assist/input-form';
import { GeneratedMaterialDisplay } from '@/components/scholar-assist/generated-material';
import { generateStudyGuide } from '@/app/actions';
import { GenerateStudyGuideRequest } from '@/ai/flows/generate-study-material';

export default function LearningToolPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  const handleGenerate = async (data: GenerateStudyGuideRequest) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in' });
      return;
    }

    setIsLoading(true);
    setGeneratedContent(null);

    try {
      const result = await generateStudyGuide(data);
      if (result.error) {
          throw new Error(result.error);
      }
      setGeneratedContent(result.htmlContent || null);
    } catch (error) {
      console.error('Generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center gap-4">
        <GraduationCap className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">AI Learning Tool</h1>
          <p className="text-muted-foreground">
            Generate a comprehensive study guide on any topic.
          </p>
        </div>
      </div>

      <ScholarAssistInputForm onSubmit={handleGenerate} isLoading={isLoading} />

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-semibold font-headline">Generating Your Study Guide...</h3>
            <p className="text-muted-foreground">The AI is working its magic. This may take a moment.</p>
        </div>
      )}

      {generatedContent && <GeneratedMaterialDisplay htmlContent={generatedContent} />}
    </div>
  );
}
