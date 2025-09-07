
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { InputForm, type InputFormValues } from './shared/input-form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { StudyMaterialRequest, StudyMaterialResponse, QuizQuestion } from '@/ai/flows/learning-tool-flow';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';

export function QuizGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [result, setResult] = useState<StudyMaterialResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

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
          questionTypes: values.questionTypes,
          difficulty: values.difficulty,
        },
      };

      const response = await fetch('/api/learning-tool/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate quiz.');
      }

      const data: StudyMaterialResponse = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Quiz generation failed:", error);
      toast({ variant: 'destructive', title: 'Generation Failed', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: string) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };
  
  const handleSubmit = () => {
    if (!result?.quizContent) return;
    
    let correctCount = 0;
    result.quizContent.forEach((q, index) => {
        if(userAnswers[index]?.toLowerCase() === q.correctAnswer.toLowerCase()){
            correctCount++;
        }
    });
    setScore(correctCount);
    setIsSubmitted(true);
  }

  const handleReset = () => {
    setResult(null);
    setUserAnswers({});
    setIsSubmitted(false);
    setScore(0);
  };

  const getOptionClass = (q: QuizQuestion, option: string, qIndex: number) => {
      if (!isSubmitted) return '';
      const isCorrect = option === q.correctAnswer;
      const isSelected = userAnswers[qIndex] === option;
      
      if(isCorrect) return 'bg-green-100 dark:bg-green-900/50 border-green-500';
      if(isSelected && !isCorrect) return 'bg-red-100 dark:bg-red-900/50 border-red-500';
      return '';
  }


  if (result && result.quizContent) {
    return (
        <Card className="flex-1 flex flex-col">
            <CardHeader>
                <CardTitle>{result.title}</CardTitle>
                {isSubmitted && (
                    <CardDescription className="text-lg font-bold">
                        Your Score: {score}/{result.quizContent.length} ({(score/result.quizContent.length * 100).toFixed(0)}%)
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
                {result.quizContent.map((q, qIndex) => (
                    <div key={qIndex}>
                        <p className="font-semibold">{qIndex + 1}. {q.questionText}</p>
                        <RadioGroup 
                            className="mt-2 space-y-2"
                            onValueChange={(val) => handleAnswerChange(qIndex, val)}
                            disabled={isSubmitted}
                        >
                            {q.options?.map((option, oIndex) => (
                                <div key={oIndex} className={cn("flex items-center space-x-2 border rounded-md p-3 transition-colors", getOptionClass(q, option, qIndex))}>
                                    <RadioGroupItem value={option} id={`q${qIndex}-o${oIndex}`} />
                                    <Label htmlFor={`q${qIndex}-o${oIndex}`}>{option}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                        {isSubmitted && (
                            <div className="mt-2 p-3 rounded-md bg-blue-50 dark:bg-blue-900/30 text-sm">
                                <p><strong className="font-semibold">Explanation:</strong> {q.explanation}</p>
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                 <Button variant="outline" onClick={handleReset}>Generate New Quiz</Button>
                {!isSubmitted ? (
                    <Button onClick={handleSubmit}>Submit Answers</Button>
                ) : (
                    <Button onClick={handleReset}>Take Again</Button>
                )}
            </CardFooter>
        </Card>
    )
  }

  return (
    <InputForm
      onGenerate={handleGenerate}
      isLoading={isLoading}
      showQuizOptions
    />
  );
}
