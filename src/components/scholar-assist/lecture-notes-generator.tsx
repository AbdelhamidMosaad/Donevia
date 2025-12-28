
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { InputForm, type InputFormValues } from './shared/input-form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { Loader2, Download, RefreshCw, Save, FileText } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { generateLectureNotes, type LectureNotesResponse } from '@/ai/flows/lecture-notes-flow';
import { saveAs } from 'file-saver';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '../ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { marked } from 'marked';
import { type Packer, Document, Paragraph, TextRun, HeadingLevel } from 'docx';


const availableFonts = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Source Sans 3', 'Nunito', 'Montserrat', 'Playfair Display', 'JetBrains Mono', 'Bahnschrift'
];

export function LectureNotesGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<LectureNotesResponse | null>(null);
  const [exportFont, setExportFont] = useState('Inter');
  const [docx, setDocx] = useState<any>(null);

  useEffect(() => {
    import('docx').then(module => {
      setDocx(module);
    });
  }, []);

  const handleGenerate = async (values: InputFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const data = await generateLectureNotes({ sourceText: values.sourceText });
      setResult(data);
    } catch (error) {
      console.error("Note generation failed:", error);
      toast({ variant: 'destructive', title: 'Generation Failed', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  const handleExportWord = () => {
    if (!result || !docx) {
        toast({ variant: 'destructive', title: 'Export library not ready.' });
        return;
    };
    
    const { Packer, Document, Paragraph, TextRun, HeadingLevel } = docx;

    const docChildren = [
      new Paragraph({ text: result.title, heading: HeadingLevel.TITLE }),
      new Paragraph({ text: result.overview, style: "IntenseQuote" }),
      new Paragraph(result.notes),
      new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2 }),
      new Paragraph(result.summary)
    ];

    const docInstance = new Document({ 
        sections: [{ children: docChildren }],
        styles: {
            default: {
                document: {
                    run: { font: exportFont }
                }
            }
        }
    });

    Packer.toBlob(docInstance).then((blob: Blob) => {
        saveAs(blob, `${result.title.replace(/ /g, '_')}_notes.docx`);
    });
    toast({ title: '✓ Exporting as Word document' });
  };
  
  const handleSaveToDocs = async () => {
    if (!user || !result) return;
    setIsSaving(true);
    
    const content = `<h1>${result.title}</h1><blockquote>${result.overview}</blockquote><hr>${result.notes}<hr><h2>Summary</h2><p>${result.summary}</p>`;
    const parsedContent = await marked.parse(content);

    // This is a simplified conversion. For a true TipTap conversion, a more complex parser is needed.
    const tipTapContent = {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: parsedContent.replace(/<[^>]*>/g, '\n') }] }] // Basic text extraction
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
          <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          <h3 className="text-xl font-semibold font-headline">Generating Your Notes...</h3>
          <p className="text-muted-foreground">The AI is processing your document. This may take a moment.</p>
        </div>
      );
    }
    if (result) {
      return (
        <Card className="flex-1 flex flex-col h-full">
          <CardHeader>
            <CardTitle>{result.title}</CardTitle>
            <CardDescription>Your AI-generated lecture notes are ready.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-4 -mr-4">
              <div className="space-y-6 prose prose-sm dark:prose-invert max-w-none">
                <blockquote className="border-l-4 pl-4 italic">{result.overview}</blockquote>
                <div dangerouslySetInnerHTML={{ __html: marked(result.notes) }} />
                <h3>Summary</h3>
                <p>{result.summary}</p>
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="outline" onClick={handleReset}><RefreshCw/> Generate New</Button>
            <Button onClick={handleSaveToDocs} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save/>}
                Save to Docs
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline"><Download/> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Export as Word (.docx)</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                      <div className="p-2 space-y-2">
                        <label className="text-xs font-medium">Select Font</label>
                         <Select value={exportFont} onValueChange={setExportFont}>
                           <SelectTrigger><SelectValue/></SelectTrigger>
                           <SelectContent>
                             {availableFonts.map(font => <SelectItem key={font} value={font}>{font}</SelectItem>)}
                           </SelectContent>
                         </Select>
                         <Button className="w-full" size="sm" onClick={handleExportWord} disabled={!docx}>
                           {docx ? 'Confirm Export' : 'Loading...'}
                         </Button>
                      </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardFooter>
        </Card>
      );
    }
    return <InputForm onGenerate={handleGenerate} generationType="notes" />;
  }

  return <div className="flex flex-col h-full gap-6">{renderContent()}</div>;
}
