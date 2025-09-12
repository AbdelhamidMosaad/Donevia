
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { HelpCircle, LayoutDashboard, Kanban, BarChart3, Sparkles, Briefcase, Repeat, Target, FileText, Bookmark, BrainCircuit, PenSquare, GitBranch, FileSignature, GraduationCap, Timer, Layers, Mail } from "lucide-react";
import Image from 'next/image';
import { Button } from "@/components/ui/button";

const features = [
    {
        id: 'dashboard',
        icon: <LayoutDashboard className="h-6 w-6 text-blue-500" />,
        title: 'Dashboard',
        description: "Your mission control for productivity. The dashboard gives you a quick, at-a-glance overview of your most important tasks, analytics, and AI-powered insights.",
        details: [
            {
                title: 'Task Overview',
                text: "Quickly see what's on your plate with cards for Recently Created tasks, High Priority items, and tasks that are Due Soon.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "dashboard tasks overview"
            },
            {
                title: 'Task Analytics',
                text: "Gain insights into your productivity with charts showing task completion rates, a breakdown of tasks by their current status, and your performance over the last week.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "analytics chart graph"
            },
            {
                title: 'AI-Powered Recap',
                text: "Let AI summarize your progress for you. Choose a daily or weekly period, and our AI will analyze your tasks to generate an encouraging summary of your achievements.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "ai robot summary"
            },
        ],
    },
    {
        id: 'tasks',
        icon: <Kanban className="h-6 w-6 text-purple-500" />,
        title: 'Task Management',
        description: 'A powerful and flexible system to organize your work. Choose from multiple views to manage your tasks your way.',
        details: [
            {
                title: 'Task Lists',
                text: "Group your tasks into lists, like 'Work Projects' or 'Personal Errands'. You can view your lists as visual cards or a compact list, and your preference is saved automatically.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "project folders list"
            },
            {
                title: 'Board View',
                text: "Visualize your workflow with a Kanban-style board. Drag and drop tasks and columns to reorder them. Customize stages like 'To Do' and 'In Progress' in 'Board Settings'.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "kanban board project"
            },
            {
                title: 'List, Table, and Calendar Views',
                text: "Switch between a simple list, a detailed table with customizable columns, and a full-page calendar view to see your tasks by their due dates.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "calendar schedule tasks"
            },
        ],
    },
     {
        id: 'crm',
        icon: <Briefcase className="h-6 w-6 text-amber-500" />,
        title: 'CRM',
        description: 'Manage your entire client workflow, from initial contact to final invoice.',
        details: [
            {
                title: 'Client Management',
                text: "Keep a centralized list of all your contacts. Add, edit, and store important details, custom fields, and documents for each client.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "contacts list crm"
            },
             {
                title: 'Sales Pipeline',
                text: "Visualize your sales process with a Kanban board. Move deals through customizable stages like 'New Request' and 'Proposal Sent'. Customize stages in 'Pipeline Settings'.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "sales pipeline flowchart"
            },
             {
                title: 'Quotes & Invoices',
                text: "Create and manage quotations and invoices directly within a client's profile. Attach relevant files and track their status.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "invoice document billing"
            },
        ],
    },
    {
        id: 'habits',
        icon: <Repeat className="h-6 w-6 text-teal-500" />,
        title: 'Habit Tracker',
        description: 'Build consistency and achieve your long-term goals.',
        details: [
            {
                title: 'Daily Check-ins',
                text: "Create habits you want to build and check them off each day on the weekly calendar view. Building a streak helps maintain momentum and motivation.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "calendar checkmark habit"
            },
        ],
    },
    {
        id: 'goals',
        icon: <Target className="h-6 w-6 text-red-500" />,
        title: 'Goal Tracker',
        description: 'Define, track, and achieve your long-term ambitions.',
        details: [
            {
                title: 'Set and Track Goals',
                text: "Create overarching goals with specific start and target dates. Break them down into smaller, actionable milestones. Track your overall progress as you complete each milestone.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "target goal achievement"
            },
             {
                title: 'Progress Journal',
                text: "Keep a running log of your thoughts, achievements, and setbacks for each goal. This journal helps you stay reflective and motivated throughout your journey.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "journal writing progress"
            },
        ],
    },
    {
        id: 'study-tracker',
        icon: <GraduationCap className="h-6 w-6 text-lime-500" />,
        title: 'Study Tracker',
        description: 'An advanced tool to plan and gamify your learning.',
        details: [
            {
                title: 'Structured Planning',
                text: "Break down large study goals into chapters and subtopics. Drag and drop to reorder your study plan and track progress with satisfying checklists and progress bars.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "study plan checklist"
            },
            {
                title: 'Time Tracking & Gamification',
                text: "Use the built-in timer for each subtopic to log your study sessions. Level up, earn badges, and build a study streak to stay motivated on your learning journey.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "gamification level up"
            },
        ],
    },
    {
        id: 'flashcards',
        icon: <Layers className="h-6 w-6 text-indigo-500" />,
        title: 'Flashcards',
        description: 'Master any subject with smart flashcards.',
        details: [
            {
                title: 'AI-Powered Generation',
                text: "Paste any text into the AI generator to automatically create a deck of flashcards. You can also create and manage cards manually, and import or export decks as JSON files.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "ai flashcards generation"
            },
            {
                title: 'Spaced Repetition System (SRS)',
                text: "The study mode uses an intelligent SRS algorithm to show you cards at the optimal time for memorization, ensuring you retain information effectively.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "learning algorithm chart"
            },
        ],
    },
    {
        id: 'notes',
        icon: <FileText className="h-6 w-6 text-orange-500" />,
        title: 'Sticky Notes',
        description: 'A flexible space for your quick thoughts and reminders.',
        details: [
            {
                title: 'Canvas & Board Views',
                text: "Organize your notes in two ways: a free-form 'Canvas' where you can arrange notes anywhere you like, or a structured 'Board' that automatically groups your notes by priority.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "sticky notes board"
            },
        ],
    },
    {
        id: 'bookmarks',
        icon: <Bookmark className="h-6 w-6 text-blue-500" />,
        title: 'Bookmarks',
        description: 'Save and organize your favorite websites.',
        details: [
            {
                title: 'Categorize & Find',
                text: "Save links with titles, descriptions, and categories. Filter by your custom categories or use the search bar to find exactly what you're looking for.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "bookmark collection web"
            },
        ],
    },
    {
        id: 'creativity-suite',
        icon: <BrainCircuit className="h-6 w-6 text-violet-500" />,
        title: 'Creativity Suite',
        description: 'A collection of visual tools to brainstorm and plan.',
        details: [
             {
                title: 'Brainstorming Canvas',
                text: "Capture ideas as colored cards and arrange them in a structured grid. It's perfect for quickly getting thoughts down and organizing them later.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "brainstorming idea cards"
            },
            {
                title: 'Whiteboard',
                text: "A free-form digital canvas. Use the pen, eraser, and shape tools to draw, sketch, and visualize your ideas without limits. Customize the background to suit your needs.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "digital whiteboard drawing"
            },
            {
                title: 'Mind Map',
                text: "Create structured diagrams by connecting nodes. Add child nodes to build out your ideas logically. Use fullscreen for a focused experience and export your work as an image or PDF.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "mind map chart"
            },
        ],
    },
     {
        id: 'docs',
        icon: <FileSignature className="h-6 w-6 text-cyan-500" />,
        title: 'Docs',
        description: 'A powerful, feature-rich document editor.',
        details: [
            {
                title: 'Rich Text Editing',
                text: "Create beautiful documents with a full suite of formatting tools, including headings, text styles, colors, tables, and image uploads. Organize your documents into folders for easy management.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "text editor document"
            },
        ],
    },
    {
        id: 'learning-tool',
        icon: <GraduationCap className="h-6 w-6 text-lime-500" />,
        title: 'Learning Assistant',
        description: 'Supercharge your study sessions with AI.',
        details: [
            {
                title: 'Generate Study Materials',
                text: "Paste any text or upload a document, and let the AI generate comprehensive notes, interactive quizzes, or a set of flashcards to help you learn faster.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "ai learning study"
            },
        ],
    },
     {
        id: 'pomodoro',
        icon: <Timer className="h-6 w-6 text-rose-500" />,
        title: 'Pomodoro Timer',
        description: 'Improve focus with a built-in time management tool.',
        details: [
            {
                title: 'Stay Focused',
                text: "Use the Pomodoro technique to break down your work into focused intervals. The timer is always accessible in the header. Customize the duration of your work sessions and breaks in the settings.",
                image: "https://picsum.photos/600/400",
                dataAiHint: "pomodoro timer clock"
            },
        ],
    },
];

