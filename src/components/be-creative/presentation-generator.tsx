
'use client';

import * as React from "react";
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Wand2, ChevronLeft, ChevronRight, Copy, Download, Image as ImageIcon, Lightbulb, BarChart as BarChartIcon, Users, Settings, Code, FlaskConical, Palette, PieChart as PieChartIcon, FileText, MonitorPlay, ThumbsUp, Handshake, GitBranch as TimelineIcon, Upload, FileIcon, TrendingUp, Zap, Target, GitCommit, GitPullRequest, GitMerge, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '../ui/scroll-area';
import { PresentationRequestSchema, type PresentationResponse, type Slide, type PresentationTemplate, type SlideSize } from '@/lib/types/presentation';
import { generatePresentation } from '@/ai/flows/presentation-flow';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '../ui/carousel';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import Image from 'next/image';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import PptxGenJS from 'pptxgenjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { ProcessDiagram } from './smart-art/ProcessDiagram';
import { CycleDiagram } from './smart-art/CycleDiagram';


let pdfjs: any;

const templates: { id: PresentationTemplate; name: string; bg: string, text: string, accent: string, pptx: { backgroundColor: string, fontColor: string, accentColor: string } }[] = [
    { id: 'default', name: 'Default', bg: 'bg-slate-100', text: 'text-slate-800', accent: 'bg-blue-500', pptx: { backgroundColor: 'F1F5F9', fontColor: '1E293B', accentColor: '3B82F6' } },
    { id: 'professional', name: 'Professional', bg: 'bg-white', text: 'text-gray-900', accent: 'bg-gray-800', pptx: { backgroundColor: 'FFFFFF', fontColor: '111827', accentColor: '1F2937' } },
    { id: 'creative', name: 'Creative', bg: 'bg-purple-100', text: 'text-purple-900', accent: 'bg-yellow-400', pptx: { backgroundColor: 'F3E8FF', fontColor: '581C87', accentColor: 'FBBF24' } },
    { id: 'technical', name: 'Technical', bg: 'bg-gray-800', text: 'text-white', accent: 'bg-cyan-400', pptx: { backgroundColor: '1F2937', fontColor: 'FFFFFF', accentColor: '22D3EE' } },
    { id: 'minimalist', name: 'Minimalist', bg: 'bg-gray-50', text: 'text-gray-700', accent: 'bg-gray-400', pptx: { backgroundColor: 'F9FAFB', fontColor: '374151', accentColor: '9CA3AF' } },
    { id: 'dark', name: 'Dark Mode', bg: 'bg-gray-900', text: 'text-gray-100', accent: 'bg-indigo-500', pptx: { backgroundColor: '111827', fontColor: 'F9FAFB', accentColor: '6366F1' } },
    { id: 'playful', name: 'Playful', bg: 'bg-yellow-100', text: 'text-orange-900', accent: 'bg-pink-500', pptx: { backgroundColor: 'FEF3C7', fontColor: '7C2D12', accentColor: 'EC4899' } },
    { id: 'academic', name: 'Academic', bg: 'bg-blue-50', text: 'text-blue-900', accent: 'bg-blue-800', pptx: { backgroundColor: 'EFF6FF', fontColor: '1E3A8A', accentColor: '1E40AF' } },
    { id: 'corporate', name: 'Corporate', bg: 'bg-sky-700', text: 'text-white', accent: 'bg-sky-200', pptx: { backgroundColor: '0369A1', fontColor: 'FFFFFF', accentColor: 'BAE6FD' } },
    { id: 'elegant', name: 'Elegant', bg: 'bg-stone-200', text: 'text-stone-800', accent: 'bg-stone-600', pptx: { backgroundColor: 'E7E5E4', fontColor: '292524', accentColor: '57534E' } },
];

const toneOptions = [
    'Professional', 'Educational', 'Creative', 'Technical / Data-driven', 'Marketing / Sales pitch'
] as const;

type PresentationFormValues = z.infer<typeof PresentationRequestSchema>;

const iconMap: { [key: string]: React.ElementType } = {
    chart: BarChartIcon,
    pie: PieChartIcon,
    icon: Lightbulb,
    team: Users,
    settings: Settings,
    code: Code,
    flask: FlaskConical,
    palette: Palette,
    timeline: TimelineIcon,
    handshake: Handshake,
    thumbsup: ThumbsUp,
    growth: TrendingUp,
    idea: Lightbulb,
    zap: Zap,
    target: Target,
};

