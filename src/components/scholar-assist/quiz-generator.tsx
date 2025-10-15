
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { InputForm, type InputFormValues } from './shared/input-form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { StudyMaterialRequest, StudyMaterialResponse, QuizQuestion } from '@/lib/types';
import { Button } from '../ui/button';
import { Loader2, Copy, Download, ChevronLeft, ChevronRight, RefreshCw, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SaveToDeckDialog } from './shared/save-to-deck-dialog';
import { generateStudyMaterial } from '@/ai/flows/generate-study-material';
import { Input } from '../ui/input';
import { QuizTaker } from './quiz-taker';

interface QuizGeneratorProps {
  result: StudyMaterialResponse | null;
  setResult: (result: StudyMaterialResponse | null) => void;
}

export function QuizGenerator({ result, setResult }: QuizGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (values: InputFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const requestPayload: StudyMaterialRequest = {
        sourceText: values.sourceText,
        generationType: 'quiz',
        quizOptions: {
          numQuestions: values.numQuestions,
          difficulty: values.difficulty,
          questionTypes: values.questionTypes,
        },
      };

      const data = await generateStudyMaterial(requestPayload);
      setResult(data);

    } catch (error) {
      console.error("Quiz generation failed:", error);
      toast({ variant: 'destructive', title: 'Generation Failed', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    setResult(null);
  };
  
  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <h3 className="text-xl font-semibold font-headline">Generating Your Quiz...</h3>
                <p className="text-muted-foreground">The AI is crafting your questions. This may take a moment.</p>
            </div>
        );
    }
    if (result) {
        return <QuizTaker result={result} onReset={handleReset} />;
    }
    return <InputForm onGenerate={handleGenerate} generationType="quiz" />;
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {renderContent()}
    </div>
  );
}