export default function HelpPage() {
  return (
    <div className="flex flex-col h-full gap-6">
        <div className="flex items-center gap-4">
            <HelpCircle className="h-8 w-8 text-primary"/>
            <div>
                <h1 className="text-3xl font-bold font-headline">Help & Documentation</h1>
                <p className="text-muted-foreground">Find everything you need to know about using Donevia.</p>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Features Overview</CardTitle>
                <CardDescription>Click on any feature to learn more about it.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {features.map(feature => (
                         <AccordionItem value={feature.id} key={feature.id}>
                            <AccordionTrigger>
                                <div className="flex items-center gap-4">
                                    {feature.icon}
                                    <div className="text-left">
                                        <h3 className="font-semibold">{feature.title}</h3>
                                        <p className="text-sm text-muted-foreground font-normal">{feature.description}</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="pl-14 space-y-8">
                                    {feature.details.map((detail, index) => (
                                        <div key={index} className="grid md:grid-cols-2 gap-6 items-center">
                                            <div className="space-y-2">
                                                <h4 className="font-semibold text-lg">{detail.title}</h4>
                                                <p className="text-muted-foreground">{detail.text}</p>
                                            </div>
                                            <Image 
                                                src={detail.image}
                                                alt={detail.title}
                                                width={600}
                                                height={400}
                                                data-ai-hint={detail.dataAiHint}
                                                className="rounded-lg shadow-md"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mail /> Contact & Feedback</CardTitle>
                <CardDescription>Have a question, suggestion, or encountered a bug? We'd love to hear from you.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button asChild>
                    <a href="mailto:contact@donevia.com?subject=Donevia Feedback">
                        Send an Email
                    </a>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
