
'use client';

import { useState, useMemo, useRef } from 'react';
import type { StudyMaterialResponse } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, Download, RefreshCw, Save, Trash2, CheckCircle, XCircle, Flag, FileText } from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '../ui/scroll-area';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { SaveQuizDialog } from './shared/save-quiz-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [markedQuestions, setMarkedQuestions] = useState<Set<number>>(new Set());
    const exportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

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
    
    const handleExportWord = () => {
        if (!result?.quizContent) return;
        
        const children = [new Paragraph({ text: result.title, heading: HeadingLevel.TITLE })];

        result.quizContent.forEach((q, i) => {
            children.push(new Paragraph({ text: `${i + 1}. ${q.questionText}`, heading: HeadingLevel.HEADING_2 }));
            if (q.options) {
                q.options.forEach(opt => children.push(new Paragraph({ text: `- ${opt}`, bullet: { level: 0 } })));
            }
            children.push(new Paragraph({ children: [new TextRun({ text: "Correct Answer: ", bold: true }), new TextRun(q.correctAnswer)] }));
            children.push(new Paragraph({ children: [new TextRun({ text: "Explanation: ", bold: true }), new TextRun(q.explanation)] }));
            children.push(new Paragraph(" "));
        });

        const doc = new Document({ sections: [{ children }] });

        Packer.toBlob(doc).then(blob => {
            saveAs(blob, `${result.title.replace(/ /g, '_')}.docx`);
        });
        toast({ title: '✓ Exporting as Word document' });
    };

    const handleExportPDF = async () => {
        if (!exportRef.current) return;
        setIsExporting(true);
        toast({ title: 'Generating PDF...' });
        try {
            const canvas = await html2canvas(exportRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            let imgWidth = pdfWidth - 20;
            let imgHeight = imgWidth / ratio;
            let heightLeft = imgHeight;
            let position = 10;
            if (imgHeight > pdfHeight - 20) {
                imgHeight = pdfHeight - 20;
                imgWidth = imgHeight * ratio;
            }

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight - 20;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight - 20;
            }

            pdf.save(`${result.title.replace(/ /g, '_')}.pdf`);
            toast({ title: '✓ PDF Exported' });
        } catch(e) {
             toast({ variant: 'destructive', title: 'PDF Export Failed' });
        } finally {
            setIsExporting(false);
        }
    };

    const toggleMarkQuestion = () => {
        const newMarked = new Set(markedQuestions);
        if (newMarked.has(currentQuestionIndex)) {
            newMarked.delete(currentQuestionIndex);
        } else {
            newMarked.add(currentQuestionIndex);
        }
        setMarkedQuestions(newMarked);
    };

    const handleJumpToQuestion = (index: number) => {
        setCurrentQuestionIndex(index);
    };

    const currentQuestion = result?.quizContent?.[currentQuestionIndex];
    const allQuestionsAnswered = Object.keys(userAnswers).length === totalQuestions;
    
    if (isQuizFinished) {
        const percentage = score !== null && totalScorableQuestions > 0 ? (score / totalScorableQuestions) * 100 : 0;
        const isExcellentScore = percentage >= 70;

        return (
             <>
                <Card className="flex-1 flex flex-col h-full">
                    <CardHeader>
                        <CardTitle>Quiz Results: {result.title}</CardTitle>
                        <CardDescription>Review your answers and the explanations below.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0">
                        <ScrollArea className="h-full pr-4">
                           <div ref={exportRef} className="p-4 bg-background">
                            <div className="text-center p-4 bg-muted rounded-lg mb-4">
                                <p className="text-xl font-bold">Quiz Complete!</p>
                                {score !== null && (
                                    <>
                                    <p className="text-2xl font-headline">Your Score: {score}/{totalScorableQuestions} ({percentage.toFixed(0)}%)</p>
                                    {isExcellentScore && <p className="text-green-600 font-semibold mt-1">Excellent work! Keep it up!</p>}
                                    </>
                                )}
                            </div>
                            <div className="space-y-4">
                                {result.quizContent.map((q, index) => {
                                    const userAnswerIndex = userAnswers[index] as number;
                                    const options = q.questionType === 'true-false' ? ['True', 'False'] : q.options || [];
                                    const userAnswerText = options[userAnswerIndex] ?? userAnswers[index];
                                    const isCorrect = q.questionType !== 'short-answer' ? (userAnswerIndex === options.findIndex(opt => opt === q.correctAnswer)) : false;
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
                            </div>
                        </ScrollArea>
                    </CardContent>
                    <CardFooter className="justify-end gap-2">
                        <Button variant="outline" onClick={onReset}>Generate New Quiz</Button>
                        {!isSavedQuiz && (
                            <Button onClick={() => setIsSaveDialogOpen(true)}>
                                <Save /> Save This Quiz
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleExportWord}><Download/> Export .docx</Button>
                        <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
                            {isExporting ? <Loader2 className="animate-spin" /> : <FileText />} Export PDF
                        </Button>
                    </CardFooter>
                </Card>
                <SaveQuizDialog
                    isOpen={isSaveDialogOpen}
                    onOpenChange={setIsSaveDialogOpen}
                    quiz={result}
                />
            </>
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

                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline">Jump to...</Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto">
                                <div className="grid grid-cols-5 gap-1">
                                    {Array.from({length: totalQuestions}).map((_, i) => (
                                        <Button
                                            key={i}
                                            variant={currentQuestionIndex === i ? 'default' : 'outline'}
                                            size="icon"
                                            className={cn("h-8 w-8 relative", markedQuestions.has(i) && 'ring-2 ring-yellow-400')}
                                            onClick={() => handleJumpToQuestion(i)}
                                        >
                                            {i + 1}
                                            {userAnswers[i] !== undefined && <CheckCircle className="h-3 w-3 absolute -top-1 -right-1 text-green-500 bg-background rounded-full"/>}
                                        </Button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button variant="outline" onClick={toggleMarkQuestion} title="Mark for Review">
                            <Flag className={cn("h-4 w-4", markedQuestions.has(currentQuestionIndex) && "fill-current text-yellow-500")} />
                        </Button>
                        <Button onClick={checkAllAnswers} disabled={score !== null || !allQuestionsAnswered}>Submit</Button>
                    </div>

                     <Button variant="outline" onClick={() => setCurrentQuestionIndex(i => i + 1)} disabled={currentQuestionIndex === totalQuestions - 1}>
                        Next <ChevronRight/>
                    </Button>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onReset}>Generate New Quiz</Button>
                    {isSavedQuiz ? (
                        onDelete && <Button variant="destructive" onClick={onDelete}><Trash2/> Delete Quiz</Button>
                    ) : (
                         <Button onClick={() => setIsSaveDialogOpen(true)}>
                            <Save /> Save Quiz
                        </Button>
                    )}
                </div>
            </CardFooter>
             <SaveQuizDialog
                isOpen={isSaveDialogOpen}
                onOpenChange={setIsSaveDialogOpen}
                quiz={result}
            />
        </Card>
    )
}
