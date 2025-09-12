import type { Timestamp } from "firebase/firestore";
import { z } from 'zod';
import { 
    StudyMaterialRequestSchema as GenkitStudyMaterialRequestSchema, 
    StudyMaterialResponseSchema as GenkitStudyMaterialResponseSchema,
    QuizQuestionSchema as GenkitQuizQuestionSchema,
    FlashcardSchema as GenkitFlashcardSchema,
} from '@/ai/flows/learning-tool-flow';


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
    docsView?: 'card' | 'list';
    notesView?: 'board' | 'canvas';
    meetingNotesView?: 'card' | 'list';
    studyTrackerView?: 'card' | 'list';
    bookmarksView?: 'card' | 'list';
    listViews?: { [listId: string]: 'board' | 'list' | 'table' | 'calendar' };
    tableColumns?: { [listId: string]: string[] };
    sidebarOrder?: string[];
    bookmarkSettings?: {
        categories: string[];
    };
    workTrackerSettings?: WorkTrackerSettings;
    crmSettings?: CrmSettings;
    studyProfile?: StudyProfile;
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
    ownerId: string;
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
    ownerId: string;
};

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

/** Recap Feature */
export const RecapRequestSchema = z.object({
  tasks: z.array(TaskSchema),
  period: z.enum(['daily', 'weekly']),
});
export type RecapRequest = z.infer<typeof RecapRequestSchema>;

export const RecapResponseSchema = z.object({
  title: z.string().describe('A short, engaging title for the recap.'),
  quantitativeSummary: z.object({
    tasksCompleted: z.number().describe('The number of tasks completed in the period.'),
    tasksCreated: z.number().describe('The number of tasks created in the period.'),
    tasksOverdue: z.number().describe('The number of tasks that are overdue.'),
  }),
  accomplishments: z.array(z.string()).describe('A bulleted list of 2-4 key achievements.'),
  challenges: z.array(z.string()).describe('A bulleted list of 1-3 challenges or overdue items.'),
  productivityInsights: z.string().describe('A 2-3 sentence paragraph offering one key observation or piece of advice.'),
  nextPeriodFocus: z.string().describe('A 1-2 sentence summary suggesting a focus for the next period.'),
});
export type RecapResponse = z.infer<typeof RecapResponseSchema>;


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

/** Study Tracker */
export type StudyDifficulty = 'Easy' | 'Medium' | 'Hard';

export type StudyGoal = {
    id: string;
    title: string;
    description?: string;
    tags?: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
    ownerId: string;
    dueDate?: Timestamp | null;
}

export type StudyChapter = {
    id: string;
    goalId: string;
    title: string;
    order: number;
    createdAt: Timestamp;
    ownerId: string;
    dueDate?: Timestamp | null;
    reminder?: 'none' | 'on-due-date' | '1-day' | '2-days' | '1-week';
    difficulty?: StudyDifficulty;
}

export type StudySubtopicResource = {
    id: string;
    title: string;
    url: string;
}

export type StudySubtopic = {
    id: string;
    goalId: string;
    chapterId: string;
    title: string;
    isCompleted: boolean;
    order: number;
    createdAt: Timestamp;
    ownerId: string;
    notes?: string;
    resources?: StudySubtopicResource[];
    timeSpentSeconds?: number;
    difficulty?: StudyDifficulty;
}

export type StudySession = {
    id: string;
    subtopicId: string;
    date: Timestamp;
    durationSeconds: number;
    ownerId: string;
}

/** Planner */
export type PlannerCategory = {
    id: string;
    name: string;
    color: string;
    ownerId: string;
}

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
    reminder: 'none' | '5m' | '15m' | '30m' | '1h' | '1d';
    googleEventId?: string;
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
export type Trade = {
  id: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  entryDate: Timestamp;
  exitDate: Timestamp;
  quantity: number;
  fees: number;
  profitOrLoss: number;
  notes?: string;
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
