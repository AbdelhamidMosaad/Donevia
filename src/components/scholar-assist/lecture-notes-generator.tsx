'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { Loader2, Download, RefreshCw, Save, FileText, Wand2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { generateLectureNotes, type LectureNotesResponse } from '@/ai/flows/generate-lecture-notes-flow';
import { saveAs } from 'file-saver';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import { Packer, Document, Paragraph, TextRun, HeadingLevel } from 'docx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

const availableFonts = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Source Sans 3', 'Nunito', 'Montserrat', 'Playfair Display', 'JetBrains Mono', 'Bahnschrift'
];

function NotesResultView({ result, onReset }: { result: LectureNotesResponse; onReset: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [docx, setDocx] = useState<any>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFilename, setExportFilename] = useState(result.title);
  const [exportFont, setExportFont] = useState('Inter');

  useEffect(() => {
    import('docx').then(module => {
      setDocx(module);
    });
  }, []);

  const handleExportWord = () => {
    if (!result || !docx) {
        toast({ variant: 'destructive', title: 'Export library not ready.' });
        return;
    };
    
    const { Packer, Document, Paragraph, TextRun, HeadingLevel } = docx;

    const docChildren = [
      new Paragraph({ text: result.title, heading: HeadingLevel.TITLE }),
      new Paragraph({ text: " " }),
    ];
    
    result.notes.split('\n').forEach(line => {
      if (line.startsWith('### ')) {
        docChildren.push(new Paragraph({ text: line.substring(4), heading: HeadingLevel.HEADING_3 }));
      } else if (line.startsWith('## ')) {
        docChildren.push(new Paragraph({ text: line.substring(3), heading: HeadingLevel.HEADING_2 }));
      } else if (line.startsWith('# ')) {
        docChildren.push(new Paragraph({ text: line.substring(2), heading: HeadingLevel.HEADING_1 }));
      } else if (line.startsWith('* ')) {
        docChildren.push(new Paragraph({ text: line.substring(2), bullet: { level: 0 } }));
      } else {
        docChildren.push(new Paragraph(line));
      }
    });

    const docInstance = new Document({ 
        sections: [{ children: docChildren }],
        styles: { default: { document: { run: { font: exportFont } } } }
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
          ...result.notes.split('\n').map(line => ({ type: 'paragraph', content: [{ type: 'text', text: line }] }))
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
        <Card className="flex-1 flex flex-col h-full">
          <CardHeader>
            <CardTitle>{result.title}</CardTitle>
            <CardDescription>Your AI-generated lecture notes are ready.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-4 -mr-4">
              <div className="space-y-6 prose prose-sm dark:prose-invert max-w-none"
                   dangerouslySetInnerHTML={{ __html: marked.parse(result.notes) }} />
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
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleExportWord} disabled={!docx}>
                            {docx ? 'Confirm Export' : 'Loading...'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
    );
}


export function LectureNotesGenerator() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LectureNotesResponse | null>(null);
  const [sourceText, setSourceText] = useState('');

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
                <CardDescription>Paste your source text below and let the AI create structured notes for you.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-6">
                <Textarea 
                    placeholder="Paste your document, article, or notes here..." 
                    className="flex-1 resize-y text-foreground" 
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                />
            </CardContent>
            <CardFooter>
                <Button type="button" onClick={handleGenerate} className="w-full">
                    <Wand2 className="mr-2 h-4 w-4"/>
                    Generate Notes
                </Button>
            </CardFooter>
        </Card>
    );
  }

  return <div className="flex flex-col h-full gap-6">{renderContent()}</div>;
}