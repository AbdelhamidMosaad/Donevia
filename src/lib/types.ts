
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

/** Bookmarks */
export type BookmarkCategory = 'work' | 'personal' | 'education' | 'entertainment' | 'shopping' | 'other' | string;
export type Bookmark = {
    id: string;
    title: string;
    url: string;
    description?: string;
    category: BookmarkCategory;
    createdAt: Timestamp;
};

/** User Settings */
export interface UserSettings {
    theme: 'light' | 'dark' | 'theme-indigo' | 'theme-purple' | 'theme-green' | 'theme-lavender' | 'theme-cornflower' | 'theme-teal' | 'theme-orange' | 'theme-mint';
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
    bookmarkSettings?: {
        categories: string[];
    };
    workTrackerSettings?: WorkTrackerSettings;
}

/** Docs */
export type Doc = {
    id: string;
    ownerId: string;
    title: string;
    content: any;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    folderId?: string | null;
};

export type DocFolder = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
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

/** Work Activity Tracker */
export type WorkActivity = {
    id: string;
    date: Timestamp;
    appointment: string;
    category: string;
    description: string;
    customer: string;
    invoiceNumber?: string;
    amount?: number;
    travelAllowance?: number;
    overtimeHours?: number;
    overtimeDays?: number;
    notes?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export type WorkTrackerSettingItem = {
    id: string;
    value: string;
    color: string;
};

export type WorkTrackerSettings = {
    appointmentOptions: WorkTrackerSettingItem[];
    categoryOptions: WorkTrackerSettingItem[];
    customerOptions: WorkTrackerSettingItem[];
}


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


/** Learning Tool Feature */
export type QuizQuestionType = 'multiple-choice' | 'true-false' | 'short-answer';

export const QuizQuestionSchema = z.object({
  questionText: z.string(),
  questionType: z.enum(['multiple-choice', 'true-false', 'short-answer']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().describe('The correct answer. For multiple-choice, this is the exact text of the correct option.'),
  explanation: z.string(),
});

export const FlashcardSchema = z.object({
  term: z.string(),
  definition: z.string(),
});

export const StudyMaterialRequestSchema = z.object({
  sourceText: z.string().min(50, { message: 'Source text must be at least 50 characters.' }),
  generationType: z.enum(['quiz', 'flashcards', 'notes']),
  quizOptions: z.object({
    numQuestions: z.number().min(1).max(20),
    questionTypes: z.array(z.enum(['multiple-choice', 'true-false', 'short-answer'])),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  }).optional(),
  flashcardsOptions: z.object({
    numCards: z.number().min(1).max(30),
    style: z.enum(['basic', 'detailed', 'question']),
  }).optional(),
  notesOptions: z.object({
    style: z.enum(['detailed', 'bullet', 'outline', 'summary', 'concise']),
    complexity: z.enum(['simple', 'medium', 'advanced']),
  }).optional(),
});

export const StudyMaterialResponseSchema = z.object({
  title: z.string().describe('A concise and relevant title for the generated material.'),
  materialType: z.enum(['quiz', 'flashcards', 'notes']),
  quizContent: z.array(QuizQuestionSchema).optional(),
  flashcardContent: z.array(FlashcardSchema).optional(),
  notesContent: z.string().optional(),
});
