
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Wand2, Upload, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JSZip from 'jszip';


// Setup worker path for pdf.js
let pdfjs: any;

const notesSchema = z.object({
  noteStyle: z.enum(['detailed', 'bullet', 'outline', 'summary', 'concise']),
  complexity: z.enum(['simple', 'medium', 'advanced']),
});

const quizSchema = z.object({
    numQuestions: z.coerce.number().min(1).max(100),
    questionTypes: z.array(z.string()).refine(value => value.some(item => item), {
        message: "You have to select at least one item.",
    }),
    difficulty: z.enum(['easy', 'medium', 'hard']),
});

const flashcardsSchema = z.object({
    numCards: z.coerce.number().min(1).max(30),
    cardStyle: z.enum(['basic', 'detailed', 'question']),
});

const formSchema = z.object({
  sourceText: z.string().min(50, 'Source text must be at least 50 characters long.'),
}).extend(notesSchema.partial().shape).extend(quizSchema.partial().shape).extend(flashcardsSchema.partial().shape);


export type InputFormValues = z.infer<typeof formSchema>;

interface InputFormProps {
  onGenerate: (values: InputFormValues) => void;
  isLoading?: boolean;
  generationType: 'notes' | 'quiz' | 'flashcards' | 'mindmap';
}

const questionTypeItems = [
    { id: 'multiple-choice', label: 'Multiple Choice'},
    { id: 'true-false', label: 'True/False'},
    { id: 'short-answer', label: 'Short Answer'},
]

