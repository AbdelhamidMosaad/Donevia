
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Wand2, ChevronLeft, ChevronRight, Copy, Download, Image as ImageIcon, Lightbulb, BarChart, Users, Settings, Code, FlaskConical, Palette } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '../ui/scroll-area';
import { PresentationRequestSchema, type PresentationResponse, type Slide, type PresentationTemplate } from '@/lib/types/presentation';
import { generatePresentation } from '@/ai/flows/presentation-flow';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';


const templates: { id: PresentationTemplate; name: string; bg: string, text: string, accent: string }[] = [
    { id: 'default', name: 'Default', bg: 'bg-slate-100', text: 'text-slate-800', accent: 'bg-blue-500' },
    { id: 'professional', name: 'Professional', bg: 'bg-white', text: 'text-gray-900', accent: 'bg-gray-800' },
    { id: 'creative', name: 'Creative', bg: 'bg-purple-100', text: 'text-purple-900', accent: 'bg-yellow-400' },
    { id: 'technical', name: 'Technical', bg: 'bg-gray-800', text: 'text-white', accent: 'bg-cyan-400' },
    { id: 'minimalist', name: 'Minimalist', bg: 'bg-gray-50', text: 'text-gray-700', accent: 'bg-gray-400' },
    { id: 'dark', name: 'Dark Mode', bg: 'bg-gray-900', text: 'text-gray-100', accent: 'bg-indigo-500' },
    { id: 'playful', name: 'Playful', bg: 'bg-yellow-100', text: 'text-orange-900', accent: 'bg-pink-500' },
    { id: 'academic', name: 'Academic', bg: 'bg-blue-50', text: 'text-blue-900', accent: 'bg-blue-800' },
    { id: 'corporate', name: 'Corporate', bg: 'bg-sky-700', text: 'text-white', accent: 'bg-sky-200' },
    { id: 'elegant', name: 'Elegant', bg: 'bg-stone-200', text: 'text-stone-800', accent: 'bg-stone-600' },
];

const toneOptions = [
    'Professional', 'Educational', 'Creative', 'Technical / Data-driven', 'Marketing / Sales pitch'
] as const;

type PresentationFormValues = z.infer<typeof PresentationRequestSchema>;

const iconMap: { [key: string]: React.ElementType } = {
    chart: BarChart,
    icon: Lightbulb,
    team: Users,
    settings: Settings,
    code: Code,
    flask: FlaskConical,
    palette: Palette,
};

const VisualSuggestion = ({ suggestion }: { suggestion?: string }) => {
    if (!suggestion) return <ImageIcon className="text-muted-foreground" />;
    
    const lowerSuggestion = suggestion.toLowerCase();
    const IconComponent = Object.keys(iconMap).find(key => lowerSuggestion.includes(key));
    
    const Icon = IconComponent ? iconMap[IconComponent] : ImageIcon;
    
    return (
        <div className="flex flex-col items-center justify-center h-full bg-muted/50 rounded-lg p-4 text-center">
            <Icon className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">Visual: {suggestion}</p>
        </div>
    )
}

export function PresentationGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<PresentationResponse | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PresentationTemplate>('default');

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
    },
  });
  
  const generationType = form.watch('generationType');

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
                      <Input type="number" min="3" max="15" {...field} />
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

    return (
      <div className="flex flex-col h-full gap-4">
        <h2 className={`text-2xl font-bold text-center ${templateStyle.text}`}>{response.title}</h2>
        <Carousel className="w-full max-w-4xl mx-auto flex-1">
          <CarouselContent>
            {response.slides.map((slide, index) => (
              <CarouselItem key={index}>
                <Card className={`h-full flex flex-col ${templateStyle.bg} ${templateStyle.text}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <span className={`h-2 w-8 rounded-full ${templateStyle.accent}`} />
                        {index + 1}. {slide.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-6 flex-1">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Content</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {slide.content.map((point, i) => <li key={i}>{point}</li>)}
                      </ul>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="p-4 bg-black/5 rounded-lg flex-1">
                          <h4 className="font-semibold mb-2">Speaker Notes</h4>
                          <p className="text-sm italic">{slide.speakerNotes}</p>
                        </div>
                         <div className="flex-1">
                            <VisualSuggestion suggestion={slide.visualSuggestion} />
                         </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="text-black" />
          <CarouselNext className="text-black" />
        </Carousel>
        <div className="flex justify-center gap-2">
          <Button onClick={handleReset}>New Presentation</Button>
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
