
'use client';

import { useState, useEffect, useRef, createRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Wand2, ChevronLeft, ChevronRight, Copy, Download, Image as ImageIcon, Lightbulb, BarChart as BarChartIcon, Users, Settings, Code, FlaskConical, Palette, PieChart as PieChartIcon, FileText, MonitorPlay, ThumbsUp, Handshake, GitBranch as TimelineIcon } from 'lucide-react';
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
};

const chartData = [
  { name: 'A', value: 400 },
  { name: 'B', value: 300 },
  { name: 'C', value: 200 },
  { name: 'D', value: 278 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Timeline = () => (
    <div className="relative h-full w-full p-4">
        <div className="absolute left-4 top-1/2 w-[calc(100%-2rem)] h-0.5 bg-muted-foreground" />
        <div className="relative flex justify-between h-full">
            {[25, 50, 75].map(pos => (
                 <div key={pos} className="flex flex-col items-center" style={{ flexBasis: `${pos}%` }}>
                    <div className="w-3 h-3 bg-primary rounded-full z-10" />
                    <div className="text-xs mt-2 text-muted-foreground">Milestone</div>
                 </div>
            ))}
        </div>
    </div>
);

const Infographic = ({ content }: { content: string[] }) => (
    <div className="grid grid-cols-2 gap-4 h-full w-full">
        {content.map((text, i) => (
            <div key={i} className="bg-muted/50 p-4 rounded-lg flex flex-col items-center text-center">
                <div className="p-2 bg-primary/20 rounded-full mb-2">
                    <Lightbulb className="h-6 w-6 text-primary" />
                </div>
                <p className="text-xs font-semibold">{text}</p>
            </div>
        ))}
    </div>
)


const VisualSuggestion = ({ suggestion, index, content }: { suggestion?: string; index: number, content: string[] }) => {
    if (!suggestion) return <ImageIcon className="text-muted-foreground" />;
    
    const lowerSuggestion = suggestion.toLowerCase();

    if (lowerSuggestion.includes('infographic')) {
        return <Infographic content={content} />;
    }

    if (lowerSuggestion.includes('bar chart')) {
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
    }
     if (lowerSuggestion.includes('pie chart')) {
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
    
    if (lowerSuggestion.includes('timeline')) {
        return <Timeline />;
    }

    const iconKey = Object.keys(iconMap).find(key => lowerSuggestion.includes(key));
    
    if (iconKey) {
        const Icon = iconMap[iconKey];
        return (
            <div className="flex flex-col items-center justify-center h-full bg-muted/50 rounded-lg p-4 text-center">
                <Icon className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">Visual: {suggestion}</p>
            </div>
        );
    }
    
    return (
        <Image 
            src={`https://picsum.photos/seed/${suggestion.replace(/\s+/g, '-')}-${index}/600/400`}
            alt={suggestion}
            width={600}
            height={400}
            data-ai-hint={suggestion}
            className="w-full h-full object-cover rounded-lg shadow-sm"
        />
    )
}

export function PresentationGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [response, setResponse] = useState<PresentationResponse | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PresentationTemplate>('default');
  const [api, setApi] = useState<CarouselApi>()
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  
  const slideRefs = useRef<(React.RefObject<HTMLDivElement>)[]>([]);

  useEffect(() => {
    if (response?.slides) {
      slideRefs.current = response.slides.map(() => createRef());
    }
  }, [response]);

  const form = useForm<PresentationFormValues>({
    resolver: zodResolver(PresentationRequestSchema),
    defaultValues: {
      generationType: "from_topic",
      topic: "",
      sourceText: "",
      audience: "",
      numSlides: 8,
      tone: "Professional",
      template: 'default',
      slideSize: '16:9',
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
  const slideSize = form.watch('slideSize');

  const handleGenerate = async (values: PresentationFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
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
  };
  
   const handleExportPPTX = async () => {
    if (!response) return;
    setIsExporting(true);

    try {
      const pptx = new PptxGenJS();
      const templateStyle = templates.find(t => t.id === selectedTemplate)?.pptx || templates[0].pptx;
      
      const layoutName = slideSize === '16:9' ? 'LAYOUT_16x9' : 'LAYOUT_4x3';
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

           if((slide.layout === 'text-and-visual' || slide.layout === 'visual-only') && slide.visualSuggestion) {
              const lowerSuggestion = slide.visualSuggestion.toLowerCase();
              const imageUrl = `https://picsum.photos/seed/${slide.visualSuggestion.replace(/\s+/g, '-')}-${index}/600/400`;

              if (lowerSuggestion.includes('bar chart')) {
                 pptxSlide.addChart(pptx.ChartType.bar, chartData, { x: 5.5, y: 1.5, w: 4, h: 4, barDir: 'bar' });
              } else if (lowerSuggestion.includes('pie chart')) {
                  pptxSlide.addChart(pptx.ChartType.pie, chartData, { x: 5.5, y: 1.5, w: 4, h: 4, showLegend: true });
              } else {
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
        const isLandscape = slideSize === '16:9';
        const pdf = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'px',
            format: isLandscape ? [1280, 720] : [960, 720],
        });

        for (let i = 0; i < response.slides.length; i++) {
            if (i > 0) pdf.addPage();
            
            const slideElement = slideRefs.current[i].current;
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
  }
  
  const renderInitialState = () => (
    <Card className="h-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>AI Presentation Generator</CardTitle>
        <CardDescription>
          Describe your topic or paste text, and the AI will create a structured presentation for you.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleGenerate)} className="h-full">
          <CardContent className="space-y-4">
             <FormField
              control={form.control}
              name="generationType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Generation Method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="from_topic" /></FormControl>
                        <FormLabel className="font-normal">From Topic</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="from_text" /></FormControl>
                        <FormLabel className="font-normal">From Text</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {generationType === 'from_topic' ? (
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
            ) : (
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
            )}
           
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audience</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., High School Students, Industry Experts" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>
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
            
             <FormField
              control={form.control}
              name="slideSize"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Slide Size</FormLabel>
                  <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex space-x-4">
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="16:9" /></FormControl>
                        <FormLabel className="font-normal">Widescreen (16:9)</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="4:3" /></FormControl>
                        <FormLabel className="font-normal">Standard (4:3)</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


             <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Template</FormLabel>
                     <FormControl>
                        <RadioGroup 
                            onValueChange={(value) => {
                                field.onChange(value as PresentationTemplate);
                                setSelectedTemplate(value as PresentationTemplate);
                            }} 
                            defaultValue={field.value} 
                            className="grid grid-cols-2 md:grid-cols-5 gap-4"
                        >
                            {templates.map(template => (
                                <FormItem key={template.id}>
                                    <FormControl>
                                        <RadioGroupItem value={template.id} id={template.id} className="sr-only" />
                                    </FormControl>
                                    <Label htmlFor={template.id} className="cursor-pointer">
                                        <div className={cn("p-2 rounded-lg border-2", field.value === template.id ? 'border-primary' : 'border-muted')}>
                                            <div className={`aspect-video rounded-md p-2 flex flex-col gap-1 ${template.bg}`}>
                                                <div className={`h-2 w-1/2 rounded-sm ${template.accent}`} />
                                                <div className={`h-1 w-3/4 rounded-sm ${template.text} opacity-70`} />
                                                <div className={`h-1 w-full rounded-sm ${template.text} opacity-50`} />
                                            </div>
                                            <p className="text-sm font-medium text-center mt-1">{template.name}</p>
                                        </div>
                                    </Label>
                                </FormItem>
                            ))}
                        </RadioGroup>
                     </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
              {isLoading ? 'Generating...' : 'Generate Presentation'}
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
                    <div ref={slideRefs.current[index]}>
                    <Card className={cn(
                        "h-full flex flex-col p-6",
                        templateStyle.bg, 
                        templateStyle.text,
                        slideSize === '16:9' ? 'aspect-[16/9]' : 'aspect-[4/3]'
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
                                        <VisualSuggestion suggestion={slide.visualSuggestion} index={index} content={slide.content} />
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
            <CardHeader>
                <CardTitle>Speaker Notes</CardTitle>
                <CardDescription>Slide {currentSlideIndex + 1} of {response.slides.length}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm italic">{currentSlide?.speakerNotes || "No notes for this slide."}</p>
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
