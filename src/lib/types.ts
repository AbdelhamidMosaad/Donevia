

import type { Timestamp } from "firebase/firestore";
import { z } from 'zod';
import { 
    StudyMaterialRequestSchema as GenkitStudyMaterialRequestSchema, 
    StudyMaterialResponseSchema as GenkitStudyMaterialResponseSchema,
    QuizQuestionSchema as GenkitQuizQuestionSchema,
    FlashcardSchema as GenkitFlashcardSchema,
} from '@/ai/flows/learning-tool-flow';
import type { MasteryLevel } from "./types/vocabulary";


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

export const SubtaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    isCompleted: z.boolean(),
    dueDate: FirebaseTimestampSchema.optional().nullable(),
});
export type Subtask = z.infer<typeof SubtaskSchema>;

export const TaskSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    reflection: z.string().optional(),
    status: z.string(), // Customizable stage name
    priority: z.enum(['Low', 'Medium', 'High']),
    dueDate: FirebaseTimestampSchema,
    tags: z.array(z.string()),
    createdAt: FirebaseTimestampSchema.optional(),
    listId: z.string(),
    ownerId: z.string(),
    reminder: z.enum(['none', '5m', '10m', '30m', '1h']).optional(),
    color: z.string().optional(),
    subtasks: z.array(SubtaskSchema).optional(),
    deleted: z.boolean().optional(),
    deletedAt: FirebaseTimestampSchema.optional(),
});
export type Task = z.infer<typeof TaskSchema>;


export type TaskList = {
    id: string;
    name: string;
    ownerId: string;
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
    ownerId: string;
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
    ownerId: string;
    color?: string;
};

/** CRM Types */
export type Attachment = {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: Timestamp;
}

export type CustomField = {
  id: string;
  key: string;
  value: string;
}

export type Quotation = {
  id: string;
  quoteNumber: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
  createdAt: Timestamp;
  attachments: Attachment[];
}

export type Invoice = {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  dueDate: Timestamp;
  createdAt: Timestamp;
  attachments: Attachment[];
}

export type Client = {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  ownerId: string;
  customFields: CustomField[];
  quotations: Quotation[];
  invoices: Invoice[];
};

export type PipelineStage = {
  id: string;
  name: string;
  order: number;
};

export type CrmSettings = {
  pipelineStages: PipelineStage[];
}

export type ClientRequestStage = string; // No longer a strict union type
export type LossReason = 'Price' | 'Timing' | 'Competition' | 'Features' | 'Other';

export type ClientRequest = {
  id: string;
  title: string;
  clientId: string;
  stage: ClientRequestStage;
  ownerId: string;
  value?: number;
  lossReason?: LossReason | null;
  quoteAmount?: number;
  invoiceAmount?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

/** Meeting Notes */
export type Attendee = {
    id: string;
    name: string;
    email: string;
};

export type AgendaItem = {
    id: string;
    topic: string;
    presenter: string;
    time: number; // in minutes
    isCompleted: boolean;
};

export type MeetingNote = {
    id: string;
    title: string;
    date: Timestamp;
    attendees: Attendee[];
    agenda: AgendaItem[];
    notes: any; // TipTap JSON content
    summary?: string;
    actionItems?: any[]; // For future use
    ownerId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

/** Gamification */
export type BadgeId = 
    | 'subtopic-master-1' | 'subtopic-master-10' | 'subtopic-master-50' | 'subtopic-master-100'
    | 'goal-crusher-1' | 'goal-crusher-5'
    | 'perfect-week' | 'knowledge-architect';

export type Badge = {
    id: BadgeId;
    name: string;
    description: string;
    icon: string;
};


export type StudyProfile = {
    currentStreak: number;
    longestStreak: number;
    lastStudyDay: string; // YYYY-MM-DD
    level: number;
    experiencePoints: number;
    earnedBadges: BadgeId[];
};

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'EGP';

/** User Settings */
export interface UserSettings {
    theme: 'light' | 'dark' | 'theme-indigo' | 'theme-purple' | 'theme-green' | 'theme-sunset' | 'theme-mint' | 'theme-jade' | 'theme-periwinkle' | 'theme-sky' | 'theme-orchid' | 'theme-sage' | 'theme-coral';
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
        | 'jetbrains-mono'
        | 'bahnschrift';
    sidebarVariant: 'sidebar';
    sidebarOpen: boolean;
    notificationSound: boolean;
    taskListsView?: 'card' | 'list';
    taskListsCardSize?: 'small' | 'medium' | 'large';
    docsView?: 'card' | 'list';
    docsCardSize?: 'small' | 'medium' | 'large';
    meetingNotesView?: 'card' | 'list';
    meetingNotesCardSize?: 'small' | 'medium' | 'large';
    notesView?: 'board' | 'canvas';
    studyTrackerView?: 'card' | 'list';
    goalsCardSize?: 'small' | 'medium' | 'large';
    flashcardsCardSize?: 'small' | 'medium' | 'large';
    whiteboardCardSize?: 'small' | 'medium' | 'large';
    mindMapCardSize?: 'small' | 'medium' | 'large';
    bookmarksView?: 'card' | 'list';
    bookmarkCardSize?: 'x-small' |'small' | 'large';
    homeCardSize?: 'small' | 'medium' | 'large';
    listViews?: { [listId: string]: 'board' | 'list' | 'table' | 'calendar' };
    tableColumns?: { [listId: string]: string[] };
    sidebarOrder?: string[];
    toolOrder?: string[];
    bookmarkSettings?: {
        categories: string[];
    };
    workTrackerSettings?: WorkTrackerSettings;
    crmSettings?: CrmSettings;
    studyProfile?: StudyProfile;
    currency?: Currency;
    englishCoachProfile?: EnglishCoachProfile;
}

/** Brainstorming */
export type BrainstormingIdea = {
    id: string;
    content: string;
    color: string;
    priority: 'High' | 'Medium' | 'Low';
    tags?: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
    ownerId: string;
    order: number;
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
    backgroundColor?: string;
    margin?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
};

export type DocFolder = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
};

/** Whiteboard */
export type Whiteboard = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  backgroundColor?: string;
  backgroundGrid?: 'dotted' | 'lined' | 'plain';
};

