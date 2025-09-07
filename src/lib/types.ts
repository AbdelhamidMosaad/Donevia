
import type { Timestamp } from "firebase/firestore";
import { z } from 'zod';

/** Task Management Types */
export const StageSchema = z.object({
    id: z.string(),
    name: z.string(),
    order: z.number(),
});
export type Stage = z.infer<typeof StageSchema>;

const FirebaseTimestampSchema = z.custom<Timestamp>(
  (val) => val instanceof Timestamp,
  "Invalid Timestamp"
);

export const TaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    reflection: z.string().optional(),
    status: z.string(), // Customizable stage name
    priority: z.enum(['Low', 'Medium', 'High']),
    dueDate: FirebaseTimestampSchema,
    tags: z.array(z.string()),
    createdAt: FirebaseTimestampSchema,
    listId: z.string(),
    reminder: z.enum(['none', '5m', '10m', '30m', '1h']).optional(),
});
export type Task = z.infer<typeof TaskSchema>;


export type TaskList = {
    id: string;
    name: string;
    createdAt: Timestamp;
    stages?: Stage[];
};

export type BoardTemplate = {
    id: string;
    name: string;
    stages: { name: string; order: number }[];
};

/** Sticky Notes */
export type StickyNote = {
    id: string;
    title: string;
    text: string;
    color: string;
    textColor: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    priority: 'High' | 'Medium' | 'Low';
    position?: { x: number; y: number };
    gridPosition?: { col: number; row: number };
};

/** Notebooks Data Model */
export type Notebook = {
    id: string;
    ownerId: string;
    title: string;
    color: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export type Section = {
    id: string;
    notebookId: string;
    title: string;
    order: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export type Page = {
    id: string;
    sectionId: string;
    title: string;
    content: any; // TipTap/ProseMirror JSON content
    searchText: string;
    version: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastEditedBy?: string;
    canvasColor?: string;
};

export type Attachment = {
    id: string;
    pageId: string;
    filename: string;
    url: string;
    thumbnailUrl: string | null;
    mimeType: string;
    size: number;
    uploadedAt: Timestamp;
    userId: string;
};

export type Revision = {
    id: string;
    pageId: string;
    title: string;
    snapshot: any;
    createdAt: Timestamp;
    authorId: string;
    reason?: string;
};

export type Share = {
    id: string;
    notebookId: string | null;
    pageId: string | null;
    sharedWithUserId: string;
    permission: 'viewer' | 'editor';
};

/** User Settings */
export interface UserSettings {
    theme: 'light' | 'dark' | 'theme-indigo' | 'theme-purple' | 'theme-green';
    font:
        | 'inter'
        | 'roboto'
        | 'open-sans'
        | 'lato'
        | 'poppins'
        | 'source-sans-pro'
        | 'nunito'
        | 'montserrat'
        | 'playfair-display'
        | 'jetbrains-mono';
    sidebarOpen: boolean;
    notificationSound: boolean;
    docsView?: 'card' | 'list';
    lectureNotesView?: 'card' | 'list';
    sidebarOrder?: string[];
}

/** Docs */
export type Doc = {
    id: string;
    ownerId: string;
    title: string;
    content: any;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

/** Lecture Notes */
export type LectureNote = {
    id: string;
    title: string;
    sourceText: string;
    content: any; // TipTap JSON
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

/** Pomodoro */
export type PomodoroMode = 'work' | 'shortBreak' | 'longBreak';

export interface PomodoroSettingsData {
    workMinutes: number;
    shortBreakMinutes: number;
    longBreakMinutes: number;
    longBreakInterval: number;
}

export interface PomodoroState extends PomodoroSettingsData {
    mode: PomodoroMode;
    isActive: boolean;
    sessionsCompleted: number;
    targetEndTime: Timestamp | null;
}

/** Goals */
export type Goal = {
    id: string;
    title: string;
    description: string;
    startDate: Timestamp;
    targetDate: Timestamp;
    status: 'Not Started' | 'In Progress' | 'Completed' | 'Archived';
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export type Milestone = {
    id: string;
    goalId: string;
    title: string;
    description: string;
    dueDate: Timestamp;
    isCompleted: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export type ProgressUpdate = {
    id: string;
    goalId: string;
    milestoneId?: string | null;
    text: string;
    createdAt: Timestamp;
};

/** CRM */
export type CustomField = {
    id: string;
    key: string;
    value: string;
};

export type CrmAttachment = {
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    uploadedAt: Timestamp;
};

export type Client = {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    company?: string;
    notes?: string;
    status: 'lead' | 'active' | 'inactive' | 'archived';
    customFields: CustomField[];
    quotations: Quotation[];
    invoices: Invoice[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export type Quotation = {
    id: string;
    clientId: string;
    quotationNumber: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected';
    attachments: CrmAttachment[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export type Invoice = {
    id: string;
    clientId: string;
    invoiceNumber: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    attachments: CrmAttachment[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export type ClientRequest = {
    id: string;
    clientId: string;
    title: string;
    description?: string;
    stage: 'new-request' | 'quotation' | 'execution' | 'reporting' | 'invoice' | 'completed' | 'win' | 'lost';
    invoiceAmount?: number;
    lossReason?: 'Budget' | 'Competition' | 'Timing' | 'Scope' | 'Other' | null;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

/** Habits */
export type Habit = {
    id: string;
    name: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export type HabitCompletion = {
    id: string;
    habitId: string;
    date: string; // YYYY-MM-DD
    createdAt: Timestamp;
};

/** Recap Feature */
export const RecapRequestSchema = z.object({
  tasks: z.array(TaskSchema),
  period: z.enum(['daily', 'weekly']),
});
export type RecapRequest = z.infer<typeof RecapRequestSchema>;

export const RecapResponseSchema = z.object({
  title: z.string().describe('A short, engaging title for the recap.'),
  summary: z.string().describe("A 2-3 sentence paragraph summarizing the user's activity."),
  highlights: z.array(z.string()).describe('A bulleted list of 2-4 key highlights or achievements.'),
});
export type RecapResponse = z.infer<typeof RecapResponseSchema>;
