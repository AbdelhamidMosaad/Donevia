
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Sparkles, Upload, FileText } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import type { GeneratedLearningContent, LearningContentRequest } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface InputFormProps {
    onGenerationStart: () => void;
    onGenerationComplete: (content: GeneratedLearningContent) => void;
    onGenerationError: () => void;
    generationType: 'notes' | 'quiz' | 'flashcards';
    title: string;
    description: string;
    showQuizOptions?: boolean;
}

export function InputForm({
    onGenerationStart,
    onGenerationComplete,
    onGenerationError,
    generationType,
    title,
    description,
    showQuizOptions = false,
}: InputFormProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [text, setText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    // Quiz options state
    const [numQuestions, setNumQuestions] = useState(10);
    const [questionTypes, setQuestionTypes] = useState({
        'multiple-choice': true,
        'true-false': true,
        'short-answer': true,
    });
    
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => setFile(acceptedFiles[0]),
        multiple: false,
        accept: {
            'text/plain': ['.txt'],
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        }
    });

    const handleGenerate = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in' });
            return;
        }

        if (!file && !text.trim()) {
            toast({ variant: 'destructive', title: 'No content provided', description: 'Please upload a file or paste text.' });
            return;
        }

        onGenerationStart();

        try {
            const selectedQuestionTypes = Object.entries(questionTypes)
                .filter(([, isSelected]) => isSelected)
                .map(([type]) => type) as LearningContentRequest['quizOptions']['questionTypes'];

            if(showQuizOptions && selectedQuestionTypes.length === 0) {
                 toast({ variant: 'destructive', title: 'No question types selected' });
                 onGenerationError();
                 return;
            }

            const requestData: LearningContentRequest = {
                type: generationType,
                context: text,
                ...(showQuizOptions && {
                    quizOptions: {
                        numQuestions,
                        questionTypes: selectedQuestionTypes,
                    }
                })
            };

            const formData = new FormData();
            formData.append('idToken', await user.getIdToken());
            formData.append('requestData', JSON.stringify(requestData));
            if (file) {
                formData.append('file', file);
            }

            const response = await fetch('/api/learning-tool/generate', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Request failed with status ${response.status}`);
            }

            const result: GeneratedLearningContent = await response.json();
            onGenerationComplete(result);
            toast({ title: 'Success!', description: 'Your learning content has been generated.' });

        } catch (error) {
            console.error('Generation failed:', error);
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: (error as Error).message,
            });
            onGenerationError();
        }
    };
    
    const handleQuestionTypeChange = (type: string) => {
        setQuestionTypes(prev => ({
            ...prev,
            [type]: !prev[type]
        }));
    };

    return (
        <Card>
            <div className="p-6 space-y-6">
                <div>
                    <h3 className="text-xl font-bold font-headline">{title}</h3>
                    <p className="text-muted-foreground">{description}</p>
                </div>
                
                <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}>
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Upload className="h-10 w-10" />
                        <p>Drag 'n' drop a file here, or click to select a file</p>
                        <p className="text-xs">Supports .txt, .pdf, .docx</p>
                    </div>
                </div>

                {file && (
                    <div className="flex items-center gap-2 p-3 rounded-md bg-muted text-muted-foreground">
                        <FileText className="h-5 w-5" />
                        <span className="font-medium truncate">{file.name}</span>
                         <button onClick={() => setFile(null)} className="ml-auto text-destructive text-xs hover:underline">Remove</button>
                    </div>
                )}
                
                <div className="relative">
                    <Textarea 
                        placeholder="Or paste your text here..."
                        className="w-full min-h-[150px]"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                     <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                        {text.length} / 20000
                    </div>
                </div>

                {showQuizOptions && (
                    <div className="space-y-4 pt-4 border-t">
                        <h4 className="font-medium">Quiz Options</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="numQuestions">Number of Questions</Label>
                                <Input 
                                    id="numQuestions" 
                                    type="number" 
                                    value={numQuestions} 
                                    onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value, 10)))}
                                    min="1"
                                    max="25"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Question Types</Label>
                                <div className="space-y-2 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="mc" checked={questionTypes['multiple-choice']} onCheckedChange={() => handleQuestionTypeChange('multiple-choice')} />
                                        <Label htmlFor="mc">Multiple Choice</Label>
                                    </div>
                                     <div className="flex items-center space-x-2">
                                        <Checkbox id="tf" checked={questionTypes['true-false']} onCheckedChange={() => handleQuestionTypeChange('true-false')} />
                                        <Label htmlFor="tf">True/False</Label>
                                    </div>
                                     <div className="flex items-center space-x-2">
                                        <Checkbox id="sa" checked={questionTypes['short-answer']} onCheckedChange={() => handleQuestionTypeChange('short-answer')} />
                                        <Label htmlFor="sa">Short Answer</Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <Button onClick={handleGenerate} className="w-full">
                    <Sparkles className="mr-2 h-4 w-4"/>
                    Generate
                </Button>
            </div>
        </Card>
    );
}
