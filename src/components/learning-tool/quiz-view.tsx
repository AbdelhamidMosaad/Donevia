
'use client';

import * as React from 'react';
import { useState } from 'react';
import { QuizQuestion } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle } from 'lucide-react';

interface QuizViewProps {
  questions: QuizQuestion[];
}

export function QuizView({ questions }: QuizViewProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleAnswerChange = (questionIndex: number, value: string) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: value }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const score = Object.entries(answers).reduce((correctCount, [index, answer]) => {
    const question = questions[Number(index)];
    // Case-insensitive comparison for short answers
    if (question.options === undefined) { 
        return question.answer.toLowerCase() === answer.toLowerCase() ? correctCount + 1 : correctCount;
    }
    return question.answer === answer ? correctCount + 1 : correctCount;
  }, 0);

  return (
    <div className="space-y-6">
      {submitted && (
        <Card className="bg-muted">
            <CardHeader>
                <CardTitle>Quiz Results</CardTitle>
                <CardDescription>You scored {score} out of {questions.length}!</CardDescription>
            </CardHeader>
        </Card>
      )}

      {questions.map((q, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-lg flex justify-between items-center">
              <span>Question {index + 1}</span>
              {submitted && (
                 answers[index]?.toLowerCase() === q.answer.toLowerCase() ?
                 <CheckCircle className="text-green-500" /> :
                 <XCircle className="text-destructive" />
              )}
            </CardTitle>
            <CardDescription>{q.question}</CardDescription>
          </CardHeader>
          <CardContent>
            {q.options ? (
              <RadioGroup
                value={answers[index]}
                onValueChange={(value) => handleAnswerChange(index, value)}
                disabled={submitted}
              >
                {q.options.map((option, optIndex) => (
                  <div key={optIndex} className={cn(
                      "flex items-center space-x-2 p-2 rounded-md",
                      submitted && option === q.answer && "bg-green-100 dark:bg-green-900/50",
                      submitted && answers[index] === option && option !== q.answer && "bg-red-100 dark:bg-red-900/50"
                  )}>
                    <RadioGroupItem value={option} id={`q${index}-opt${optIndex}`} />
                    <Label htmlFor={`q${index}-opt${optIndex}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Input
                placeholder="Your answer..."
                value={answers[index] || ''}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                disabled={submitted}
              />
            )}
            {submitted && (
                <div className="mt-4 p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg text-sm">
                    <p><strong>Correct Answer:</strong> {q.answer}</p>
                    <p><strong>Explanation:</strong> {q.explanation}</p>
                </div>
            )}
          </CardContent>
        </Card>
      ))}

      {!submitted && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit}>Submit Quiz</Button>
        </div>
      )}
    </div>
  );
}