/** Mind Map */
export type MindMapNode = {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    title: string;
    style: string;
    backgroundColor: string;
    color: string;
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
};

export type MindMapConnection = {
    from: string;
    to: string;
};

export type MindMap = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  nodes: MindMapNode[];
  connections: MindMapConnection[];
  backgroundColor?: string;
  backgroundGrid?: 'dotted' | 'lined' | 'plain';
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
    hasSessionStarted?: boolean;
}

/** Goals */
export const GoalSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    startDate: FirebaseTimestampSchema,
    targetDate: FirebaseTimestampSchema,
    status: z.enum(['Not Started', 'In Progress', 'Completed', 'Archived']),
    createdAt: FirebaseTimestampSchema,
    updatedAt: FirebaseTimestampSchema,
    ownerId: z.string(),
});
export type Goal = z.infer<typeof GoalSchema>;

export const MilestoneSchema = z.object({
    id: z.string(),
    goalId: z.string(),
    title: z.string(),
    description: z.string(),
    dueDate: FirebaseTimestampSchema,
    isCompleted: z.boolean(),
    createdAt: FirebaseTimestampSchema,
    updatedAt: FirebaseTimestampSchema,
    ownerId: z.string(),
});
export type Milestone = z.infer<typeof MilestoneSchema>;

export type ProgressUpdate = {
    id: string;
    goalId: string;
    milestoneId?: string | null;
    text: string;
    createdAt: Timestamp;
    ownerId: string;
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
    ownerId: string;
};

export type WorkTrackerSettingItem = {
    id: string;
    value: string;
    color: string;
};

export type WorkTrackerSettings = {
    ownerId: string;
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
    ownerId: string;
};

export type HabitCompletion = {
    id: string;
    habitId: string;
    date: string; // YYYY-MM-DD
    createdAt: Timestamp;
    ownerId: string;
};

/** Study Tracker */
export type StudyDifficulty = 'Easy' | 'Medium' | 'Hard';

export const StudyGoalSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    createdAt: FirebaseTimestampSchema,
    updatedAt: FirebaseTimestampSchema,
    ownerId: z.string(),
    dueDate: FirebaseTimestampSchema.nullable().optional(),
});
export type StudyGoal = z.infer<typeof StudyGoalSchema>;

