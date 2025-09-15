'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "lucide-react";
import { Button } from "../ui/button";

const resourceCategories = [
  {
    id: 'general-prep',
    title: 'General Interview Preparation',
    description: 'Guides, tips, and company-specific questions.',
    links: [
      {
        title: 'Indeed Career Guide – Interview Tips',
        url: 'https://www.indeed.com/career-advice/interviewing',
        description: "Step-by-step guides, common questions, do’s/don’ts."
      },
      {
        title: 'Glassdoor – Interview Questions & Reviews',
        url: 'https://www.glassdoor.com/Interview/index.htm',
        description: 'Real questions shared by candidates for specific companies.'
      },
      {
        title: 'LinkedIn Learning – Interview Prep Courses',
        url: 'https://www.linkedin.com/learning/topics/interviewing-and-job-search',
        description: 'Some free trials available for in-depth courses.'
      }
    ]
  },
  {
    id: 'behavioral-star',
    title: 'Behavioral & STAR Method',
    description: 'Learn to structure compelling answers about your experience.',
    links: [
      {
        title: 'MindTools – STAR Technique',
        url: 'https://www.mindtools.com/a4wo118/star-interview-technique',
        description: 'Explains how to structure answers for behavioral questions.'
      },
      {
        title: 'The Balance Careers – Behavioral Interview Tips',
        url: 'https://www.thebalancemoney.com/behavioral-interview-questions-2058575',
        description: 'Tips and example questions for behavioral interviews.'
      },
    ]
  },
  {
    id: 'industry-specific',
    title: 'Industry-Specific Resources',
    description: 'Practice questions for technical and specialized roles.',
    links: [
      {
        title: 'LeetCode – for software/tech interviews',
        url: 'https://leetcode.com/',
        description: 'A popular platform for practicing coding interview questions.'
      },
      {
        title: 'Big Interview – Role-Specific Guides',
        url: 'https://biginterview.com/blog/',
        description: 'Practice platform with guides for various roles.'
      },
      {
        title: 'Nursing/Medical Interviews (NHS Guide)',
        url: 'https://www.jobs.nhs.uk/advice/interview-tips.xhtml',
        description: 'UK NHS guide, but the principles are applicable globally.'
      },
    ]
  },
  {
    id: 'body-language',
    title: 'Body Language & Communication',
    description: 'Master the non-verbal aspects of your interview.',
    links: [
      {
        title: 'Toastmasters International – Speaking Tips',
        url: 'https://www.toastmasters.org/resources/public-speaking-tips',
        description: 'Tips on public speaking and communication.'
      },
      {
        title: 'Psychology Today – Body Language Basics',
        url: 'https://www.psychologytoday.com/us/basics/body-language',
        description: 'Understand the basics of non-verbal communication.'
      },
    ]
  },
  {
    id: 'checklists-templates',
    title: 'Checklists & Templates',
    description: "Stay organized and prepared for your big day.",
    links: [
       {
        title: 'Zety – Interview Preparation Checklist',
        url: 'https://zety.com/blog/interview-preparation',
        description: 'A comprehensive checklist for interview preparation.'
       },
       {
        title: 'MIT Career Advising Resources',
        url: 'https://careers.mit.edu/channels/resumes-cover-letters-and-more/',
        description: 'Example of free guides published by university career services.'
       },
    ]
  }
];

export function ResourceHub() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Resource Hub</CardTitle>
                <CardDescription>A curated list of external articles, guides, and tools to help you ace your next interview.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {resourceCategories.map(category => (
                        <AccordionItem value={category.id} key={category.id}>
                            <AccordionTrigger>
                                <div className="text-left">
                                    <h4 className="font-semibold">{category.title}</h4>
                                    <p className="text-sm text-muted-foreground font-normal">{category.description}</p>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pl-4 border-l-2 ml-2 space-y-4">
                                    {category.links.map((link, index) => (
                                        <div key={index}>
                                            <Button variant="link" asChild className="p-0 h-auto">
                                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-base font-semibold">
                                                    <Link className="mr-2 h-4 w-4" />
                                                    {link.title}
                                                </a>
                                            </Button>
                                            <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
    )
}
