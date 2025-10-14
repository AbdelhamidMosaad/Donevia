
'use client';

import { useState, useMemo } from 'react';
import type { StudyMaterialResponse } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Copy, Download, RefreshCw, Save, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { saveQuiz } from '@/lib/quizzes';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '../ui/scroll-area';

interface QuizTakerProps {
    result: StudyMaterialResponse & { id?: string };
    onReset: () => void;
    onDelete?: () => void; // Optional for saved quizzes
    isSavedQuiz?: boolean;
}


export function QuizTaker({ result, onReset, onDelete, isSavedQuiz = false }: QuizTakerProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<number, string | number>>({});
    const [isQuizFinished, setIsQuizFinished] = useState(false);
    const [score, setScore] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const totalQuestions = result?.quizContent?.length || 0;
    const totalScorableQuestions = useMemo(() => result.quizContent.filter(q => q.questionType !== 'short-answer').length, [result.quizContent]);

    const handleAnswerSelect = (questionIndex: number, answer: string | number) => {
        if(isQuizFinished) return; 
        setUserAnswers(prev => ({...prev, [questionIndex]: answer}));
    }

    const checkAllAnswers = () => {
        if (!result?.quizContent) return;
        let correctCount = 0;
        result.quizContent.forEach((q, index) => {
            const userAnswer = userAnswers[index];
            if (q.questionType === 'multiple-choice') {
                const isCorrect = q.options?.findIndex(opt => opt === q.correctAnswer) === userAnswer;
                if (isCorrect) correctCount++;
            } else if (q.questionType === 'true-false') {
               const correctIndex = q.correctAnswer.toLowerCase() === 'true' ? 0 : 1;
               if (userAnswer === correctIndex) correctCount++;
            }
        });
        
        if (totalScorableQuestions > 0) {
            setScore(correctCount);
        }
        setIsQuizFinished(true);
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

    const handleSaveQuiz = async () => {
        if (!user || !result) return;
        setIsSaving(true);
        try {
            await saveQuiz(user.uid, result);
            toast({ title: 'Quiz Saved!', description: 'You can retake this quiz from the "Saved Quizzes" tab.' });
        } catch (e) {
            console.error("Error saving quiz: ", e);
            toast({ variant: 'destructive', title: 'Error saving quiz.' });
        } finally {
            setIsSaving(false);
        }
    }

    const currentQuestion = result?.quizContent?.[currentQuestionIndex];
    const allQuestionsAnswered = Object.keys(userAnswers).length === totalQuestions;
    
    if (isQuizFinished) {
        const percentage = score !== null && totalScorableQuestions > 0 ? (score / totalScorableQuestions) * 100 : 0;
        const isExcellentScore = percentage >= 70;

        return (
            <Card className="flex-1 flex flex-col h-full">
                <CardHeader>
                    <CardTitle>Quiz Results: {result.title}</CardTitle>
                    <CardDescription>Review your answers and the explanations below.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                     <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-xl font-bold">Quiz Complete!</p>
                        {score !== null && (
                            <>
                            <p className="text-2xl font-headline">Your Score: {score}/{totalScorableQuestions} ({percentage.toFixed(0)}%)</p>
                            {isExcellentScore && <p className="text-green-600 font-semibold mt-1">Excellent work! Keep it up!</p>}
                            </>
                        )}
                    </div>
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                            {result.quizContent.map((q, index) => {
                                const userAnswerIndex = userAnswers[index] as number;
                                const options = q.questionType === 'true-false' ? ['True', 'False'] : q.options || [];
                                const userAnswerText = options[userAnswerIndex] ?? userAnswers[index];
                                const isCorrect = q.questionType !== 'short-answer' ? (userAnswerIndex === options.findIndex(opt => opt.toLowerCase() === q.correctAnswer.toLowerCase())) : false;
                                const isScorable = q.questionType !== 'short-answer';

                                return (
                                    <div key={index} className="p-4 border rounded-lg">
                                        <p className="font-semibold">{index + 1}. {q.questionText}</p>
                                        <div className="mt-2 text-sm">
                                            {isScorable ? (
                                                <>
                                                    <p className={cn("flex items-center", isCorrect ? 'text-green-600' : 'text-destructive')}>
                                                        {isCorrect ? <CheckCircle className="mr-2 h-4 w-4"/> : <XCircle className="mr-2 h-4 w-4"/>}
                                                        Your Answer: {userAnswerText ?? "Not answered"}
                                                    </p>
                                                    {!isCorrect && <p className="text-green-600 mt-1">Correct Answer: {q.correctAnswer}</p>}
                                                </>
                                            ) : (
                                                <p className="text-muted-foreground">Your Answer: {userAnswerText ?? "Not answered"}</p>
                                            )}
                                            <p className="mt-2 text-muted-foreground italic pl-4 border-l-2 ml-2">
                                                <strong>Explanation:</strong> {q.explanation}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                     <Button variant="outline" onClick={onReset}>Generate New Quiz</Button>
                </CardFooter>
            </Card>
        )
    }

    if (!currentQuestion) return null;

    const options = currentQuestion.questionType === 'true-false' ? ['True', 'False'] : currentQuestion.options || [];

    return (
        <Card className="flex-1 flex flex-col h-full">
            <CardHeader>
                <CardTitle>{result.title}</CardTitle>
                <CardDescription>Question {currentQuestionIndex + 1} of {totalQuestions}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
                <p className="font-semibold text-lg">{currentQuestion.questionText}</p>
                
                {currentQuestion.questionType === 'short-answer' ? (
                    <div>
                        <Input 
                            placeholder="Type your answer here..."
                            value={(userAnswers[currentQuestionIndex] as string) || ''}
                            onChange={(e) => handleAnswerSelect(currentQuestionIndex, e.target.value)}
                        />
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {options.map((option, index) => (
                            <li 
                                key={index}
                                onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                                className={cn(
                                    "p-3 border rounded-md cursor-pointer transition-colors",
                                    userAnswers[currentQuestionIndex] === index && "bg-blue-100 border-blue-400",
                                    "hover:bg-muted"
                                )}
                            >
                            {option}
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
             <CardFooter className="flex-col items-stretch gap-4">
                <div className="flex justify-between items-center">
                     <Button variant="outline" onClick={() => setCurrentQuestionIndex(i => i - 1)} disabled={currentQuestionIndex === 0}>
                        <ChevronLeft/> Previous
                    </Button>
                    <Button onClick={checkAllAnswers} disabled={!allQuestionsAnswered}>Submit & See Results</Button>
                     <Button variant="outline" onClick={() => setCurrentQuestionIndex(i => i + 1)} disabled={currentQuestionIndex === totalQuestions - 1}>
                        Next <ChevronRight/>
                    </Button>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onReset}>Generate New Quiz</Button>
                    {isSavedQuiz ? (
                        <Button variant="destructive" onClick={onDelete}><Trash2/> Delete Quiz</Button>
                    ) : (
                         <Button onClick={handleSaveQuiz} disabled={isSaving}>
                            <Save /> {isSaving ? 'Saving...' : 'Save Quiz'}
                        </Button>
                    )}
                    <Button variant="outline" onClick={handleCopy}><Copy/> Copy Text</Button>
                    <Button variant="outline" onClick={handleDownload}><Download/> Download .txt</Button>
                </div>
            </CardFooter>
        </Card>
    )
}
