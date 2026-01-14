
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { Loader2, Download, RefreshCw, Save, FileText, Wand2, Upload, FileIcon } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { generateLectureNotes, type LectureNotesResponse } from '@/ai/flows/generate-lecture-notes-flow';
import { saveAs } from 'file-saver';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import { Packer, Document as DocxDocument, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

let pdfjs: any;

const fonts = [
  'Arial', 'Calibri', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'
];

function NotesResultView({ result, onReset }: { result: LectureNotesResponse; onReset: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFilename, setExportFilename] = useState(result.title);
  const [exportFont, setExportFont] = useState('Arial');


  const handleExportWord = async () => {
    if (!result) {
        toast({ variant: 'destructive', title: 'Export library not ready.' });
        return;
    };
    
    const createStyledParagraph = (text: string, options: any = {}) => {
        return new Paragraph({
            children: [new TextRun({ text, font: exportFont })],
            ...options,
        });
    }

    const docChildren = [
      createStyledParagraph(result.title, { heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
      createStyledParagraph(" "),
      createStyledParagraph("Learning Objectives", { heading: HeadingLevel.HEADING_1 }),
      ...result.learningObjectives.map(obj => createStyledParagraph(obj, { bullet: { level: 0 } })),
      createStyledParagraph(" "),
      createStyledParagraph("Detailed Notes", { heading: HeadingLevel.HEADING_1 }),
    ];
    
    result.notes.split('\n').forEach(line => {
      if (line.startsWith('### ')) {
        docChildren.push(createStyledParagraph(line.substring(4), { heading: HeadingLevel.HEADING_3 }));
      } else if (line.startsWith('## ')) {
        docChildren.push(createStyledParagraph(line.substring(3), { heading: HeadingLevel.HEADING_2 }));
      } else if (line.startsWith('# ')) {
        docChildren.push(createStyledParagraph(line.substring(2), { heading: HeadingLevel.HEADING_1 }));
      } else if (line.startsWith('* ')) {
        docChildren.push(createStyledParagraph(line.substring(2), { bullet: { level: 0 } }));
      } else {
        docChildren.push(createStyledParagraph(line));
      }
    });
    
    docChildren.push(createStyledParagraph(" "));
    docChildren.push(createStyledParagraph("Learning Summary", { heading: HeadingLevel.HEADING_1 }));
    docChildren.push(createStyledParagraph(result.learningSummary));


    const docInstance = new DocxDocument({ 
        sections: [{ children: docChildren }],
        styles: {
            default: {
                document: {
                    run: {
                        font: exportFont,
                    },
                },
            },
        },
    });

    Packer.toBlob(docInstance).then((blob: Blob) => {
        saveAs(blob, `${exportFilename.replace(/ /g, '_')}.docx`);
    });
    toast({ title: '✓ Exporting as Word document' });
    setIsExportDialogOpen(false);
  };
  
  const handleSaveToDocs = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    
    const tipTapContent = {
      type: 'doc',
      content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: result.title }] },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: "Learning Objectives" }] },
          { type: 'bulletList', content: result.learningObjectives.map(obj => ({ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: obj }] }] })) },
          { type: 'horizontalRule' },
          ...result.notes.split('\n').map(line => {
              if (line.startsWith('# ')) return { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: line.substring(2) }] };
              if (line.startsWith('## ')) return { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: line.substring(3) }] };
              if (line.startsWith('### ')) return { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: line.substring(4) }] };
              if (line.startsWith('* ')) return { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: line.substring(2) }] }] }] };
              return { type: 'paragraph', content: line ? [{ type: 'text', text: line }] : [] };
          }),
           { type: 'horizontalRule' },
          { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: "Learning Summary" }] },
          { type: 'paragraph', content: [{ type: 'text', text: result.learningSummary }] },
      ]
    };

    try {
        const docRef = await addDoc(collection(db, 'users', user.uid, 'docs'), {
            title: result.title,
            content: tipTapContent,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            folderId: null,
        });
        toast({ title: '✓ Saved to Docs' });
        router.push(`/docs/${docRef.id}`);
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error saving to Docs' });
    } finally {
        setIsSaving(false);
    }
  }

    return (
      <>
        <Card className="flex-1 flex flex-col h-full">
          <CardHeader>
            <CardTitle>{result.title}</CardTitle>
            <CardDescription>Your AI-generated lecture notes are ready.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-4 -mr-4">
              <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Learning Objectives</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            {result.learningObjectives.map((obj, i) => <li key={i}>{obj}</li>)}
                        </ul>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: marked.parse(result.notes) }} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Learning Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{result.learningSummary}</p>
                    </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="outline" onClick={onReset}><RefreshCw/> Generate New</Button>
            <Button onClick={handleSaveToDocs} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save/>}
                Save to Docs
            </Button>
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline"><Download/> Export</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Export Options</DialogTitle>
                        <DialogDescription>Set your preferred options for the Word document.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="filename">File Name</Label>
                            <Input id="filename" value={exportFilename} onChange={(e) => setExportFilename(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                          <Label htmlFor="font-select">Font Family</Label>
                          <Select value={exportFont} onValueChange={setExportFont}>
                            <SelectTrigger id="font-select"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {fonts.map(font => <SelectItem key={font} value={font}>{font}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleExportWord}>
                            Confirm Export
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </>
    );
}


export function LectureNotesGenerator() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LectureNotesResponse | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [activeTab, setActiveTab] = useState('text');
  
  const [isParsing, setIsParsing] = useState(false);
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

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

  const handleGenerate = async () => {
    if (!sourceText.trim()) {
        toast({ variant: 'destructive', title: 'Source text cannot be empty.' });
        return;
    }
    setIsLoading(true);
    setResult(null);

    try {
      const data = await generateLectureNotes({ sourceText });
      setResult(data);
    } catch (error) {
      console.error("Note generation failed:", error);
      toast({ variant: 'destructive', title: 'Generation Failed', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };
  
    const parseDocx = async (file: File) => {
    const jszip = new JSZip();
    const zip = await jszip.loadAsync(file);
    const contentXml = await zip.file("word/document.xml")?.async("string");
    
    if (contentXml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(contentXml, "application/xml");
        const paragraphs = xmlDoc.getElementsByTagName('w:p');
        let extractedText = "";
        for(let i = 0; i < paragraphs.length; i++) {
            extractedText += paragraphs[i].textContent + "\n";
        }
        if (extractedText.trim()) {
            setSourceText(extractedText.trim());
            return;
        }
    }
    throw new Error("Could not extract any text from the DOCX file.");
  }
  
  const parsePdf = async (file: File) => {
    if (!pdfjsLoaded) {
        toast({ variant: 'destructive', title: "PDF library not loaded yet. Please try again."});
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
    setSourceText(fullText);
  }

  const parseTxt = async (file: File) => {
      const text = await file.text();
      setSourceText(text);
  }

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      if (file.size > 15 * 1024 * 1024) {
          toast({ variant: "destructive", title: "File too large", description: "Please upload a file under 15MB."});
          return;
      }
      
      setFileName(file.name);
      setIsParsing(true);
      toast({ title: `Parsing ${file.name}...` });

      try {
        if (file.type === 'application/pdf' && pdfjsLoaded) {
            await parsePdf(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            await parseDocx(file);
        } else if (file.type === 'text/plain') {
            await parseTxt(file);
        } else {
           throw new Error("Unsupported file type or required library not loaded.");
        }
        
        toast({ title: "✓ File Processed", description: "Text has been extracted." });
        setActiveTab('text');
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'File Parsing Failed', description: (error as Error).message });
        setFileName(null);
      } finally {
        setIsParsing(false);
      }
  }, [toast, pdfjsLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
        'application/pdf': ['.pdf'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'text/plain': ['.txt'],
    },
    multiple: false,
  });

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          <h3 className="text-xl font-semibold font-headline">Generating Your Notes...</h3>
          <p className="text-muted-foreground">The AI is processing your text. This may take a moment.</p>
        </div>
      );
    }
    if (result) {
      return <NotesResultView result={result} onReset={() => setResult(null)} />;
    }
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Generate Lecture Notes</CardTitle>
                <CardDescription>Paste text or upload a document and let the AI create structured notes for you.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-6">
                 <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <TabsList>
                        <TabsTrigger value="text"><FileText/> Paste Text</TabsTrigger>
                        <TabsTrigger value="upload"><Upload/> Upload File</TabsTrigger>
                    </TabsList>
                    <TabsContent value="text" className="flex-1 mt-2">
                        <Textarea 
                            placeholder="Paste your document, article, or notes here..." 
                            className="flex-1 resize-y text-foreground h-full" 
                            value={sourceText}
                            onChange={(e) => setSourceText(e.target.value)}
                        />
                    </TabsContent>
                    <TabsContent value="upload" className="flex-1 mt-2">
                        <div {...getRootProps()} className={`h-full border-2 border-dashed rounded-lg flex items-center justify-center text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                            <input {...getInputProps()} />
                            {isParsing ? (
                                <div className="flex flex-col items-center gap-2"><Loader2 className="animate-spin h-8 w-8 text-primary" /><p>Processing file...</p></div>
                            ) : fileName ? (
                                <div className="flex flex-col items-center gap-2"><FileIcon className="h-8 w-8 text-primary" /><p className="font-semibold">{fileName}</p><p className="text-xs text-muted-foreground">Click or drop another file to replace.</p></div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Upload className="h-8 w-8 text-muted-foreground" />
                                    <p>Drag & drop a PDF, DOCX, or TXT file here.</p>
                                    <p className="text-xs text-muted-foreground">(Max file size: 15MB)</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
            <CardFooter>
                <Button type="button" onClick={handleGenerate} className="w-full" disabled={isParsing || !sourceText.trim()}>
                    <Wand2 className="mr-2 h-4 w-4"/>
                    {isParsing ? 'Processing...' : 'Generate Notes'}
                </Button>
            </CardFooter>
        </Card>
    );
  }

  return <div className="flex flex-col h-full gap-6">{renderContent()}</div>;
}
