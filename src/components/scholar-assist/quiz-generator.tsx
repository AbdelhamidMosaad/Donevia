
'use client';

import { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { InputForm } from './shared/input-form';
import type { GeneratedLearningContent, QuizQuestion } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';

function QuestionCard({ question, index }: { question: QuizQuestion; index: number }) {
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const isCorrect = selectedAnswer === question.answer;

    const handleSubmit = () => {
        if(selectedAnswer !== null) {
            setIsSubmitted(true);
        }
    }

    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value={`item-${index}`}>
                <AccordionTrigger>
                    <div className="flex items-center gap-2">
                        {isSubmitted && (isCorrect ? <Check className="h-5 w-5 text-green-500"/> : <X className="h-5 w-5 text-destructive"/>)}
                        <span>Question {index + 1}: {question.question}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="p-4 space-y-4">
                        {question.type === 'multiple-choice' && question.options && (
                            <RadioGroup onValueChange={setSelectedAnswer} value={selectedAnswer || undefined} disabled={isSubmitted}>
                                {question.options.map((opt, i) => (
                                    <div key={i} className="flex items-center space-x-2">
                                        <RadioGroupItem value={opt} id={`q${index}-opt${i}`} />
                                        <Label htmlFor={`q${index}-opt${i}`}>{opt}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        )}
                         {question.type === 'true-false' && (
                            <RadioGroup onValueChange={setSelectedAnswer} value={selectedAnswer || undefined} disabled={isSubmitted}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="True" id={`q${index}-true`} />
                                    <Label htmlFor={`q${index}-true`}>True</Label>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="False" id={`q${index}-false`} />
                                    <Label htmlFor={`q${index}-false`}>False</Label>
                                </div>
                            </RadioGroup>
                        )}
                        {question.type === 'short-answer' && (
                             <Input 
                                placeholder="Your answer..." 
                                onChange={e => setSelectedAnswer(e.target.value)}
                                disabled={isSubmitted}
                             />
                        )}

                        {!isSubmitted ? (
                            <Button onClick={handleSubmit} disabled={selectedAnswer === null}>Submit Answer</Button>
                        ): (
                            <div className={cn("p-4 rounded-md", isCorrect ? "bg-green-100 dark:bg-green-900/50" : "bg-red-100 dark:bg-red-900/50")}>
                                <p className="font-bold">Correct Answer: {question.answer}</p>
                                <p className="text-sm">{question.explanation}</p>
                            </div>
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}

export function QuizGenerator() {
    const [generatedContent, setGeneratedContent] = useState<GeneratedLearningContent | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    return (
        <div className="grid md:grid-cols-2 gap-6">
            <InputForm 
                onGenerationStart={() => setIsLoading(true)}
                onGenerationComplete={(content) => {
                    setGeneratedContent(content);
                    setIsLoading(false);
                }}
                onGenerationError={() => setIsLoading(false)}
                generationType='quiz'
                title="Generate a Quiz"
                description="Upload a document or paste text to create a quiz to test your knowledge."
                showQuizOptions
            />
            <Card className="min-h-[400px]">
                <CardContent className="p-6 h-full">
                     {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
                            <Loader2 className="h-16 w-16 animate-spin mb-4" />
                            <h3 className="text-xl font-semibold font-headline">Generating Quiz...</h3>
                            <p>The AI is working its magic. This may take a moment.</p>
                        </div>
                    ) : generatedContent?.quiz ? (
                        <ScrollArea className="h-[calc(100vh-350px)] pr-4">
                            <div className="space-y-4">
                            {generatedContent.quiz.map((q, i) => (
                                <QuestionCard key={i} question={q} index={i}/>
                            ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                            Your generated quiz will appear here.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
