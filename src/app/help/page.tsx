'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { HelpCircle, LayoutDashboard, Kanban, BarChart3, Sparkles, Repeat, Target, FileText, Bookmark, BrainCircuit, PenSquare, GitBranch, FileSignature, GraduationCap, Timer, Layers, Mail } from "lucide-react";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import placeholderImages from '@/app/lib/placeholder-images.json';
import { LectureNotesIcon } from "@/components/icons/tools/lecture-notes-icon";

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
                image: placeholderImages.dashboardTasksOverview.src,
                dataAiHint: placeholderImages.dashboardTasksOverview.hint,
            },
            {
                title: 'Task Analytics',
                text: "Gain insights into your productivity with charts showing task completion rates, a breakdown of tasks by their current status, and your performance over the last week.",
                image: placeholderImages.analyticsChartGraph.src,
                dataAiHint: placeholderImages.analyticsChartGraph.hint,
            },
            {
                title: 'AI-Powered Recap',
                text: "Let AI summarize your progress for you. Choose a daily or weekly period, and our AI will analyze your tasks to generate an encouraging summary of your achievements.",
                image: placeholderImages.aiRobotSummary.src,
                dataAiHint: placeholderImages.aiRobotSummary.hint,
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
                image: placeholderImages.projectFoldersList.src,
                dataAiHint: placeholderImages.projectFoldersList.hint,
            },
            {
                title: 'Board View',
                text: "Visualize your workflow with a Kanban-style board. Drag and drop tasks and columns to reorder them. Customize stages like 'To Do' and 'In Progress' in 'Board Settings'.",
                image: placeholderImages.kanbanBoardProject.src,
                dataAiHint: placeholderImages.kanbanBoardProject.hint,
            },
            {
                title: 'List, Table, and Calendar Views',
                text: "Switch between a simple list, a detailed table with customizable columns, and a full-page calendar view to see your tasks by their due dates.",
                image: placeholderImages.calendarScheduleTasks.src,
                dataAiHint: placeholderImages.calendarScheduleTasks.hint,
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
                image: placeholderImages.calendarCheckmarkHabit.src,
                dataAiHint: placeholderImages.calendarCheckmarkHabit.hint,
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
                image: placeholderImages.targetGoalAchievement.src,
                dataAiHint: placeholderImages.targetGoalAchievement.hint,
            },
             {
                title: 'Progress Journal',
                text: "Keep a running log of your thoughts, achievements, and setbacks for each goal. This journal helps you stay reflective and motivated throughout your journey.",
                image: placeholderImages.journalWritingProgress.src,
                dataAiHint: placeholderImages.journalWritingProgress.hint,
            },
        ],
    },
    {
        id: 'lecture-notes',
        icon: <LectureNotesIcon className="h-6 w-6 text-orange-500" />,
        title: 'Lecture Notes Generator',
        description: 'Automatically create structured lecture notes from your documents.',
        details: [
            {
                title: 'Upload and Generate',
                text: "Upload a PDF or DOCX file, and the AI will generate structured, easy-to-understand notes. It includes headings, bullet points, and diagram placeholders.",
                image: placeholderImages.lectureNotesGeneration.src,
                dataAiHint: placeholderImages.lectureNotesGeneration.hint,
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
                text: "Break down large study goals into chapters and topics. Drag and drop to reorder your study plan and track progress with satisfying checklists and progress bars.",
                image: placeholderImages.studyPlanChecklist.src,
                dataAiHint: placeholderImages.studyPlanChecklist.hint,
            },
            {
                title: 'Time Tracking & Gamification',
                text: "Use the built-in timer for each topic to log your study sessions. Level up, earn badges, and build a study streak to stay motivated on your learning journey.",
                image: placeholderImages.gamificationLevelUp.src,
                dataAiHint: placeholderImages.gamificationLevelUp.hint,
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
                title: 'Manual and Bulk Creation',
                text: "Create cards one by one or import/export entire decks using a simple JSON format. This gives you full control over your study materials.",
                image: placeholderImages.aiFlashcardsGeneration.src,
                dataAiHint: placeholderImages.aiFlashcardsGeneration.hint,
            },
            {
                title: 'Spaced Repetition System (SRS)',
                text: "The study mode uses an intelligent SRS algorithm to show you cards at the optimal time for memorization, ensuring you retain information effectively.",
                image: placeholderImages.learningAlgorithmChart.src,
                dataAiHint: placeholderImages.learningAlgorithmChart.hint,
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
                image: placeholderImages.stickyNotesBoard.src,
                dataAiHint: placeholderImages.stickyNotesBoard.hint,
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
                image: placeholderImages.bookmarkCollectionWeb.src,
                dataAiHint: placeholderImages.bookmarkCollectionWeb.hint,
            },
        ],
    },
    {
        id: 'be-creative',
        icon: <BrainCircuit className="h-6 w-6 text-violet-500" />,
        title: 'Be Creative',
        description: 'A collection of visual tools to brainstorm and plan.',
        details: [
             {
                title: 'Brainstorming Canvas',
                text: "Capture ideas as colored cards and arrange them in a structured grid. It's perfect for quickly getting thoughts down and organizing them later.",
                image: placeholderImages.brainstormingIdeaCards.src,
                dataAiHint: placeholderImages.brainstormingIdeaCards.hint,
            },
            {
                title: 'Whiteboard',
                text: "A free-form digital canvas. Use the pen, eraser, and shape tools to draw, sketch, and visualize your ideas without limits. Customize the background to suit your needs.",
                image: placeholderImages.digitalWhiteboardDrawing.src,
                dataAiHint: placeholderImages.digitalWhiteboardDrawing.hint,
            },
            {
                title: 'Mind Map',
                text: "Create structured diagrams by connecting nodes. Add child nodes to build out your ideas logically. Use fullscreen for a focused experience and export your work as an image or PDF.",
                image: placeholderImages.mindMapChart.src,
                dataAiHint: placeholderImages.mindMapChart.hint,
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
                image: placeholderImages.textEditorDocument.src,
                dataAiHint: placeholderImages.textEditorDocument.hint,
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
                image: placeholderImages.pomodoroTimerClock.src,
                dataAiHint: placeholderImages.pomodoroTimerClock.hint,
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
                <p className="text-muted-foreground">Find everything you need to know about Donevia.</p>
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
                    <a href="mailto:abdelhamid.mosaad@gmail.com?subject=Donevia Feedback">
                        Send an Email
                    </a>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
