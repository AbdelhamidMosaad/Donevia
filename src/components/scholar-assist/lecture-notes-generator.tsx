
'use client';

import { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { InputForm, type InputFormValues } from './shared/input-form';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { StudyMaterialRequest, StudyMaterialResponse, Flashcard } from '@/lib/types';
import { Button } from '../ui/button';
import { Loader2, Copy, Download, Save, FileText } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { addDoc as addFirestoreDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';
import React from 'react';
import { generateStudyMaterial } from '@/ai/flows/generate-study-material';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, ShadingType } from 'docx';
import { saveAs } from 'file-saver';
import { Dialog, DialogHeader, DialogTitle, DialogContent, DialogFooter, DialogClose, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface LectureNotesGeneratorProps {
  result: StudyMaterialResponse | null;
  setResult: (result: StudyMaterialResponse | null) => void;
}

function InlineMarkdown({ text }: { text: string }) {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <strong key={i}>{part.slice(2, -2)}</strong>;
                }
                return part;
            })}
        </>
    );
}

const fonts = [
    { name: 'Arial', value: 'Arial' },
    { name: 'Calibri', value: 'Calibri' },
    { name: 'Times New Roman', value: 'Times New Roman' },
    { name: 'Courier New', value: 'Courier New' },
    { name: 'Verdana', value: 'Verdana' },
    { name: 'Georgia', value: 'Georgia' },
];


