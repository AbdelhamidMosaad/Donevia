
'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { InputForm, type InputFormValues } from './shared/input-form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '../ui/button';
import { Loader2, Download, RefreshCw, Save, FileText } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { generateLectureNotes, type LectureNotesResponse } from '@/ai/flows/generate-lecture-notes-flow';
import { saveAs } from 'file-saver';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { marked } from 'marked';
import { Packer, Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';

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
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportFilename, setExportFilename] = useState('');
  const [docx, setDocx] = useState<any>(null);

  useEffect(() => {
    import('docx').then(module => {
      setDocx(module);
    });
  }, []);

  useEffect(() => {
    if (result?.title) {
        setExportFilename(result.title);
    }
  }, [result]);

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
    
    const { Packer, Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } = docx;

    const docChildren: any[] = [
      new Paragraph({ text: result.title, heading: HeadingLevel.TITLE }),
    ];

    const lines = result.notes.split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.trim().startsWith('|')) {
        let tableLines = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        
        const processRow = (rowLine: string, isHeader = false) => {
            const cells = rowLine.split('|').slice(1, -1).map(cellText => {
                const textRun = new TextRun({ text: cellText.trim(), bold: isHeader });
                return new TableCell({ children: [new Paragraph({ children: [textRun] })] });
            });
            return new TableRow({ children: cells });
        };
        
        const headerRow = processRow(tableLines[0], true);
        const bodyRows = tableLines.slice(2).map(rowLine => processRow(rowLine, false));
        
        const table = new Table({
          rows: [headerRow, ...bodyRows],
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
        });
        docChildren.push(table);
        continue;
      }
      
      if (line.startsWith('### ')) {
        docChildren.push(new Paragraph({ text: line.substring(4), heading: HeadingLevel.HEADING_3 }));
      } else if (line.startsWith('## ')) {
        docChildren.push(new Paragraph({ text: line.substring(3), heading: HeadingLevel.HEADING_2 }));
      } else if (line.startsWith('# ')) {
        docChildren.push(new Paragraph({ text: line.substring(2), heading: HeadingLevel.HEADING_1 }));
      } else if (line.startsWith('* ')) {
        const textRuns = line.substring(2).split(/(\*\*.*?\*\*)/g).map(part => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return new TextRun({ text: part.slice(2, -2), bold: true });
          }
          return new TextRun(part);
        });
        docChildren.push(new Paragraph({ children: textRuns, bullet: { level: 0 } }));
      } else {
         const textRuns = line.split(/(\*\*.*?\*\*)/g).map(part => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return new TextRun({ text: part.slice(2, -2), bold: true });
          }
          return new TextRun(part);
        });
        docChildren.push(new Paragraph({ children: textRuns }));
      }
      i++;
    }

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
      content: result.notes.split('\n').map(line => {
        if (line.startsWith('# ')) {
          return { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: line.substring(2) }] };
        }
        if (line.startsWith('## ')) {
          return { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: line.substring(3) }] };
        }
         if (line.startsWith('### ')) {
          return { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: line.substring(4) }] };
        }
        if (line.startsWith('* ')) {
          return { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: line.substring(2) }] }] }]};
        }
        if (line.trim().startsWith('|')) { // Basic table support
             return { type: 'paragraph', content: [{ type: 'text', text: line }] };
        }
        
        const contentParts = line.split(/(\*\*.*?\*\*)/g).map(part => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return { type: 'text', text: part.slice(2, -2), marks: [{ type: 'bold' }] };
            }
            return { type: 'text', text: part };
        });

        return { type: 'paragraph', content: contentParts.filter(p => p.text) };
      }).filter(Boolean),
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
              <div className="space-y-6 prose prose-sm dark:prose-invert max-w-none"
                   dangerouslySetInnerHTML={{ __html: marked.parse(result.notes) }} />
            </ScrollArea>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="outline" onClick={handleReset}><RefreshCw/> Generate New</Button>
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
                            <Label htmlFor="font-select">Font</Label>
                             <Select value={exportFont} onValueChange={setExportFont}>
                                <SelectTrigger id="font-select"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    {availableFonts.map(font => <SelectItem key={font} value={font}>{font}</SelectItem>)}
                                </SelectContent>
                             </Select>
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
    return <InputForm onGenerate={handleGenerate} generationType="notes" />;
  }

  return <div className="flex flex-col h-full gap-6">{renderContent()}</div>;
}