const chartData = [
  { name: 'A', value: 400 },
  { name: 'B', value: 300 },
  { name: 'C', value: 200 },
  { name: 'D', value: 278 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Timeline = () => (
    <div className="relative h-full w-full p-4 flex items-center">
        <div className="w-full h-1 bg-muted-foreground" />
        <div className="absolute w-full flex justify-between top-1/2 -translate-y-1/2">
            {[...Array(4)].map((_, i) => (
                 <div key={i} className="flex flex-col items-center">
                    <div className="w-4 h-4 bg-primary rounded-full z-10" />
                    <div className="text-xs mt-2 text-muted-foreground">Step {i+1}</div>
                 </div>
            ))}
        </div>
    </div>
);

const HierarchyDiagram = ({ items }: { items: string[] }) => (
  <div className="flex flex-col items-center justify-center h-full w-full p-4 gap-4">
    <div className="p-2 px-4 border rounded-md bg-muted">{items[0] || 'Top Level'}</div>
    <div className="flex gap-4">
      {items.slice(1, 3).map((item, i) => (
        <div key={i} className="flex flex-col items-center gap-2">
           <div className="h-4 w-px bg-muted-foreground"></div>
           <div className="p-2 px-4 border rounded-md bg-muted">{item}</div>
        </div>
      ))}
    </div>
  </div>
);

const MatrixDiagram = () => (
  <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-2 p-4">
    <div className="border rounded-md bg-muted/50 flex items-center justify-center text-xs text-center p-1">Quadrant 1</div>
    <div className="border rounded-md bg-muted/50 flex items-center justify-center text-xs text-center p-1">Quadrant 2</div>
    <div className="border rounded-md bg-muted/50 flex items-center justify-center text-xs text-center p-1">Quadrant 3</div>
    <div className="border rounded-md bg-muted/50 flex items-center justify-center text-xs text-center p-1">Quadrant 4</div>
  </div>
);


const VisualSuggestion = ({ visual, index }: { visual?: Slide['visual']; index: number }) => {
    if (!visual || !visual.type) return <ImageIcon className="text-muted-foreground" />;
    
    const { type, items } = visual;
    const suggestionText = items?.[0] || type;

    switch (type) {
        case 'process':
            return <ProcessDiagram items={items || []} />;
        case 'cycle':
            return <CycleDiagram items={items || []} />;
        case 'hierarchy':
            return <HierarchyDiagram items={items || []} />;
        case 'matrix':
            return <MatrixDiagram />;
        case 'chart':
             if (suggestionText.toLowerCase().includes('pie')) {
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} fill="#8884d8">
                                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip wrapperClassName="text-xs" />
                        </PieChart>
                    </ResponsiveContainer>
                )
             }
             return (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <XAxis dataKey="name" fontSize={10} />
                        <YAxis fontSize={10} />
                        <Tooltip wrapperClassName="text-xs" />
                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                </ResponsiveContainer>
             )
        case 'timeline':
            return <Timeline />;
        case 'icon':
            const iconKey = Object.keys(iconMap).find(key => suggestionText.toLowerCase().includes(key));
            const Icon = iconKey ? iconMap[iconKey] : Lightbulb;
            return (
                <div className="flex flex-col items-center justify-center h-full bg-muted/50 rounded-lg p-4 text-center">
                    <Icon className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">Icon: {suggestionText}</p>
                </div>
            );
        case 'image':
        default:
             return (
                <Image 
                    src={`https://picsum.photos/seed/${suggestionText.replace(/\s+/g, '-')}-${index}/600/400`}
                    alt={suggestionText}
                    width={600}
                    height={400}
                    data-ai-hint={suggestionText}
                    className="w-full h-full object-cover rounded-lg shadow-sm"
                />
            )
    }
}


