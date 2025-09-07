
'use client';

import { useState } from 'react';
import { QuizQuestion } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizViewProps {
  questions: QuizQuestion[];
}

export function QuizView({ questions }: QuizViewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);

  const handleAnswerChange = (answer: string) => {
    setUserAnswers((prev) => ({ ...prev, [currentQuestionIndex]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  const score = questions.reduce((acc, question, index) => {
    return userAnswers[index]?.toLowerCase() === question.answer.toLowerCase() ? acc + 1 : acc;
  }, 0);

  if (isFinished) {
    return (
      <div>
        <Card className="mb-4">
            <CardHeader>
                <CardTitle>Quiz Complete!</CardTitle>
                <CardDescription>You scored {score} out of {questions.length}.</CardDescription>
            </CardHeader>
        </Card>
        {questions.map((q, i) => (
          <Card key={i} className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">{i + 1}. {q.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Your answer: <span className="font-semibold">{userAnswers[i] || 'No answer'}</span></p>
              <p>Correct answer: <span className="font-semibold">{q.answer}</span></p>
              <div className={cn("mt-2 flex items-center gap-2", userAnswers[i]?.toLowerCase() === q.answer.toLowerCase() ? 'text-green-600' : 'text-red-600')}>
                {userAnswers[i]?.toLowerCase() === q.answer.toLowerCase() ? <CheckCircle /> : <XCircle />}
                <span>{userAnswers[i]?.toLowerCase() === q.answer.toLowerCase() ? 'Correct' : 'Incorrect'}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{q.explanation}</p>
            </CardContent>
          </Card>
        ))}
         <Button onClick={() => { setIsFinished(false); setCurrentQuestionIndex(0); setUserAnswers({}); }}>
            Retake Quiz
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="w-full max-w-2xl mx-auto">
        <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="mb-4"/>
        <Card>
            <CardHeader>
            <CardTitle>Question {currentQuestionIndex + 1}</CardTitle>
            <CardDescription>{currentQuestion.question}</CardDescription>
            </CardHeader>
            <CardContent>
            {currentQuestion.type === 'multiple-choice' && (
                <RadioGroup onValueChange={handleAnswerChange} value={userAnswers[currentQuestionIndex]}>
                    {currentQuestion.options?.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`q${currentQuestionIndex}-o${i}`} />
                        <Label htmlFor={`q${currentQuestionIndex}-o${i}`}>{option}</Label>
                    </div>
                    ))}
                </RadioGroup>
            )}
            {currentQuestion.type === 'true-false' && (
                 <RadioGroup onValueChange={handleAnswerChange} value={userAnswers[currentQuestionIndex]}>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="True" id={`q${currentQuestionIndex}-true`} />
                        <Label htmlFor={`q${currentQuestionIndex}-true`}>True</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <RadioGroupItem value="False" id={`q${currentQuestionIndex}-false`} />
                        <Label htmlFor={`q${currentQuestionIndex}-false`}>False</Label>
                    </div>
                </RadioGroup>
            )}
            {currentQuestion.type === 'short-answer' && (
                <Textarea
                    placeholder="Your answer..."
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    value={userAnswers[currentQuestionIndex] || ''}
                />
            )}
            </CardContent>
            <CardFooter className="flex justify-end">
            <Button onClick={handleNext} disabled={!userAnswers[currentQuestionIndex]}>
                {currentQuestionIndex < questions.length - 1 ? 'Next' : 'Finish'}
            </Button>
            </CardFooter>
        </Card>
    </div>
  );
}
