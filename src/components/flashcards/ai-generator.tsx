
'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Upload, FileIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { StudyMaterialRequest } from '@/lib/types';
import { addCardsToDeck } from '@/lib/flashcards';
import { generateStudyMaterial } from '@/ai/flows/generate-study-material';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { Packer, Document } from 'docx';


let pdfjs: any;

interface AIGeneratorProps {
  deckId: string;
}

export function AIGenerator({ deckId }: AIGeneratorProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('text');

  const { user } = useAuth();
  const { toast } = useToast();

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

  const parseDocx = async (file: File) => {
    const jszip = new JSZip();
    const zip = await jszip.loadAsync(file);
    const contentXml = await zip.file("word/document.xml")?.async("string");
    
    if (contentXml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(contentXml, "application/xml");
        
        let extractedText = "";
        const paragraphs = xmlDoc.getElementsByTagName('w:p');
        for(let i = 0; i < paragraphs.length; i++) {
            const textNodes = paragraphs[i].getElementsByTagName('w:t');
            let paraText = "";
            for (let j = 0; j < textNodes.length; j++) {
                paraText += textNodes[j].textContent;
            }
            extractedText += paraText + "\n";
        }
        
        if (extractedText.trim()) {
            setText(extractedText.trim());
            return;
        }
    }
    throw new Error("Could not extract any text from the DOCX file.");
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
        fullText += '\n\n';
    });

    if(fullText.trim()) {
      setText(fullText.trim());
    } else {
        throw new Error("Could not extract text from the PPTX file.");
    }
  };
  
  const parsePdf = async (file: File) => {
    if (!pdfjsLoaded) {
        toast({ variant: 'destructive', title: "PDF library not ready yet. Please try again."});
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
    setText(fullText);
  }

  const parseTxt = async (file: File) => {
      const textContent = await file.text();
      setText(textContent);
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
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || file.name.endsWith('.pptx')) {
            await parsePptx(file);
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
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
        'text/plain': ['.txt'],
    },
    multiple: false,
  });

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({ variant: 'destructive', title: 'Please enter or upload some text to generate cards from.' });
      return;
    }
    if (!user) return;
    
    setLoading(true);

    try {
      const requestPayload: StudyMaterialRequest = {
        sourceText: text,
        generationType: 'flashcards',
        flashcardsOptions: {
            numCards: 10,
            style: 'basic',
        }
      };

      const result = await generateStudyMaterial(requestPayload);
      const cards = result.flashcardContent;

      if (cards && cards.length > 0) {
        await addCardsToDeck(user.uid, deckId, cards);
        toast({
          title: `✓ ${cards.length} Cards Added!`,
          description: "AI-generated cards have been added to your deck.",
        });
        setText('');
        setFileName(null);
      } else {
        toast({ variant: 'destructive', title: 'No cards were generated. Try refining your text.' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error generating cards', description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary"/> AI Flashcard Generator</CardTitle>
        <CardDescription>
            Paste text or upload a file (PDF, DOCX, PPTX, TXT) and let AI create flashcards for you automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="text">Paste Text</TabsTrigger>
            <TabsTrigger value="upload">Upload File</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="mt-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste text here to generate flashcards..."
              className="w-full min-h-[150px]"
              rows={6}
            />
          </TabsContent>
          <TabsContent value="upload" className="mt-4">
            <div {...getRootProps()} className={`h-40 border-2 border-dashed rounded-lg flex items-center justify-center text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                <input {...getInputProps()} />
                {isParsing ? (
                    <div className="flex flex-col items-center gap-2"><Loader2 className="animate-spin h-8 w-8 text-primary" /><p>Processing file...</p></div>
                ) : fileName ? (
                    <div className="flex flex-col items-center gap-2"><FileIcon className="h-8 w-8 text-primary" /><p className="font-semibold">{fileName}</p><p className="text-xs text-muted-foreground">Drop another file to replace.</p></div>
                ) : (
                    <div className="flex flex-col items-center gap-2"><Upload className="h-8 w-8 text-muted-foreground" /><p>Drag & drop a file here, or click to select</p></div>
                )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerate} disabled={loading || isParsing || !text.trim()}>
          {loading || isParsing ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {loading ? 'Generating...' : (isParsing ? 'Processing...' : 'Generate Cards')}
        </Button>
      </CardFooter>
    </Card>
  );
}