export function InputForm({ onGenerate, isLoading, generationType }: InputFormProps) {
  const { settings } = useAuth();
  const [isParsing, setIsParsing] = useState(false);
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js`;
    script.onload = () => {
        pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js`;
        setPdfjsLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const form = useForm<InputFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sourceText: "",
      // Notes defaults
      noteStyle: settings.defaultNoteStyle || 'detailed',
      complexity: settings.defaultComplexity || 'medium',
      // Quiz defaults
      numQuestions: 5,
      questionTypes: ['multiple-choice'],
      difficulty: 'medium',
      // Flashcard defaults
      numCards: 10,
      cardStyle: 'basic',
    },
  });
  
  const parseDocx = async (file: File) => {
    const jszip = new JSZip();
    const zip = await jszip.loadAsync(file);
    const contentXml = await zip.file("word/document.xml")?.async("string");
    
    if (contentXml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(contentXml, "application/xml");
        
        // This function recursively extracts text from nodes
        const getTextFromNode = (node: Node): string => {
            let text = '';
            if (node.nodeName === 'w:t' && node.textContent) {
                text += node.textContent;
            } else if (node.nodeName === 'w:p') {
                text += '\n'; // Add newline for each new paragraph
            } else if (node.nodeName === 'w:tab') {
                text += '\t'; // Handle tabs
            }

            if (node.hasChildNodes()) {
                node.childNodes.forEach(child => {
                    text += getTextFromNode(child);
                });
            }
            return text;
        };

        const bodyNode = xmlDoc.getElementsByTagName('w:body')[0];
        if (bodyNode) {
            const extractedText = getTextFromNode(bodyNode).trim();
            if (extractedText) {
                form.setValue('sourceText', extractedText);
                return;
            }
        }
    }
    throw new Error("Could not extract any text from the DOCX file. The file might be empty, corrupted, or in an unsupported format.");
  }
  
  const parsePdf = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
    }
    form.setValue('sourceText', fullText);
  }


  const onDrop = async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > 15 * 1024 * 1024) { // 15MB limit
          toast({ variant: 'destructive', title: "File too large", description: "Please upload a file under 15MB."});
          return;
      }
      
      setIsParsing(true);
      toast({ title: `Parsing ${file.name}...`, description: "Please wait while we extract the text." });

      try {
        if (file.type === 'application/pdf' && pdfjsLoaded) {
            await parsePdf(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            await parseDocx(file);
        } else {
           throw new Error("Unsupported file type or required library not loaded.");
        }
        
        toast({ title: "✓ File Processed", description: "Text has been extracted and is ready for generation." });

      } catch (error) {
        console.error("Error parsing file:", error);
        toast({ variant: 'destructive', title: 'File Parsing Failed', description: (error as Error).message });
      } finally {
        setIsParsing(false);
      }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
        'application/pdf': ['.pdf'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
  });

  const getButtonText = () => {
    switch (generationType) {
        case 'notes': return 'Generate Notes';
        case 'quiz': return 'Generate Quiz';
        case 'flashcards': return 'Generate Flashcards';
        case 'mindmap': return 'Generate Mind Map';
        default: return 'Generate';
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onGenerate)} className="h-full">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Source Material</CardTitle>
            <CardDescription>Paste text or upload a PDF/DOCX to generate study materials.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-6">
            <Tabs defaultValue="text" className="flex-1 flex flex-col">
                <TabsList>
                    <TabsTrigger value="text"><FileText/> Paste Text</TabsTrigger>
                    <TabsTrigger value="upload"><Upload/> Upload File</TabsTrigger>
                </TabsList>
                <TabsContent value="text" className="flex-1 mt-2">
                    <FormField
                      control={form.control}
                      name="sourceText"
                      render={({ field }) => (
                        <FormItem className="h-full flex flex-col">
                          <FormLabel className="sr-only">Text Content</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Paste your document, article, or notes here..." className="flex-1 resize-y text-foreground" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </TabsContent>
                 <TabsContent value="upload" className="flex-1 mt-2">
                     <div {...getRootProps()} className={`h-full border-2 border-dashed rounded-lg flex items-center justify-center text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                        <input {...getInputProps()} />
                        {isParsing ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="animate-spin h-8 w-8 text-primary" />
                                <p>Processing file...</p>
                            </div>
                        ) : (
                             <div className="flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <p>Drag & drop a PDF or DOCX here, or click to select a file.</p>
                                <p className="text-xs text-muted-foreground">(Max file size: 15MB)</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
             <div className="grid md:grid-cols-2 gap-6">
                {generationType === 'notes' && (
                    <>
                        <FormField
                            control={form.control}
                            name="noteStyle"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Note Style</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                    <SelectItem value="detailed">Detailed Notes</SelectItem>
                                    <SelectItem value="concise">Concise Notes</SelectItem>
                                    <SelectItem value="bullet">Bullet Points</SelectItem>
                                    <SelectItem value="outline">Outline Format</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="complexity"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Complexity Level</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                    <SelectItem value="simple">Simple</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}
                {generationType === 'quiz' && (
                    <>
                        <FormField
                            control={form.control}
                            name="numQuestions"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Questions</FormLabel>
                                    <FormControl><Input type="number" min="1" max="100" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="difficulty"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Difficulty Level</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="questionTypes"
                            render={() => (
                                <FormItem className="col-span-full">
                                <div className="mb-4">
                                    <FormLabel>Question Types</FormLabel>
                                    <FormDescription>Select one or more question types to include.</FormDescription>
                                </div>
                                {questionTypeItems.map((item) => (
                                    <FormField
                                    key={item.id}
                                    control={form.control}
                                    name="questionTypes"
                                    render={({ field }) => {
                                        return (
                                        <FormItem
                                            key={item.id}
                                            className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                            <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(item.id)}
                                                onCheckedChange={(checked) => {
                                                return checked
                                                    ? field.onChange([...(field.value || []), item.id])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                        (value) => value !== item.id
                                                        )
                                                    )
                                                }}
                                            />
                                            </FormControl>
                                            <FormLabel className="font-normal">
                                                {item.label}
                                            </FormLabel>
                                        </FormItem>
                                        )
                                    }}
                                    />
                                ))}
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                    </>
                )}
                {generationType === 'flashcards' && (
                    <>
                        <FormField
                            control={form.control}
                            name="numCards"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Number of Flashcards</FormLabel>
                                    <FormControl><Input type="number" min="1" max="30" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="cardStyle"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Card Style</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="basic">Basic (Term / Definition)</SelectItem>
                                        <SelectItem value="detailed">Detailed (Concept / Explanation)</SelectItem>
                                        <SelectItem value="question">Question / Answer</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </>
                )}
             </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || isParsing} className="w-full">
              {isLoading || isParsing ? <Loader2/> : <Wand2/>}
              {isLoading ? 'Generating...' : isParsing ? 'Processing File...' : getButtonText()}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
