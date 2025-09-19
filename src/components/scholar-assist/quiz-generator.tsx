
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

export function QuizGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [result, setResult] = useState<StudyMaterialResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);

  // State for interactive quiz
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [checkedAnswers, setCheckedAnswers] = useState<Record<number, boolean>>({});
  const [score, setScore] = useState<number | null>(null);


  const handleGenerate = async (values: InputFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    setResult(null);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setCheckedAnswers({});
    setScore(null);


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
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setCheckedAnswers({});
    setScore(null);
  };
  
  const handleCopy = () => {
    if (!result?.quizContent) return;
    let text = `${result.title}\n\n`;
    result.quizContent.forEach((q, i) => {
        text += `Q${i+1}: ${q.questionText}\n`;
        q.options?.forEach((opt, j) => text += `${j+1}. ${opt}\n`);
        text += `\nCorrect Answer: ${q.correctAnswer}\n`;
        text += `Explanation: ${q.explanation}\n\n`;
    });
    navigator.clipboard.writeText(text);
    toast({ title: '✓ Copied to clipboard!' });
  };
  
  const handleDownload = () => {
    if (!result?.quizContent) return;
     let text = `${result.title}\n\n`;
    result.quizContent.forEach((q, i) => {
        text += `Q${i+1}: ${q.questionText}\n`;
        q.options?.forEach((opt, j) => text += `${j+1}. ${opt}\n`);
        text += `\nCorrect Answer: ${q.correctAnswer}\n`;
        text += `Explanation: ${q.explanation}\n\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.title.replace(/ /g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    toast({ title: '✓ Download started' });
  };

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
      if(checkedAnswers[questionIndex]) return; // Don't allow changing answers after checking
      setUserAnswers(prev => ({...prev, [questionIndex]: optionIndex}));
  }

  const checkAllAnswers = () => {
      if (!result?.quizContent) return;
      let correctCount = 0;
      const newCheckedAnswers: Record<number, boolean> = {};
      result.quizContent.forEach((q, index) => {
          const userAnswerIndex = userAnswers[index];
          let correctIndex: number | undefined;

          if (q.questionType === 'true-false') {
              correctIndex = q.correctAnswer === 'True' ? 0 : 1;
          } else {
              correctIndex = q.options?.findIndex(opt => opt === q.correctAnswer);
          }
          
          if (userAnswerIndex !== undefined && userAnswerIndex === correctIndex) {
              correctCount++;
          }
          newCheckedAnswers[index] = true;
      });
      setScore(correctCount);
      setCheckedAnswers(newCheckedAnswers);
  };
  
  const currentQuestion = result?.quizContent?.[currentQuestionIndex];
  const totalQuestions = result?.quizContent?.length || 0;
  const allQuestionsAnswered = Object.keys(userAnswers).length === totalQuestions;


  const renderQuizTaker = () => {
    if (!result || !result.quizContent || !currentQuestion) return null;
    
    const isAnswered = checkedAnswers[currentQuestionIndex];
    
    const options = currentQuestion.questionType === 'true-false'
        ? ['True', 'False']
        : currentQuestion.options || [];

    const correctOptionIndex = options.findIndex(opt => opt === currentQuestion.correctAnswer);

    return (
      <Card className="flex-1 flex flex-col h-full">
        <CardHeader>
            <CardTitle>{result.title}</CardTitle>
            <CardDescription>Question {currentQuestionIndex + 1} of {totalQuestions}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
            <p className="font-semibold text-lg">{currentQuestion.questionText}</p>
            <ul className="space-y-2">
                {options.map((option, index) => {
                    const isSelected = userAnswers[currentQuestionIndex] === index;
                    const isCorrect = correctOptionIndex === index;
                    return (
                        <li 
                            key={index}
                            onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                            className={cn(
                                "p-3 border rounded-md cursor-pointer transition-colors",
                                isAnswered && isCorrect && "bg-green-100 border-green-400 text-green-800",
                                isAnswered && isSelected && !isCorrect && "bg-red-100 border-red-400 text-red-800",
                                isSelected && !isAnswered && "bg-blue-100 border-blue-400",
                                !isSelected && !isAnswered && "hover:bg-muted"
                            )}
                        >
                           {option}
                        </li>
                    )
                })}
            </ul>
             {isAnswered && (
                <div className="p-3 bg-yellow-100/50 border-l-4 border-yellow-400 rounded-r-md">
                    <p className="font-bold">Explanation:</p>
                    <p>{currentQuestion.explanation}</p>
                </div>
            )}
        </CardContent>
         <CardFooter className="flex-col items-stretch gap-4">
           {score !== null && (
                <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-xl font-bold">Quiz Complete!</p>
                    <p className="text-2xl font-headline">Your Score: {score}/{totalQuestions} ({(score/totalQuestions * 100).toFixed(0)}%)</p>
                </div>
            )}
            <div className="flex justify-between items-center">
                 <Button variant="outline" onClick={() => setCurrentQuestionIndex(i => i - 1)} disabled={currentQuestionIndex === 0}>
                    <ChevronLeft/> Previous
                </Button>
                <Button onClick={checkAllAnswers} disabled={score !== null || !allQuestionsAnswered}>Check Answers</Button>
                 <Button variant="outline" onClick={() => setCurrentQuestionIndex(i => i + 1)} disabled={currentQuestionIndex === totalQuestions - 1}>
                    Next <ChevronRight/>
                </Button>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleReset}>Generate New Quiz</Button>
                <Button variant="outline" onClick={handleCopy}><Copy/> Copy Text</Button>
                <Button variant="outline" onClick={handleDownload}><Download/> Download .txt</Button>
            </div>
        </CardFooter>
      </Card>
    );
  }

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
        return renderQuizTaker();
    }
    return <InputForm onGenerate={handleGenerate} generationType="quiz" />;
  }

  return (
    <div className="flex flex-col h-full gap-6">
      {renderContent()}
    </div>
  );
}
