'use client';

import React, { useState, useCallback, ChangeEvent, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Upload, FileText, Download, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { UserSettings } from '@/lib/types';
import { generateLectureNotes, LectureNotesResponse } from '@/ai/flows/lecture-notes-flow';
import { exportLectureNotesToDocx } from '@/lib/lecture-notes-export';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { marked } from 'marked';
import { jsPDF } from 'jspdf';

type Font = UserSettings['font'];
const fonts: { name: Font; label: string; variable: string }[] = [
    { name: 'inter', label: 'Inter', variable: 'Inter, sans-serif' },
    { name: 'roboto', label: 'Roboto', variable: 'Roboto, sans-serif' },
    { name: 'open-sans', label: 'Open Sans', variable: 'Open Sans, sans-serif' },
    { name: 'lato', label: 'Lato', variable: 'Lato, sans-serif' },
    { name: 'poppins', label: 'Poppins', variable: 'Poppins, sans-serif' },
    { name: 'source-sans-pro', label: 'Source Sans Pro', variable: 'Source Sans Pro, sans-serif' },
    { name: 'nunito', label: 'Nunito', variable: 'Nunito, sans-serif' },
    { name: 'montserrat', label: 'Montserrat', variable: 'Montserrat, sans-serif' },
    { name: 'playfair-display', label: 'Playfair Display', variable: 'Playfair Display, serif' },
    { name: 'jetbrains-mono', label: 'JetBrains Mono', variable: 'JetBrains Mono, monospace' },
    { name: 'bahnschrift', label: 'Bahnschrift', variable: 'Bahnschrift, sans-serif' },
];

export function LectureNotesGenerator() {
  const [sourceText, setSourceText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LectureNotesResponse | null>(null);
  const [selectedFont, setSelectedFont] = useState<string>('Calibri');
  const { toast } = useToast();
  const { user } = useAuth();
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) { // 15MB limit
        toast({ variant: 'destructive', title: 'File size exceeds 15MB limit.' });
        return;
    }
    
    setFileName(file.name);
    setSourceText('');
    setResult(null);
    setIsLoading(true);

    try {
      if (file.type === 'application/pdf') {
        const pdfjs = await import('pdfjs-dist');
        // @ts-ignore
        const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n\n';
        }
        setSourceText(fullText);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const mammoth = (await import('mammoth')).default;
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        setSourceText(value);
      } else {
        toast({ variant: 'destructive', title: 'Unsupported file type', description: 'Please upload a PDF or DOCX file.' });
      }
    } catch(e: any) {
        console.error("File parsing error:", e);
        toast({ variant: 'destructive', title: 'Failed to read file.', description: e.message });
    } finally {
        setIsLoading(false);
    }

  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
  });
  
  const handleGenerate = async () => {
    if (!sourceText) {
      toast({ variant: 'destructive', title: 'Please upload a document first.' });
      return;
    }
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const notes = await generateLectureNotes({ sourceText });
      setResult(notes);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed to generate notes', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!result) return;
    exportLectureNotesToDocx(result.title, result.notes, selectedFont);
  }

  const handleReset = () => {
    setSourceText('');
    setFileName('');
    setResult(null);
    setIsLoading(false);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <h3 className="text-xl font-semibold font-headline">Generating Your Notes...</h3>
        <p className="text-muted-foreground">The AI is hard at work. This may take a moment.</p>
      </div>
    );
  }
  
  if (result) {
    return (
      <Card className="flex-1 flex flex-col h-full">
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle>Your AI-Generated Lecture Notes</CardTitle>
                <div className="flex items-center gap-2">
                    <Button onClick={handleReset} variant="outline">Generate New</Button>
                    <Button onClick={handleExport}><Download /> Export to Word</Button>
                </div>
            </div>
            <CardDescription>Review the generated notes and export them.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-2 mb-4">
                <Label htmlFor="font-select">Export Font</Label>
                <Select value={selectedFont} onValueChange={setSelectedFont}>
                    <SelectTrigger id="font-select" className="w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {fonts.map(f => <SelectItem key={f.name} value={f.label} style={{fontFamily: f.variable}}>{f.label}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <ScrollArea className="h-[calc(100%-4rem)] rounded-md border p-4 bg-background">
                <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: marked(result.notes) as string }} style={{fontFamily: fonts.find(f => f.label === selectedFont)?.variable}}></div>
             </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>Upload Your Document</CardTitle>
                <CardDescription>Upload a PDF or DOCX file (max 15MB).</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4">
                <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer ${isDragActive ? 'border-primary' : ''}`}>
                    <input {...getInputProps()} />
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">Drag & drop your file here, or click to select.</p>
                </div>
                {fileName && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <FileText className="h-5 w-5 text-primary" />
                        <span className="font-medium truncate">{fileName}</span>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleGenerate} disabled={isLoading || !sourceText} className="w-full">
                    {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    {isLoading ? 'Processing...' : 'Generate Lecture Notes'}
                </Button>
            </CardFooter>
        </Card>
    </div>
  );
}