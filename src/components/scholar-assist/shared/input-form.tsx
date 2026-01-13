
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2, Wand2, Upload, FileText, FileIcon, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JSZip from 'jszip';
import { searchWeb, fetchWebContent, WebSearchResponse } from '@/ai/flows/web-search-flow';
import { ScrollArea } from '@/components/ui/scroll-area';


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
    maxCards: z.coerce.number().min(1).max(50).optional(),
    cardStyle: z.enum(['basic', 'detailed', 'question']),
});

const formSchema = z.object({
  sourceText: z.string().min(50, 'Source text must be at least 50 characters long.').optional(),
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
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WebSearchResponse['results']>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [activeTab, setActiveTab] = useState('text');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js`;
    script.onload = () => {
        pdfjs = (window as any).pdfjsLib;
        if (pdfjs) {
            pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js`;
            setPdfjsLoaded(true);
        }
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
      noteStyle: 'concise',
      complexity: settings.defaultComplexity || 'medium',
      // Quiz defaults
      numQuestions: 5,
      questionTypes: ['multiple-choice'],
      difficulty: 'medium',
      // Flashcard defaults
      maxCards: 30,
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

  const parsePptx = async (file: File) => {
    const jszip = new JSZip();
    const zip = await jszip.loadAsync(file);
    const slidePromises: Promise<string>[] = [];
    zip.folder('ppt/slides')?.forEach((relativePath, zipEntry) => {
        if(relativePath.endsWith('.xml')) {
            slidePromises.push(zipEntry.async('string'));
        }
    });
    
    const slidesXml = await Promise.all(slidePromises);
    let fullText = '';
    const parser = new DOMParser();

    slidesXml.forEach(xml => {
        const xmlDoc = parser.parseFromString(xml, 'application/xml');
        const textNodes = xmlDoc.getElementsByTagName('a:t');
        for (let i = 0; i < textNodes.length; i++) {
            fullText += textNodes[i].textContent + '\n';
        }
        fullText += '\n\n'; // Separator for slides
    });

    if(fullText.trim()) {
      form.setValue('sourceText', fullText.trim());
    } else {
        throw new Error("Could not extract any text from the PPTX file.");
    }
  };
  
  const parsePdf = async (file: File) => {
    if (!pdfjsLoaded) {
        toast({ variant: 'destructive', title: "PDF library not loaded yet. Please wait a moment and try again."});
        return;
    }
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

  const parseTxt = async (file: File) => {
      const text = await file.text();
      form.setValue('sourceText', text);
  }


  const onDrop = async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > 15 * 1024 * 1024) { // 15MB limit
          toast({ variant: "destructive", title: "File too large", description: "Please upload a file under 15MB."});
          return;
      }
      
      setFileName(file.name);
      setIsParsing(true);
      toast({ title: `Parsing ${file.name}...`, description: "Please wait while we extract the text." });

      try {
        if (file.type === 'application/pdf' && pdfjsLoaded) {
            await parsePdf(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            await parseDocx(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || file.name.endsWith('.pptx')) {
            await parsePptx(file);
        } else if (file.type === 'text/plain') {
            await parseTxt(file);
        } else {
           throw new Error("Unsupported file type or required library not loaded.");
        }
        
        toast({ title: "✓ File Processed", description: "Text has been extracted and is ready for generation." });

      } catch (error: any) {
        console.error("Error parsing file:", error);
        toast({ variant: 'destructive', title: 'File Parsing Failed', description: (error as Error).message });
        setFileName(null);
      } finally {
        setIsParsing(false);
      }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
        'application/pdf': ['.pdf'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
        'text/plain': ['.txt'],
    },
    multiple: false,
  });

  const handleWebSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
        const result = await searchWeb({ query: searchQuery });
        setSearchResults(result.results);
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Web search failed', description: (e as Error).message });
    } finally {
        setIsSearching(false);
    }
  };
  
  const handleToggleSource = (link: string) => {
    setSelectedSources(prev => prev.includes(link) ? prev.filter(l => l !== link) : [...prev, link]);
  };
  
  const handleFormSubmit = async () => {
    await form.handleSubmit(async (values) => {
        if (activeTab === 'web') {
            if(selectedSources.length === 0) {
                toast({ variant: 'destructive', title: 'Please select at least one web source.' });
                return;
            }
            setIsFetching(true);
            try {
                const result = await fetchWebContent({ urls: selectedSources });
                const combinedContent = result.sources.map(s => `Source: ${s.url}\n\n${s.content}`).join('\n\n---\n\n');
                onGenerate({...values, sourceText: combinedContent });
            } catch (e) {
                toast({ variant: 'destructive', title: 'Failed to fetch web content.' });
            } finally {
                setIsFetching(false);
            }
        } else {
            if (!values.sourceText?.trim()) {
                toast({ variant: 'destructive', title: 'Source text cannot be empty.' });
                return;
            }
            onGenerate(values);
        }
    })();
  }

  const getButtonText = () => {
    if (isLoading || isParsing || isFetching) {
        if (isLoading) return 'Generating...';
        if (isParsing) return 'Processing...';
        if (isFetching) return 'Fetching Content...';
    }
    if (activeTab === 'web') {
        return `Generate from ${selectedSources.length} source(s)`;
    }
    switch (generationType) {
        case 'notes': return 'Generate Notes';
        case 'quiz': return 'Generate Quiz';
        case 'flashcards': return 'Generate Flashcards';
        case 'mindmap': return 'Generate Mind Map';
        default: return 'Generate';
    }
  }
  
  const isGenerateDisabled = () => {
    if (isLoading || isParsing || isFetching) return true;
    if (activeTab === 'web') {
        return selectedSources.length === 0;
    }
    return !form.watch('sourceText')?.trim();
  }

  return (
    <Form {...form}>
      <div className="h-full flex flex-col">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Source Material</CardTitle>
            <CardDescription>Paste text, upload a file, or search the web to generate materials.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-6">
            <Tabs defaultValue="text" onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <TabsList>
                    <TabsTrigger value="text"><FileText/> Paste Text</TabsTrigger>
                    <TabsTrigger value="upload"><Upload/> Upload File</TabsTrigger>
                    <TabsTrigger value="web"><Search/> Search Web</TabsTrigger>
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
                        ) : fileName ? (
                            <div className="flex flex-col items-center gap-2">
                                <FileIcon className="h-8 w-8 text-primary" />
                                <p className="font-semibold">{fileName}</p>
                                <p className="text-xs text-muted-foreground">Click or drop another file to replace.</p>
                            </div>
                        ) : (
                             <div className="flex flex-col items-center gap-2">
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <p>Drag & drop a PDF, DOCX, PPTX, or TXT file here.</p>
                                <p className="text-xs text-muted-foreground">(Max file size: 15MB)</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
                 <TabsContent value="web" className="flex-1 mt-2 flex flex-col gap-4 min-h-0">
                    <div className="flex gap-2">
                        <Input placeholder="Enter a topic to search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleWebSearch()} />
                        <Button type="button" onClick={handleWebSearch} disabled={isSearching}><Search/> Search</Button>
                    </div>
                     <ScrollArea className="flex-1 border rounded-md">
                        {isSearching ? <div className="p-4 text-center"><Loader2 className="animate-spin"/></div> : (
                            <div className="p-2 space-y-2">
                                {searchResults.map((result, index) => (
                                    <div key={index} className="flex items-start gap-2 p-2 border rounded-md">
                                        <Checkbox 
                                            id={`source-${index}`}
                                            checked={selectedSources.includes(result.link)}
                                            onCheckedChange={() => handleToggleSource(result.link)}
                                        />
                                        <div className="grid gap-1.5 leading-none">
                                             <label htmlFor={`source-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                {result.title}
                                            </label>
                                            <p className="text-sm text-muted-foreground">{result.snippet}</p>
                                            <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{result.link}</a>
                                        </div>
                                    </div>
                                ))}
                                {searchResults.length === 0 && <p className="p-4 text-center text-muted-foreground">Search results will appear here.</p>}
                            </div>
                        )}
                     </ScrollArea>
                </TabsContent>
            </Tabs>
             <div className="grid md:grid-cols-2 gap-6 pt-6">
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
                            name="maxCards"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Max Number of Flashcards</FormLabel>
                                    <FormControl><Input type="number" min="5" max="50" {...field} /></FormControl>
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
            <Button type="button" onClick={handleFormSubmit} disabled={isGenerateDisabled()} className="w-full">
              {isLoading || isParsing || isFetching ? <Loader2 className="animate-spin" /> : <Wand2/>}
              {getButtonText()}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Form>
  );
}
