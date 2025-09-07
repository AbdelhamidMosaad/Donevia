
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters long.'),
  subtopics: z.string().min(5, 'Please provide at least one subtopic.'),
});

interface ScholarAssistInputFormProps {
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  isLoading: boolean;
}

export function ScholarAssistInputForm({
  onSubmit,
  isLoading,
}: ScholarAssistInputFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
      subtopics: '',
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Your Study Guide</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main Topic</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., The French Revolution" {...field} />
                  </FormControl>
                  <FormDescription>
                    What is the primary subject you want to learn about?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subtopics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtopics</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Causes, Major Events, Key Figures, Aftermath"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    List the key areas to cover, separated by commas.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Guide
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