export const StudyChapterSchema = z.object({
    id: z.string(),
    goalId: z.string(),
    title: z.string(),
    order: z.number(),
    createdAt: FirebaseTimestampSchema,
    ownerId: z.string(),
    dueDate: FirebaseTimestampSchema.nullable().optional(),
    reminder: z.enum(['none', 'on-due-date', '1-day', '2-days', '1-week']).optional(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
});
export type StudyChapter = z.infer<typeof StudyChapterSchema>;

export const StudySubtopicResourceSchema = z.object({
    id: z.string(),
    title: z.string(),
    url: z.string(),
});
export type StudySubtopicResource = z.infer<typeof StudySubtopicResourceSchema>;

export const StudySubtopicSchema = z.object({
    id: z.string(),
    goalId: z.string(),
    chapterId: z.string(),
    title: z.string(),
    isCompleted: z.boolean(),
    order: z.number(),
    createdAt: FirebaseTimestampSchema,
    ownerId: z.string(),
    notes: z.string().optional(),
    resources: z.array(StudySubtopicResourceSchema).optional(),
    timeSpentSeconds: z.number().optional(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
});
export type StudySubtopic = z.infer<typeof StudySubtopicSchema>;

export const StudySessionSchema = z.object({
    id: z.string(),
    subtopicId: z.string(),
    date: FirebaseTimestampSchema,
    durationSeconds: z.number(),
    ownerId: z.string(),
});
export type StudySession = z.infer<typeof StudySessionSchema>;


/** Learning Tool Feature */
export const StudyMaterialRequestSchema = GenkitStudyMaterialRequestSchema;
export type StudyMaterialRequest = z.infer<typeof StudyMaterialRequestSchema>;
export const StudyMaterialResponseSchema = GenkitStudyMaterialResponseSchema;
export type StudyMaterialResponse = z.infer<typeof StudyMaterialResponseSchema>;
export const QuizQuestionSchema = GenkitQuizQuestionSchema;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export const FlashcardSchema = GenkitFlashcardSchema;
export type Flashcard = z.infer<typeof FlashcardSchema>;


/** English Coach */
export type EnglishCoachProfile = {
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  dailyVocab?: { word: string; sentence: string }[];
  dailyVocabDate?: string; // YYYY-MM-DD
  createdAt: Timestamp;
};

export type UserVocabularyWord = {
    id: string;
    word: string;
    pronunciation: string;
    meaning: string;
    example: string;
    sourceLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    masteryLevel: MasteryLevel;
    ownerId: string;
    createdAt: Timestamp;
}

export type Recording = {
  id: string;
  uid: string;
  url: string;
  createdAt: Timestamp;
  feedback?: any; // To store AI feedback
};


/** Flashcard Tool */
export type FlashcardFolder = {
    id: string;
    name: string;
    ownerId: string;
    createdAt: Timestamp;
};

export type Deck = {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
    isPublic: boolean;
    editors: string[];
    viewers: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
    folderId?: string | null;
};

export type FlashcardToolCard = {
    id: string;
    deckId: string;
    front: string;
    back: string;
    correct?: number;
    wrong?: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    ownerId: string;
};

export type FlashcardProgress = {
    repetitions: number;
    efactor: number;
    intervalDays: number;
    dueDate: string; // ISO string
    lastReviewedAt: string | null; // ISO string
};

/** Planner */
export type PlannerCategory = {
    id: string;
    name: string;
    color: string;
    ownerId: string;
}

export type Reminder = 'none' | '5m' | '15m' | '30m' | '1h' | '1d';

export type PlannerEvent = {
    id: string;
    title: string;
    description?: string;
    start: Date;
    end: Date;
    allDay: boolean;
    categoryId?: string;
    ownerId: string;
    taskId?: string;
    recurring?: 'daily' | 'weekly' | 'monthly' | 'none';
    recurringEndDate?: Date | null;
    attachments: Attachment[];
    reminders: Reminder[];
    googleEventId?: string;
    color?: string;
};

/** Google Calendar */
export type GoogleCalendarEvent = {
    id: string;
    summary: string;
    description?: string;
    start: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    end: {
        dateTime?: string;
        date?: string;
        timeZone?: string;
    };
    htmlLink: string;
    isGoogleEvent?: boolean;
    [key: string]: any;
};

/** Trading Tracker */
export type TradeNote = {
  id: string;
  date: Timestamp;
  text: string;
};

export type Trade = {
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  entryDate: Timestamp;
  exitDate: Timestamp;
  quantity: number;
  fees: number;
  profitOrLoss: number;
  notes?: TradeNote[];
  chartUrl?: string;
  strategyId?: string;
  attachments?: Attachment[];
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type TradingStrategy = {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    createdAt: Timestamp;
}

export type WatchlistItem = {
    id: string;
    symbol: string;
    notes?: string;
    status: 'Watching' | 'Entered' | 'Archived';
    reminderDate?: Timestamp | null;
    priority?: 'High' | 'Medium' | 'Low';
    ownerId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/** Interview Prep Tool */
export type InterviewSession = {
    id: string;
    ownerId: string;
    jobTitle: string;
    industry: string;
    experienceLevel: 'entry' | 'mid' | 'senior';
    createdAt: Timestamp;
    updatedAt: Timestamp;
    status: 'not-started' | 'in-progress' | 'completed';
};

export type InterviewQuestion = {
    id: string;
    sessionId: string;
    questionText: string;
    category: 'HR' | 'Technical' | 'Behavioral';
    userAnswerText?: string;
    userAnswerAudioUrl?: string;
    userAnswerVideoUrl?: string;
    feedback?: InterviewFeedback;
    createdAt: Timestamp;
};

export type InterviewFeedback = {
    clarity: number; // Score 1-10
    relevance: number; // Score 1-10
    confidence: number; // Score 1-10
    suggestions: string[];
    overallAssessment: string;
};

    
