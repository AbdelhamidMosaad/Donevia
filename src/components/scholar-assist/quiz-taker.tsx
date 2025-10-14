
'use client';

import { useState } from 'react';
import type { StudyMaterialResponse } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Copy, Download, RefreshCw, Save, Trash2 } from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { saveQuiz } from '@/lib/quizzes';
import { useAuth } from '@/hooks/use-auth';

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
    const [checkedAnswers, setCheckedAnswers] = useState<Record<number, boolean>>({});
    const [score, setScore] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleAnswerSelect = (questionIndex: number, answer: string | number) => {
        if(checkedAnswers[questionIndex]) return; 
        setUserAnswers(prev => ({...prev, [questionIndex]: answer}));
    }

    const checkAllAnswers = () => {
        if (!result?.quizContent) return;
        let correctCount = 0;
        const newCheckedAnswers: Record<number, boolean> = {};
        result.quizContent.forEach((q, index) => {
            const userAnswer = userAnswers[index];
            let isCorrect = false;

            if (q.questionType === 'multiple-choice' || q.questionType === 'true-false') {
                const options = q.questionType === 'true-false' ? ['True', 'False'] : q.options || [];
                const correctIndex = options.findIndex(opt => opt.toLowerCase() === q.correctAnswer.toLowerCase());
                if (userAnswer === correctIndex) {
                    isCorrect = true;
                }
            } else { // short-answer
                // We'll just show the answer, not score it automatically.
            }
            
            if(isCorrect) correctCount++;
            newCheckedAnswers[index] = true;
        });
        
        const totalScorableQuestions = result.quizContent.filter(q => q.questionType !== 'short-answer').length;
        if (totalScorableQuestions > 0) {
            setScore(correctCount);
        } else {
            setScore(null);
        }
        setCheckedAnswers(newCheckedAnswers);
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

    const totalQuestions = result?.quizContent?.length || 0;
    const currentQuestion = result?.quizContent?.[currentQuestionIndex];
    const isAnswered = checkedAnswers[currentQuestionIndex];
    const options = currentQuestion?.questionType === 'true-false' ? ['True', 'False'] : currentQuestion?.options || [];
    const correctOptionIndex = options.findIndex(opt => opt.toLowerCase() === currentQuestion?.correctAnswer.toLowerCase());
    const allQuestionsAnswered = Object.keys(userAnswers).length === totalQuestions;


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
                            disabled={isAnswered}
                        />
                        {isAnswered && (
                            <div className="mt-2 text-sm">
                                <p className="font-bold">Correct Answer:</p>
                                <p className="text-primary">{currentQuestion.correctAnswer}</p>
                            </div>
                        )}
                    </div>
                ) : (
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
                )}
                
                {isAnswered && (
                    <div className="p-3 bg-yellow-100/50 border-l-4 border-yellow-400 rounded-r-md mt-4">
                        <p className="font-bold">Explanation:</p>
                        <p>{currentQuestion.explanation}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex-col items-stretch gap-4">
            {score !== null && (
                    <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-xl font-bold">Quiz Complete!</p>
                        <p className="text-2xl font-headline">Your Score: {score}/{totalQuestions - result.quizContent.filter(q => q.questionType === 'short-answer').length} ({(score / (totalQuestions - result.quizContent.filter(q => q.questionType === 'short-answer').length) * 100).toFixed(0)}%)</p>
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
