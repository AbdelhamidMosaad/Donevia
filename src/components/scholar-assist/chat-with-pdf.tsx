
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Send, Copy, FileText, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useDropzone } from 'react-dropzone';
import { ScrollArea } from '../ui/scroll-area';
import { chatWithPdf } from '@/ai/flows/chat-with-pdf-flow';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { marked } from 'marked';

let pdfjs: any;

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export function ChatWithPdf() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [pdfText, setPdfText] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [question, setQuestion] = useState('');
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

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
        setPdfText(fullText);
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        if (file.size > 15 * 1024 * 1024) {
            toast({ variant: "destructive", title: "File too large", description: "Please upload a PDF under 15MB." });
            return;
        }

        setFileName(file.name);
        setIsParsing(true);
        setPdfText(null);
        setChatHistory([]);
        toast({ title: `Parsing ${file.name}...` });

        try {
            await parsePdf(file);
            toast({ title: "✓ PDF Processed", description: "You can now ask questions about the document." });
        } catch (error) {
            toast({ variant: 'destructive', title: 'File Parsing Failed' });
            setFileName(null);
        } finally {
            setIsParsing(false);
        }
    }, [toast, pdfjsLoaded]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });

    const handleAskQuestion = async () => {
        if (!question.trim() || !pdfText) return;

        const newHistory: Message[] = [...chatHistory, { role: 'user', content: question }];
        setChatHistory(newHistory);
        setIsLoading(true);
        setQuestion('');

        try {
            const res = await chatWithPdf({ pdfText, question });
            setChatHistory([...newHistory, { role: 'assistant', content: res.answer }]);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error getting answer' });
            setChatHistory(newHistory); // Revert to previous history on error
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = (content: string) => {
        navigator.clipboard.writeText(content);
        toast({ title: "Copied to clipboard!" });
    }

    return (
        <div className="flex flex-col gap-6 h-full min-h-0">
            <Card>
                <CardHeader>
                    <CardTitle>Upload Document</CardTitle>
                    <CardDescription>Upload a PDF file (max 15MB) to start chatting.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div {...getRootProps()} className={`h-40 border-2 border-dashed rounded-lg flex items-center justify-center text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                        <input {...getInputProps()} />
                        {isParsing ? (
                            <div className="flex flex-col items-center gap-2"><Loader2 className="animate-spin h-8 w-8 text-primary" /><p>Processing file...</p></div>
                        ) : fileName ? (
                            <div className="flex flex-col items-center gap-2"><FileText className="h-8 w-8 text-primary" /><p className="font-semibold">{fileName}</p><p className="text-xs text-muted-foreground">Drop another file to replace.</p></div>
                        ) : (
                            <div className="flex flex-col items-center gap-2"><Upload className="h-8 w-8 text-muted-foreground" /><p>Drag & drop a PDF here, or click to select</p></div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="flex-1 flex flex-col h-full min-h-0">
                <CardHeader>
                    <CardTitle>Chat with your PDF</CardTitle>
                    <CardDescription>Ask questions about the content of your uploaded document.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col min-h-0">
                    <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4 -mr-4">
                        <div className="space-y-4">
                            {chatHistory.map((message, index) => (
                                <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                                    {message.role === 'assistant' && <Avatar className="h-8 w-8"><AvatarFallback><Bot/></AvatarFallback></Avatar>}
                                    <div className={`rounded-lg p-3 max-w-lg group relative ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked(message.content) as string }} />
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopy(message.content)}><Copy className="h-3 w-3"/></Button>
                                        </div>
                                    </div>
                                    {message.role === 'user' && <Avatar className="h-8 w-8"><AvatarImage src={user?.photoURL || undefined} /><AvatarFallback>{user?.displayName?.[0]}</AvatarFallback></Avatar>}
                                </div>
                            ))}
                             {isLoading && (
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-8 w-8"><AvatarFallback><Bot/></AvatarFallback></Avatar>
                                    <div className="rounded-lg p-3 max-w-lg bg-muted flex items-center gap-2">
                                        <Loader2 className="animate-spin h-4 w-4"/> Thinking...
                                    </div>
                                </div>
                             )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardContent className="pt-0">
                    <div className="flex items-center gap-2 pt-4 border-t">
                        <Input
                            placeholder={pdfText ? "Ask a question..." : "Please upload a PDF first"}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                            disabled={!pdfText || isLoading}
                        />
                        <Button onClick={handleAskQuestion} disabled={!pdfText || isLoading || !question.trim()}>
                            <Send />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
