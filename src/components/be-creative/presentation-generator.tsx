
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Wand2, ChevronLeft, ChevronRight, Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ScrollArea } from '../ui/scroll-area';
import { PresentationRequestSchema, type PresentationResponse, type Slide } from '@/lib/types/presentation';
import { generatePresentation } from '@/ai/flows/presentation-flow';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel';

type PresentationFormValues = z.infer<typeof PresentationRequestSchema>;

export function PresentationGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<PresentationResponse | null>(null);

  const form = useForm<PresentationFormValues>({
    resolver: zodResolver(PresentationRequestSchema),
    defaultValues: {
      topic: "",
      audience: "",
      numSlides: 5,
    },
  });

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

  const renderInitialState = () => (
    <Card className="h-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>AI Presentation Generator</CardTitle>
        <CardDescription>
          Describe your topic, and the AI will create a structured presentation for you.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleGenerate)} className="h-full">
          <CardContent className="space-y-4">
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
      if(!response) return null;

      return (
        <div className="flex flex-col h-full gap-4">
          <h2 className="text-2xl font-bold text-center">{response.title}</h2>
          <Carousel className="w-full max-w-4xl mx-auto flex-1">
            <CarouselContent>
              {response.slides.map((slide, index) => (
                <CarouselItem key={index}>
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>{index + 1}. {slide.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-2">Content</h4>
                            <ul className="list-disc pl-5 space-y-2">
                                {slide.content.map((point, i) => <li key={i}>{point}</li>)}
                            </ul>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                             <h4 className="font-semibold mb-2">Speaker Notes</h4>
                             <p className="text-sm text-muted-foreground italic">{slide.speakerNotes}</p>
                        </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
           <div className="flex justify-center gap-2">
            <Button onClick={handleReset}>New Presentation</Button>
          </div>
        </div>
      )
  }
  
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