export function LectureNotesGenerator({ result, setResult }: LectureNotesGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingToDocs, setIsSavingToDocs] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFileDialogOpen, setIsFileDialogOpen] = useState(false);
  const [fileName, setFileName] = useState('');
  const [selectedFont, setSelectedFont] = useState('Arial');
  const exportRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (values: InputFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const requestPayload: StudyMaterialRequest = {
        sourceText: values.sourceText,
        generationType: 'notes',
        notesOptions: {
          style: values.noteStyle,
          complexity: values.complexity,
        },
      };

      const data = await generateStudyMaterial(requestPayload);
      setResult(data);
      setFileName(data.title);

    } catch (error) {
      console.error("Notes generation failed:", error);
      toast({ variant: 'destructive', title: 'Generation Failed', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
      setResult(null);
  }

  const convertNotesToText = () => {
    if (!result?.notesContent || typeof result.notesContent === 'string') {
        return typeof result?.notesContent === 'string' ? result.notesContent : '';
    };
    
    let text = `${result.title}\n\n`;
    text += `${result.notesContent.introduction}\n\n`;
    result.notesContent.sections.forEach(section => {
        text += `## ${section.heading}\n\n`;
        section.content.forEach(item => {
            if (item.type === 'paragraph') {
                text += `${item.content}\n\n`;
            } else if (Array.isArray(item.content)) {
                const prefix = item.type === 'bullet-list' ? '- ' : '1. ';
                item.content.forEach(listItem => text += `${prefix}${listItem}\n`);
                text += '\n';
            }
        });
        
        if (section.table) {
            text += `\n| ${section.table.headers.join(' | ')} |\n`;
            text += `| ${section.table.headers.map(() => '---').join(' | ')} |\n`;
            section.table.rows.forEach(row => {
                text += `| ${row.join(' | ')} |\n`;
            });
        }

        if (section.subsections) {
            section.subsections.forEach(subsection => {
                text += `\n### ${subsection.subheading}\n`;
                subsection.content.forEach(item => {
                   if (item.type === 'paragraph') {
                        text += `${item.content}\n\n`;
                    } else if (Array.isArray(item.content)) {
                        const prefix = item.type === 'bullet-list' ? '  - ' : '  1. ';
                        item.content.forEach(listItem => text += `${prefix}${listItem}\n`);
                        text += '\n';
                    }
                });
                 if (subsection.table) {
                    text += `\n| ${subsection.table.headers.join(' | ')} |\n`;
                    text += `| ${subsection.table.headers.map(() => '---').join(' | ')} |\n`;
                    subsection.table.rows.forEach(row => {
                        text += `| ${row.join(' | ')} |\n`;
                    });
                }
            });
        }
        text += '\n';
        if (section.addDividerAfter) {
            text += '---\n\n';
        }
    });

    return text;
  }
  
  const handleCopy = () => {
    const fullText = convertNotesToText();
    navigator.clipboard.writeText(fullText);
    toast({ title: '✓ Copied to clipboard!' });
  };
  
 const handleExportWord = () => {
    if (!result?.notesContent || typeof result.notesContent === 'string') {
        toast({ variant: 'destructive', title: 'Cannot export empty notes.' });
        return;
    }
    
    setIsExporting(true);

    const { title, notesContent } = result;

    const createTextRuns = (text: string, isKeyPoint: boolean = false) => {
        return text.split(/(\*\*.*?\*\*)/g).map(part => {
            const isBoldPart = part.startsWith('**') && part.endsWith('**');
            return new TextRun({
                text: isBoldPart ? part.slice(2, -2) : part,
                bold: isBoldPart || isKeyPoint,
                font: selectedFont,
            });
        });
    };

    const processContentItems = (items: any[], level: number = 0) => {
        const docxElements: (Paragraph | DocxTable)[] = [];

        items.forEach(item => {
            const isKeyPoint = !!item.isKeyPoint;
            
            if (item.type === 'paragraph' && typeof item.content === 'string') {
                 const shading = isKeyPoint ? { type: ShadingType.CLEAR, fill: "E5E7EB" } : undefined;
                docxElements.push(new Paragraph({ children: createTextRuns(item.content, isKeyPoint), shading }));
            } else if (item.type === 'bullet-list' && Array.isArray(item.content)) {
                item.content.forEach((listItem: string) => {
                     docxElements.push(new Paragraph({ children: createTextRuns(listItem, isKeyPoint), bullet: { level: level } }));
                });
                docxElements.push(new Paragraph("")); // Space after list
            } else if (item.type === 'numbered-list' && Array.isArray(item.content)) {
                 item.content.forEach((listItem: string) => {
                    docxElements.push(new Paragraph({ children: createTextRuns(listItem, isKeyPoint), numbering: { reference: "default-numbering", level: level } }));
                });
                docxElements.push(new Paragraph(""));
            }
        });
        return docxElements;
    };
    
    const docChildren: any[] = [
        new Paragraph({ text: title, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
        new Paragraph({ children: [new TextRun({ text: notesContent.introduction, italics: true})], spacing: { after: 200 } }),
    ];

    notesContent.sections.forEach(section => {
        docChildren.push(new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_2, spacing: { before: 200 } }));
        docChildren.push(...processContentItems(section.content));
        
        if (section.table) {
            docChildren.push(new DocxTable({
                rows: [
                    new DocxTableRow({
                        children: section.table.headers.map(header => new DocxTableCell({
                            children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
                        })),
                    }),
                    ...section.table.rows.map(row => new DocxTableRow({
                        children: row.map(cell => new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({text: cell})]})] }))
                    })),
                ],
                width: { size: 100, type: WidthType.PERCENTAGE },
            }));
        }

        if (section.subsections) {
            section.subsections.forEach(subsection => {
                docChildren.push(new Paragraph({ text: subsection.subheading, heading: HeadingLevel.HEADING_3, spacing: { before: 200 } }));
                docChildren.push(...processContentItems(subsection.content, 1));
                 if (subsection.table) {
                    docChildren.push(new DocxTable({
                        rows: [
                            new DocxTableRow({
                                children: subsection.table.headers.map(header => new DocxTableCell({
                                    children: [new Paragraph({ children: [new TextRun({ text: header, bold: true })] })],
                                })),
                            }),
                            ...subsection.table.rows.map(row => new DocxTableRow({
                                children: row.map(cell => new DocxTableCell({ children: [new Paragraph({ children: [new TextRun({text: cell})]})] }))
                            })),
                        ],
                        width: { size: 100, type: WidthType.PERCENTAGE },
                    }));
                }
            });
        }
        if (section.addDividerAfter) {
            docChildren.push(new Paragraph({ text: '', border: { bottom: { color: "auto", space: 1, value: "single", size: 6 } }, spacing: { before: 200, after: 200 } }));
        }
    });

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: { font: selectedFont }
                }
            }
        },
        numbering: {
            config: [
                {
                    reference: "default-numbering",
                    levels: [
                        { level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START },
                        { level: 1, format: "lowerLetter", text: "%2)", alignment: AlignmentType.START, indent: { left: 720 } },
                    ],
                },
            ],
        },
        sections: [{ children: docChildren }],
    });

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `${fileName.replace(/ /g, '_')}.docx`);
        toast({ title: '✓ Exporting as Word document' });
        setIsExporting(false);
        setIsFileDialogOpen(false);
    });
  };

  const handleExportPDF = async () => {
    if (!exportRef.current) {
        toast({ variant: 'destructive', title: 'Export failed', description: 'Could not find the content to export.' });
        return;
    }
    setIsExporting(true);
    toast({ title: 'Generating PDF...', description: 'Please wait.' });

    try {
        const canvas = await html2canvas(exportRef.current, {
            scale: 2, // Higher scale for better quality
            useCORS: true,
            windowWidth: exportRef.current.scrollWidth,
            windowHeight: exportRef.current.scrollHeight
        });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasHeight / canvasWidth;
        
        const imgWidth = pdfWidth - 20; // with margins
        const imgHeight = imgWidth * ratio;
        
        let heightLeft = imgHeight;
        let position = 10; // top margin

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);

        while (heightLeft > 0) {
            position = heightLeft - imgHeight + 10;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdfHeight - 20);
        }

        pdf.save(`${fileName.replace(/ /g, '_')}.pdf`);
        toast({ title: '✓ PDF Exported Successfully' });
    } catch (e) {
        console.error("PDF Export failed:", e);
        toast({ variant: 'destructive', title: 'PDF Export Failed', description: 'There was an issue generating the PDF.'});
    } finally {
        setIsExporting(false);
    }
  };


  const handleSaveToDocs = async () => {
    if (!user || !result || !result.notesContent) {
      toast({ variant: 'destructive', title: 'Could not save document.' });
      return;
    }

    setIsSavingToDocs(true);

    let contentJSON;
    if (typeof result.notesContent === 'string') {
        contentJSON = {
            type: 'doc',
            content: result.notesContent.split('\n').map(paragraph => ({
                type: 'paragraph',
                content: paragraph ? [{ type: 'text', text: paragraph }] : [],
            })),
        };
    } else {
        const tiptapContent = result.notesContent.sections.flatMap(section => {
            const sectionContent: any[] = [
                { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: `${section.heading}` }] },
                ...section.content.flatMap(item => {
                    if(item.type === 'paragraph') {
                        return [{ type: 'paragraph', content: [{ type: 'text', text: item.content }] }];
                    }
                    return [{
                        type: item.type === 'bullet-list' ? 'bulletList' : 'orderedList',
                        content: (item.content as string[]).map(listItem => ({
                            type: 'listItem',
                            content: [{ type: 'paragraph', content: [{ type: 'text', text: listItem }] }]
                        }))
                    }];
                })
            ];
             if (section.table) {
                sectionContent.push({
                    type: 'table',
                    content: [
                        { type: 'tableRow', content: section.table.headers.map(header => ({ type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: header }] }] })) },
                        ...section.table.rows.map(row => ({ type: 'tableRow', content: row.map(cell => ({ type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: cell }] }] })) }))
                    ]
                });
            }

            if (section.subsections) {
                section.subsections.forEach(sub => {
                    sectionContent.push({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: `${sub.subheading}` }] });
                     sectionContent.push(...sub.content.flatMap(item => {
                        if(item.type === 'paragraph') {
                            return [{ type: 'paragraph', content: [{ type: 'text', text: item.content }] }];
                        }
                        return [{
                            type: item.type === 'bullet-list' ? 'bulletList' : 'orderedList',
                            content: (item.content as string[]).map(listItem => ({
                                type: 'listItem',
                                content: [{ type: 'paragraph', content: [{ type: 'text', text: listItem }] }]
                            }))
                        }];
                    }));
                    if (sub.table) {
                         sectionContent.push({
                            type: 'table',
                            content: [
                                { type: 'tableRow', content: sub.table.headers.map(header => ({ type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: header }] }] })) },
                                ...sub.table.rows.map(row => ({ type: 'tableRow', content: row.map(cell => ({ type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: cell }] }] })) }))
                            ]
                        });
                    }
                });
            }
            if (section.addDividerAfter) {
                sectionContent.push({ type: 'horizontalRule' });
            }
            return sectionContent;
        });
        
        contentJSON = {
            type: 'doc',
            content: [
                { type: 'paragraph', content: [{ type: 'text', text: result.notesContent.introduction, marks: [{type: 'italic'}] }] },
                ...tiptapContent
            ]
        };
    }
    
    try {
      const docRef = await addFirestoreDoc(collection(db, 'users', user.uid, 'docs'), {
        title: `${result.title}`,
        content: contentJSON,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        folderId: null,
      });
      toast({
        title: '✓ Saved to Docs',
        description: `"${result.title}" has been created.`,
      });
      router.push(`/docs/${docRef.id}`);
    } catch (e) {
      console.error("Error saving document: ", e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save document. Please try again.',
      });
    } finally {
      setIsSavingToDocs(false);
    }
  }

  const renderStructuredNotes = () => {
    if (!result?.notesContent || typeof result.notesContent === 'string') return null;
    const { introduction, sections } = result.notesContent;

    return (
        <div ref={exportRef} className="prose prose-sm dark:prose-invert max-w-none p-4 bg-background text-foreground">
            <h1>{result.title}</h1>
            <p className="lead italic">{introduction}</p>
            {sections.map((section, secIndex) => (
                <React.Fragment key={secIndex}>
                    <h2>{section.heading}</h2>
                    {section.content.map((item, itemIndex) => (
                        <div key={itemIndex}>
                            {item.type === 'paragraph' && typeof item.content === 'string' && (
                                <p className={cn(item.isKeyPoint && "font-semibold bg-gray-100 dark:bg-gray-800 p-2 rounded-md")}>
                                    <InlineMarkdown text={item.content} />
                                </p>
                            )}
                            {item.type === 'bullet-list' && Array.isArray(item.content) && (
                                <ul>
                                    {item.content.map((listItem, liIndex) => <li key={liIndex}><InlineMarkdown text={listItem} /></li>)}
                                </ul>
                            )}
                             {item.type === 'numbered-list' && Array.isArray(item.content) && (
                                <ol>
                                    {item.content.map((listItem, liIndex) => <li key={liIndex}><InlineMarkdown text={listItem} /></li>)}
                                </ol>
                            )}
                        </div>
                    ))}
                     {section.table && (
                        <div className="my-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {section.table.headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {section.table.rows.map((row, rowIndex) => (
                                        <TableRow key={rowIndex}>
                                            {row.map((cell, cellIndex) => <TableCell key={cellIndex}>{cell}</TableCell>)}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {section.subsections && section.subsections.map((sub, subIndex) => (
                        <div key={subIndex} className="ml-6">
                            <h3>{sub.subheading}</h3>
                            {sub.content.map((item, itemIndex) => (
                                <div key={itemIndex}>
                                    {item.type === 'paragraph' && typeof item.content === 'string' && (
                                        <p className={cn(item.isKeyPoint && "font-semibold bg-gray-100 dark:bg-gray-800 p-2 rounded-md")}>
                                            <InlineMarkdown text={item.content} />
                                        </p>
                                    )}
                                    {item.type === 'bullet-list' && Array.isArray(item.content) && (
                                        <ul>
                                            {item.content.map((listItem, liIndex) => <li key={liIndex}><InlineMarkdown text={listItem} /></li>)}
                                        </ul>
                                    )}
                                    {item.type === 'numbered-list' && Array.isArray(item.content) && (
                                        <ol>
                                            {item.content.map((listItem, liIndex) => <li key={liIndex}><InlineMarkdown text={listItem} /></li>)}
                                        </ol>
                                    )}
                                </div>
                            ))}
                            {sub.table && (
                                <div className="my-4">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                {sub.table.headers.map(header => <TableHead key={header}>{header}</TableHead>)}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {sub.table.rows.map((row, rowIndex) => (
                                                <TableRow key={rowIndex}>
                                                    {row.map((cell, cellIndex) => <TableCell key={cellIndex}>{cell}</TableCell>)}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    ))}
                    {section.addDividerAfter && secIndex < sections.length - 1 && <Separator className="my-6" />}
                </React.Fragment>
            ))}
        </div>
    );
  }

  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <h3 className="text-xl font-semibold font-headline">Generating Your Notes...</h3>
                <p className="text-muted-foreground">The AI is creating your study material. This may take a moment.</p>
            </div>
        );
    }
    if (result && result.notesContent) {
        return (
            <Card className="flex-1 flex flex-col h-full">
                <CardHeader>
                    <CardTitle>{result.title}</CardTitle>
                    <CardDescription>Your AI-generated notes are ready.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 min-h-0">
                    <ScrollArea className="h-full border rounded-md">
                       {renderStructuredNotes()}
                    </ScrollArea>
                </CardContent>
                <CardFooter className="flex-wrap justify-end gap-2">
                    <Button variant="outline" onClick={handleReset}>Generate New Notes</Button>
                    <Button onClick={handleSaveToDocs} disabled={isSavingToDocs}>
                        {isSavingToDocs ? <Loader2/> : <Save/>}
                        {isSavingToDocs ? 'Saving...' : 'Save to Docs'}
                    </Button>
                    <Button variant="outline" onClick={handleCopy}><Copy/> Copy Text</Button>
                    <Button variant="outline" onClick={() => setIsFileDialogOpen(true)}><Download/> Export as Word</Button>
                    <Button variant="outline" onClick={handleExportPDF} disabled={isExporting}>
                        {isExporting ? <Loader2 className="animate-spin" /> : <FileText/>}
                        Export PDF
                    </Button>
                </CardFooter>
            </Card>
        )
    }
     return <InputForm onGenerate={handleGenerate} generationType="notes" />;
  }

  return (
    <>
      <div className="flex flex-col h-full gap-6">
        {renderContent()}
      </div>
      <Dialog open={isFileDialogOpen} onOpenChange={setIsFileDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Export as Word Document</DialogTitle>
                  <DialogDescription>
                    You can rename the file and choose a font for the export. Please note that "Protected View" is a standard security feature in Microsoft Word for downloaded files. You can click "Enable Editing" in Word to view it normally.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file-name">File Name</Label>
                    <Input 
                        id="file-name" 
                        value={fileName} 
                        onChange={(e) => setFileName(e.target.value)} 
                        onKeyDown={(e) => { if(e.key === 'Enter') handleExportWord() }}
                    />
                  </div>
                   <div className="space-y-2">
                        <Label htmlFor="font-select">Font</Label>
                        <Select value={selectedFont} onValueChange={setSelectedFont}>
                            <SelectTrigger id="font-select">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {fonts.map(font => <SelectItem key={font.value} value={font.value} style={{fontFamily: font.value}}>{font.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                   </div>
              </div>
              <DialogFooter>
                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                  <Button onClick={handleExportWord} disabled={isExporting}>
                      {isExporting && <Loader2 className="animate-spin mr-2"/>}
                      Export
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  )
}
