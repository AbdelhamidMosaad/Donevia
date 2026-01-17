'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Upload, FileText, Download, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { UserSettings } from '@/lib/types';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { generateLectureNotes, LectureNotesResponse } from '@/ai/flows/lecture-notes-flow';
import { exportLectureNotesToDocx } from '@/lib/lecture-notes-export';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { marked } from 'marked';

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

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ variant: 'destructive', title: 'File size exceeds 2MB limit.' });
        return;
    }
    
    setFileName(file.name);
    setSourceText('');
    setResult(null);
    setIsLoading(true);

    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const data = await pdfParse(arrayBuffer);
        setSourceText(data.text);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        setSourceText(value);
      } else {
        toast({ variant: 'destructive', title: 'Unsupported file type', description: 'Please upload a PDF or DOCX file.' });
      }
    } catch(e) {
        console.error("File parsing error:", e);
        toast({ variant: 'destructive', title: 'Failed to read file.' });
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
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to generate notes', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!result) return;
    exportLectureNotesToDocx(result.title, result.notes, selectedFont);
  }

  return (
    <div className="grid md:grid-cols-2 gap-6 h-full min-h-0">
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>1. Upload Your Document</CardTitle>
                <CardDescription>Upload a PDF or DOCX file (max 2MB).</CardDescription>
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
                    {isLoading && !result ? <Loader2 className="animate-spin" /> : <Sparkles />}
                    {isLoading && !result ? 'Processing...' : 'Generate Lecture Notes'}
                </Button>
            </CardFooter>
        </Card>
        
         <Card className="flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>2. Review & Export</CardTitle>
                    {result && <Button onClick={handleExport} variant="outline"><Download /> Export to Word</Button>}
                </div>
                <CardDescription>Your AI-generated lecture notes will appear below.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                 {result && (
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
                 )}
                 <ScrollArea className="h-[calc(100%-4rem)] rounded-md border p-4 bg-background">
                     {isLoading && result === null ? (
                        <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin h-8 w-8 text-primary" /><p className="ml-2">AI is generating notes...</p></div>
                    ) : result ? (
                        <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: marked(result.notes) as string }} style={{fontFamily: fonts.find(f => f.label === selectedFont)?.variable}}></div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                            <Wand2 className="h-12 w-12 mb-2" />
                            <p>Your generated notes will appear here.</p>
                        </div>
                    )}
                 </ScrollArea>
            </CardContent>
        </Card>
    </div>
  );
}