export function PresentationGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [response, setResponse] = useState<PresentationResponse | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PresentationTemplate>('default');
  const [api, setApi] = useState<CarouselApi>()
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [pdfjsLoaded, setPdfjsLoaded] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

   useEffect(() => {
    const script = document.createElement('script');
    script.src = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js`;
    script.onload = () => {
        pdfjs = (window as any).pdfjsLib;
        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js`;
        setPdfjsLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (response?.slides) {
      slideRefs.current = response.slides.map(() => React.createRef());
    }
  }, [response]);

  const form = useForm<PresentationFormValues>({
    resolver: zodResolver(PresentationRequestSchema),
    defaultValues: {
      generationType: "from_topic",
      topic: "",
      sourceText: "",
      numSlides: 8,
      tone: "Professional",
    },
  });

  useEffect(() => {
    if (!api) {
      return
    }
 
    setCurrentSlideIndex(api.selectedScrollSnap())
 
    api.on("select", () => {
      setCurrentSlideIndex(api.selectedScrollSnap())
    })
  }, [api])
  
  const generationType = form.watch('generationType');

  const handleGenerate = async (values: PresentationFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    
     if (values.generationType === 'from_text' && !values.sourceText?.trim()) {
      toast({ variant: 'destructive', title: 'Source text cannot be empty.' });
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const generatedResponse = await generatePresentation(values);
      setResponse(generatedResponse);
    } catch (error) {
      console.error("Failed to generate presentation:", error);
      toast({ variant: 'destructive', title: 'Failed to generate presentation.', description: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    form.reset();
    setResponse(null);
    setFileName(null);
  };
  
   const handleExportPPTX = async () => {
    if (!response) return;
    setIsExporting(true);

    try {
      const pptx = new PptxGenJS();
      const templateStyle = templates.find(t => t.id === selectedTemplate)?.pptx || templates[0].pptx;
      
      const layoutName = 'LAYOUT_16x9'; // Always use widescreen for now
      pptx.layout = layoutName;
      
      pptx.defineSlideMaster({
        title: 'MASTER_SLIDE',
        background: { color: templateStyle.backgroundColor },
      });

      for (const [index, slide] of response.slides.entries()) {
        const isTitleSlide = index === 0;
        const isLastSlide = index === response.slides.length - 1;
        const pptxSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });

        if (isTitleSlide) {
          pptxSlide.addText(response.title, { 
            x: '5%', y: '35%', w: '90%', h: '20%', 
            align: 'center', fontSize: 44, bold: true, color: templateStyle.fontColor 
          });
          if(slide.title) {
            pptxSlide.addText(slide.title, { 
              x: '5%', y: '55%', w: '90%', h: '10%', 
              align: 'center', fontSize: 24, color: templateStyle.fontColor, 
            });
          }
        } else if (isLastSlide) {
           pptxSlide.addText(slide.title, { 
            x: '5%', y: '40%', w: '90%', h: '20%', 
            align: 'center', fontSize: 44, bold: true, color: templateStyle.fontColor 
          });
        } else {
          pptxSlide.addText(slide.title, { x: 0.5, y: 0.25, w: '90%', h: 0.75, fontSize: 32, bold: true, color: templateStyle.fontColor });
          
          if(slide.layout !== 'visual-only' && slide.content.length > 0) {
            const contentObjects = slide.content.map(point => ({ text: point, options: { bullet: true, indentLevel: 0 } }));
            pptxSlide.addText(
              contentObjects,
              { 
                x: slide.layout === 'text-and-visual' ? 0.5 : 1, 
                y: 1.5, 
                w: slide.layout === 'text-and-visual' ? '45%' : '80%', 
                h: '75%', 
                fontSize: 18, color: templateStyle.fontColor,
                lineSpacing: 36,
                valign: 'top',
                fit: 'shrink',
              }
            );
          }

           if((slide.layout === 'text-and-visual' || slide.layout === 'visual-only') && slide.visual) {
              const lowerSuggestion = slide.visual.items?.[0]?.toLowerCase() || '';
              const imageUrl = `https://picsum.photos/seed/${slide.visual.items?.[0]?.replace(/\s+/g, '-')}-${index}/600/400`;

              if (slide.visual.type === 'chart' && lowerSuggestion.includes('bar')) {
                 pptxSlide.addChart(pptx.ChartType.bar, chartData, { x: 5.5, y: 1.5, w: 4, h: 4, barDir: 'bar' });
              } else if (slide.visual.type === 'chart' && lowerSuggestion.includes('pie')) {
                  pptxSlide.addChart(pptx.ChartType.pie, chartData, { x: 5.5, y: 1.5, w: 4, h: 4, showLegend: true });
              } else {
                 // For process, cycle, icon, image, timeline we use a placeholder image
                 pptxSlide.addImage({ path: imageUrl, x: 5.5, y: 1.5, w: 4, h: 4 });
              }
           }
        }

        if (slide.speakerNotes) {
          pptxSlide.addNotes(slide.speakerNotes);
        }
      }

      await pptx.writeFile({ fileName: `${response.title}.pptx` });
      toast({title: "Export successful!", description: "Your presentation has been downloaded."});

    } catch (error) {
       toast({variant: 'destructive', title: "Export failed", description: (error as Error).message });
    } finally {
       setIsExporting(false);
    }
  };
  
   const handleExportPDF = async () => {
    if(!response) return;
    setIsExporting(true);

    try {
        const isLandscape = true; // Always 16:9 for now
        const pdf = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'px',
            format: [1280, 720],
        });

        for (let i = 0; i < response.slides.length; i++) {
            if (i > 0) pdf.addPage();
            
            const slideElement = slideRefs.current[i];
            if (slideElement) {
                const canvas = await html2canvas(slideElement, { scale: 2 });
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
            }
        }

        pdf.save(`${response.title}.pdf`);
        toast({ title: 'Export successful!', description: 'Your presentation is being downloaded as a PDF.' });

    } catch (error) {
        toast({variant: 'destructive', title: "PDF Export failed", description: (error as Error).message });
    } finally {
        setIsExporting(false);
    }
  };

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
  
  const parsePdf = async (file: File) => {
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

  const onDrop = async (acceptedFiles: File[]) => {
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
        } else {
           throw new Error("Unsupported file type or library not loaded.");
        }
        
        form.setValue('generationType', 'from_text');
        toast({ title: "✓ File Processed", description: "Text extracted. You can now generate the presentation." });

      } catch (error) {
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
    },
    multiple: false,
  });
  
  const renderInitialState = () => (
    <Card className="h-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>AI Presentation Generator</CardTitle>
        <CardDescription>
          Describe your topic, paste text, or upload a file, and the AI will create a structured presentation for you.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleGenerate)} className="h-full">
          <CardContent className="space-y-4">
             <Tabs defaultValue="topic" onValueChange={(value) => form.setValue('generationType', value === 'topic' ? 'from_topic' : 'from_text')}>
                <TabsList>
                    <TabsTrigger value="topic">From Topic</TabsTrigger>
                    <TabsTrigger value="text">From Text</TabsTrigger>
                    <TabsTrigger value="file">From File</TabsTrigger>
                </TabsList>
                 <TabsContent value="topic" className="mt-4">
                     <FormField
                        control={form.control}
                        name="topic"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Presentation Topic</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., The Future of Renewable Energy" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </TabsContent>
                <TabsContent value="text" className="mt-4">
                    <FormField
                        control={form.control}
                        name="sourceText"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Source Text</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Paste your article, notes, or any text here..." {...field} rows={6} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </TabsContent>
                 <TabsContent value="file" className="mt-4">
                     <div {...getRootProps()} className={`h-40 border-2 border-dashed rounded-lg flex items-center justify-center text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
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
                                <p>Drag & drop a PDF or DOCX here, or click to select a file.</p>
                                <p className="text-xs text-muted-foreground">(Max file size: 15MB)</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
           
            <div className="grid md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="numSlides"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Slides</FormLabel>
                    <FormControl>
                      <Input type="number" min="3" max="30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tone / Style</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {toneOptions.map(tone => <SelectItem key={tone} value={tone}>{tone}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading || isParsing} className="w-full">
              {isLoading || isParsing ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
              {isLoading ? 'Generating...' : isParsing ? 'Parsing File...' : 'Generate Presentation'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );

  const renderResults = () => {
    if (!response) return null;
    const templateStyle = templates.find(t => t.id === selectedTemplate) || templates[0];
    const currentSlide = response.slides[currentSlideIndex];
    
    const getLayoutClasses = (layout: Slide['layout'], isTitleSlide: boolean, isLastSlide: boolean) => {
        if (isTitleSlide || isLastSlide) {
            return 'flex flex-col items-center justify-center text-center';
        }
        switch (layout) {
            case 'title': return 'flex flex-col items-center justify-center text-center';
            case 'text-only': return 'flex flex-col justify-center';
            case 'visual-only': return 'flex-col items-center justify-center';
            case 'text-and-visual':
            default:
                return 'grid md:grid-cols-2 gap-6 items-center';
        }
    }

    return (
      <div className="flex flex-col h-full gap-4">
        <h2 className={`text-3xl font-bold text-center font-headline`}>{response.title}</h2>
        <Carousel className="w-full max-w-5xl mx-auto" setApi={setApi}>
          <CarouselContent>
            {response.slides.map((slide, index) => {
                const isTitleSlide = index === 0;
                const isLastSlide = index === response.slides.length - 1;
                let EndIcon = ThumbsUp;
                if (slide.title.toLowerCase().includes('q&a')) {
                  EndIcon = Handshake;
                }
                
                return (
                  <CarouselItem key={index}>
                    <div ref={el => slideRefs.current[index] = el}>
                    <Card className={cn(
                        "h-full flex flex-col p-6 aspect-[16/9]",
                        templateStyle.bg, 
                        templateStyle.text
                    )}>
                      <CardContent className="flex-1 w-full flex items-center justify-center">
                        <div className={cn('w-full h-full', getLayoutClasses(slide.layout, isTitleSlide, isLastSlide))}>
                            {isTitleSlide ? (
                                <div className="space-y-4">
                                    <h1 className="text-6xl font-bold">{response.title}</h1>
                                    <p className="text-2xl opacity-80">{slide.title}</p>
                                </div>
                            ) : isLastSlide ? (
                                <div className="space-y-6 text-center">
                                    <EndIcon className="h-24 w-24 mx-auto opacity-80" />
                                    <h2 className="text-5xl font-bold">{slide.title}</h2>
                                    {slide.content.length > 0 && <p className="text-xl opacity-80">{slide.content.join(' ')}</p>}
                                </div>
                            ) : (
                                <>
                                {(slide.layout !== 'visual-only') && (
                                    <div className="space-y-4">
                                      <h3 className="text-4xl font-bold flex items-center gap-4">
                                        {slide.title}
                                      </h3>
                                      <ul className="list-disc pl-8 space-y-2 text-xl">
                                        {slide.content.map((point, i) => <li key={i}>{point}</li>)}
                                      </ul>
                                    </div>
                                )}
                                {(slide.layout === 'text-and-visual' || slide.layout === 'visual-only') && (
                                    <div className="h-full w-full min-h-[200px]">
                                        <VisualSuggestion visual={slide.visual} index={index} />
                                    </div>
                                )}
                                </>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                    </div>
                  </CarouselItem>
                )
            })}
          </CarouselContent>
          <CarouselPrevious className="text-black" />
          <CarouselNext className="text-black" />
        </Carousel>

        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Slide {currentSlideIndex + 1} of {response.slides.length}: Speaker Notes</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm italic">{currentSlide?.speakerNotes || "No notes for this slide."}</p>
            </CardContent>
        </Card>
        
         <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Template Design</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-4">
                    {templates.map(template => (
                        <div key={template.id} onClick={() => setSelectedTemplate(template.id)} className="cursor-pointer group">
                             <div className={cn(
                                'rounded-lg border-2 p-1 transition-all',
                                selectedTemplate === template.id ? 'border-primary' : 'border-transparent hover:border-primary/50'
                            )}>
                                 <div className={cn("h-16 w-24 rounded-md flex items-center justify-center text-xs p-2", template.bg, template.text)}>
                                     Aa
                                </div>
                             </div>
                             <p className="text-xs text-center mt-1">{template.name}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>


        <div className="flex justify-center gap-2">
          <Button onClick={handleReset}>New Presentation</Button>
           <Button onClick={handleExportPPTX} disabled={isExporting}>
            <MonitorPlay className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export PPTX'}
          </Button>
           <Button onClick={handleExportPDF} disabled={isExporting}>
            <FileText className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 border rounded-lg bg-muted/50">
        <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
        <h3 className="text-xl font-semibold font-headline">Generating Your Presentation...</h3>
        <p className="text-muted-foreground">The AI is preparing your slides. Please wait.</p>
      </div>
    );
  }

  return response ? renderResults() : renderInitialState();
}
