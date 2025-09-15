'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { generateInterviewQuestions } from '@/ai/flows/generate-interview-questions-flow';
import type { InterviewQuestion } from '@/lib/types/interview-prep';


const formSchema = z.object({
    jobTitle: z.string().min(2, { message: "Job title is required."}),
    industry: z.string().min(2, { message: "Industry is required."}),
    experienceLevel: z.enum(['entry', 'mid', 'senior']),
});

type InterviewSetupForm = z.infer<typeof formSchema>;

export function MockInterview() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    
    const form = useForm<InterviewSetupForm>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            jobTitle: "",
            industry: "",
            experienceLevel: "mid",
        },
    });
    
    const handleStartInterview = async (values: InterviewSetupForm) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'You must be logged in.' });
            return;
        }
        
        setIsLoading(true);
        setQuestions([]);
        
        try {
            const generatedQuestions = await generateInterviewQuestions(values);
            setQuestions(generatedQuestions);
            toast({ title: 'Your interview is ready!', description: `${generatedQuestions.length} questions have been generated.` });
        } catch (error) {
            console.error("Failed to generate interview questions:", error);
            toast({ variant: 'destructive', title: 'Failed to create interview.', description: (error as Error).message });
        } finally {
            setIsLoading(false);
        }
    };
    
    // The component will render the form or the interview session based on `questions` state
    if (questions.length > 0) {
        return (
            <div>
                <h2 className="text-2xl font-bold mb-4">Interview Session Started</h2>
                <ul>
                    {questions.map((q, i) => (
                        <li key={i} className="p-2 border-b"><strong>{q.category}:</strong> {q.questionText}</li>
                    ))}
                </ul>
                <Button onClick={() => setQuestions([])} className="mt-4">End Session</Button>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mock Interview Setup</CardTitle>
                <CardDescription>Configure your practice session. The AI will generate tailored questions for you.</CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleStartInterview)}>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="jobTitle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Job Title You're Applying For</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Senior Product Manager" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="industry"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Industry</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Technology, Healthcare, Finance" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="experienceLevel"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Experience Level</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="entry">Entry-Level</SelectItem>
                                            <SelectItem value="mid">Mid-Level</SelectItem>
                                            <SelectItem value="senior">Senior-Level</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            {isLoading ? 'Generating Interview...' : 'Start Mock Interview'}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
