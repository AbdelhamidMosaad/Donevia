
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileText, BrainCircuit, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { GeneratedContentDisplay } from '@/components/learning-tool/generated-content-display';
import { SavedContentView } from '@/components/learning-tool/saved-content-view';
import type { GeneratedLearningContent, LearningContentRequest } from '@/lib/types';

export default function LearningToolPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedLearningContent | null>(null);

  const [quizType, setQuizType] = useState<'multiple-choice' | 'true-false' | 'short-answer'>('multiple-choice');
  const [numQuestions, setNumQuestions] = useState(5);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({ variant: 'destructive', title: 'File too large', description: 'Please select a file smaller than 10MB.' });
        return;
      }
      setFileInput(file);
      setTextInput(''); // Clear text input if file is selected
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Please log in to use this feature.' });
      return;
    }
    if (!textInput.trim() && !fileInput) {
      toast({ variant: 'destructive', title: 'Please provide text or upload a file.' });
      return;
    }

    setIsLoading(true);
    setGeneratedContent(null);

    try {
        const formData = new FormData();
        const requestPayload: LearningContentRequest = {
            numQuestions,
            quizType,
            generateFlashcards: true,
            generateNotes: true,
            generateQuiz: true,
        };

        formData.append('requestPayload', JSON.stringify(requestPayload));
        
        if (fileInput) {
            formData.append('file', fileInput);
        } else {
            formData.append('text', textInput);
        }
        
        const idToken = await user.getIdToken();

        const response = await fetch('/api/learning-tool/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate content.');
        }

        const result = await response.json();
        setGeneratedContent(result.data);
        toast({ title: 'Success!', description: 'Your learning materials have been generated.' });
    
    } catch (error) {
      console.error('Generation error:', error);
      toast({ variant: 'destructive', title: 'Generation Failed', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">AI Learning Tool</h1>
          <p className="text-muted-foreground">Generate notes, quizzes, and flashcards from any text or document.</p>
        </div>
      </div>
      
      <Tabs defaultValue="generate" className="flex-1">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate"><BrainCircuit className="mr-2 h-4 w-4"/>Generate New</TabsTrigger>
            <TabsTrigger value="saved"><History className="mr-2 h-4 w-4"/>Saved Content</TabsTrigger>
        </TabsList>
        <TabsContent value="generate" className="mt-4">
            <div className="grid md:grid-cols-2 gap-8">
                {/* Input and Options Column */}
                <Card>
                    <CardHeader>
                        <CardTitle>1. Provide Your Content</CardTitle>
                        <CardDescription>Paste text directly or upload a file.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="text-input">Paste Text</Label>
                            <Textarea
                                id="text-input"
                                placeholder="Paste your article, lecture transcript, or notes here..."
                                className="min-h-[200px]"
                                value={textInput}
                                onChange={(e) => {
                                    setTextInput(e.target.value);
                                    if (fileInput) setFileInput(null);
                                }}
                                disabled={!!fileInput}
                            />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">Or</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Upload a File</Label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.docx"
                                className="hidden"
                            />
                            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4" />
                                {fileInput ? 'Change File' : 'Select a .pdf or .docx file'}
                            </Button>
                            {fileInput && (
                                <div className="text-sm text-muted-foreground flex items-center justify-between p-2 bg-muted rounded-md">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        <span className="truncate">{fileInput.name}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFileInput(null)}>
                                        <Loader2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                         <CardTitle className="pt-4">2. Customize Output</CardTitle>
                         <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="quiz-type">Quiz Type</Label>
                                <Select value={quizType} onValueChange={(v) => setQuizType(v as any)}>
                                    <SelectTrigger id="quiz-type"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                        <SelectItem value="true-false">True/False</SelectItem>
                                        <SelectItem value="short-answer">Short Answer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="num-questions">Number of Questions</Label>
                                <Input id="num-questions" type="number" value={numQuestions} onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value, 10)))} min="1" max="20" />
                            </div>
                         </div>

                        <Button onClick={handleGenerate} disabled={isLoading} className="w-full mt-4">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                            {isLoading ? 'Generating...' : 'Generate Learning Materials'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Output Column */}
                <GeneratedContentDisplay content={generatedContent} isLoading={isLoading} />
            </div>
        </TabsContent>
        <TabsContent value="saved">
            <SavedContentView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
