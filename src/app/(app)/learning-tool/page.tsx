
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, UploadCloud, Loader2 } from 'lucide-react';
import { GeneratedLearningContent, LearningContentRequest, LearningMaterial } from '@/lib/types';
import { GeneratedContentDisplay } from '@/components/learning-tool/generated-content-display';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SavedContentView } from '@/components/learning-tool/saved-content-view';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

export default function LearningToolPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedLearningContent | null>(null);
  const [generationType, setGenerationType] = useState<'notes' | 'quiz' | 'flashcards'>('notes');

  // Quiz options
  const [numQuestions, setNumQuestions] = useState(10);
  const [questionTypes, setQuestionTypes] = useState({
      'multiple-choice': true,
      'true-false': true,
      'short-answer': true,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFileInput(e.target.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in' });
      return;
    }
    if (!textInput.trim() && !fileInput) {
      toast({ variant: 'destructive', title: 'Please provide text or a file' });
      return;
    }

    setIsLoading(true);
    setGeneratedContent(null);
    const formData = new FormData();
    
    if (fileInput) {
        formData.append('file', fileInput);
    }
    formData.append('text', textInput);

    const requestPayload: Omit<LearningContentRequest, 'context'> = { type: generationType };
    if (generationType === 'quiz') {
        const selectedTypes = Object.entries(questionTypes)
            .filter(([, isSelected]) => isSelected)
            .map(([type]) => type) as ('multiple-choice' | 'true-false' | 'short-answer')[];
        
        if (selectedTypes.length === 0) {
            toast({ variant: 'destructive', title: 'Please select at least one question type for the quiz.'});
            setIsLoading(false);
            return;
        }

        requestPayload.quizOptions = {
            numQuestions,
            questionTypes: selectedTypes,
        }
    }
    formData.append('requestPayload', JSON.stringify(requestPayload));

    try {
        const response = await fetch('/api/learning-tool/generate', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${await user.getIdToken()}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'An unknown error occurred.');
        }

        const result = await response.json();
        setGeneratedContent(result.data);

        // Save to Firestore
        const sourceTitle = fileInput?.name || `${textInput.substring(0, 30)}...`;
        await addDoc(collection(db, 'users', user.uid, 'learningMaterials'), {
            userId: user.uid,
            sourceTitle,
            type: generationType,
            content: result.data,
            createdAt: serverTimestamp(),
        } as Omit<LearningMaterial, 'id'>);
        
        toast({ title: 'Success!', description: `${generationType.charAt(0).toUpperCase() + generationType.slice(1)} have been generated and saved.` });
        
    } catch (error) {
        console.error("Generation failed:", error);
        toast({ variant: 'destructive', title: 'Generation Failed', description: (error as Error).message });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
       <div className="flex items-center gap-4">
        <GraduationCap className="h-8 w-8 text-primary"/>
        <div>
            <h1 className="text-3xl font-bold font-headline">AI Learning Tool</h1>
            <p className="text-muted-foreground">Turn any document or text into notes, quizzes, and flashcards.</p>
        </div>
      </div>

      <Tabs defaultValue="generate">
        <TabsList>
            <TabsTrigger value="generate">Generate New</TabsTrigger>
            <TabsTrigger value="saved">My Materials</TabsTrigger>
        </TabsList>
        <TabsContent value="generate">
            <div className="grid md:grid-cols-2 gap-6 items-start">
                {/* Input Column */}
                <Card>
                    <CardHeader>
                        <CardTitle>1. Provide Your Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                        <Label htmlFor="text-input">Paste Text</Label>
                        <Textarea
                            id="text-input"
                            placeholder="Paste your lecture transcript or article here..."
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            rows={10}
                        />
                        </div>
                        <div className="text-center text-sm text-muted-foreground">OR</div>
                        <div>
                        <Label htmlFor="file-input">Upload a File</Label>
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-10">
                            <div className="text-center">
                            <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                            <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                                <Label htmlFor="file-input" className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80">
                                <span>Upload a file</span>
                                <Input id="file-input" name="file-input" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.docx" />
                                </Label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs leading-5 text-muted-foreground">PDF, DOCX up to 10MB</p>
                            {fileInput && <p className="text-sm font-medium mt-2">{fileInput.name}</p>}
                            </div>
                        </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Generation Options & Action Column */}
                <Card>
                    <CardHeader>
                        <CardTitle>2. Choose What to Generate</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       <Tabs defaultValue="notes" onValueChange={(v) => setGenerationType(v as any)}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="notes">Notes</TabsTrigger>
                                <TabsTrigger value="quiz">Quiz</TabsTrigger>
                                <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
                            </TabsList>
                            <TabsContent value="notes" className="pt-4">
                                <p className="text-sm text-muted-foreground">Generates well-structured lecture-style notes from your content.</p>
                            </TabsContent>
                            <TabsContent value="quiz" className="pt-4 space-y-4">
                                <div>
                                    <Label>Number of Questions: {numQuestions}</Label>
                                    <Slider defaultValue={[10]} min={5} max={25} step={1} onValueChange={(val) => setNumQuestions(val[0])} />
                                </div>
                                 <div>
                                    <Label>Question Types</Label>
                                    <div className="flex items-center space-x-4 mt-2">
                                       <div className="flex items-center space-x-2">
                                            <Checkbox id="mcq" checked={questionTypes['multiple-choice']} onCheckedChange={(checked) => setQuestionTypes(prev => ({...prev, 'multiple-choice': !!checked}))}/>
                                            <Label htmlFor="mcq">Multiple Choice</Label>
                                       </div>
                                       <div className="flex items-center space-x-2">
                                            <Checkbox id="tf" checked={questionTypes['true-false']} onCheckedChange={(checked) => setQuestionTypes(prev => ({...prev, 'true-false': !!checked}))}/>
                                            <Label htmlFor="tf">True/False</Label>
                                       </div>
                                        <div className="flex items-center space-x-2">
                                            <Checkbox id="sa" checked={questionTypes['short-answer']} onCheckedChange={(checked) => setQuestionTypes(prev => ({...prev, 'short-answer': !!checked}))}/>
                                            <Label htmlFor="sa">Short Answer</Label>
                                       </div>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="flashcards" className="pt-4">
                                 <p className="text-sm text-muted-foreground">Generates key term flashcards for quick review and memorization.</p>
                            </TabsContent>
                       </Tabs>

                        <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GraduationCap className="mr-2 h-4 w-4" />}
                        {isLoading ? 'Generating...' : 'Generate'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
            
            {generatedContent && (
                <Card className="mt-6">
                    <CardHeader><CardTitle>Generated Content</CardTitle></CardHeader>
                    <CardContent>
                        <GeneratedContentDisplay content={generatedContent} />
                    </CardContent>
                </Card>
            )}

        </TabsContent>
        <TabsContent value="saved">
            <SavedContentView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
