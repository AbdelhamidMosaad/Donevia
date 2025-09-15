'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Image from 'next/image';

const resources = [
  {
    id: 'star-method',
    title: 'Mastering the STAR Method',
    description: 'A structured way to answer behavioral questions.',
    content: "The STAR method is a technique for answering behavioral interview questions. It helps you provide a concise yet detailed story about a specific experience. It stands for: Situation (provide context), Task (describe your responsibility), Action (explain the steps you took), and Result (share the outcome and what you learned).",
    image: 'https://picsum.photos/seed/interview1/600/400',
    dataAiHint: 'interview planning presentation'
  },
  {
    id: 'common-questions',
    title: 'Common Questions to Prepare For',
    description: "Anticipate and prepare for frequently asked questions.",
    content: "While questions will vary, you can almost always expect to encounter some classics. Be ready to discuss your strengths and weaknesses, why you're interested in the role, where you see yourself in five years, and how you handle stress or pressure. Preparing for these will boost your confidence.",
    image: 'https://picsum.photos/seed/interview2/600/400',
    dataAiHint: 'question mark list'
  },
  {
    id: 'body-language',
    title: 'Body Language and Non-Verbal Cues',
    description: "Your non-verbal communication speaks volumes.",
    content: "Maintain good eye contact, offer a firm handshake, and sit up straight to convey confidence. Use hand gestures to emphasize points, but avoid fidgeting. Nodding to show you are listening is also effective. Remember to smile and be personable!",
    image: 'https://picsum.photos/seed/interview3/600/400',
    dataAiHint: 'person talking presentation'
  },
  {
    id: 'pre-interview-checklist',
    title: 'Pre-Interview Checklist',
    description: "Don't walk into the interview unprepared.",
    content: "Before the interview: research the company and your interviewers, prepare a few insightful questions to ask them, print copies of your resume, and plan your outfit. For virtual interviews, test your camera and microphone, ensure a professional background, and close unnecessary tabs.",
    image: 'https://picsum.photos/seed/interview4/600/400',
    dataAiHint: 'checklist tasks clipboard'
  }
];

export function ResourceHub() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Resource Hub</CardTitle>
                <CardDescription>Tips, tricks, and checklists for interview success.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {resources.map(resource => (
                        <AccordionItem value={resource.id} key={resource.id}>
                            <AccordionTrigger>
                                <div className="text-left">
                                    <h4 className="font-semibold">{resource.title}</h4>
                                    <p className="text-sm text-muted-foreground font-normal">{resource.description}</p>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="grid md:grid-cols-2 gap-6 items-center">
                                    <p className="text-muted-foreground">{resource.content}</p>
                                     <Image 
                                        src={resource.image}
                                        alt={resource.title}
                                        width={600}
                                        height={400}
                                        data-ai-hint={resource.dataAiHint}
                                        className="rounded-lg shadow-md aspect-video object-cover"
                                    />
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    )
}
