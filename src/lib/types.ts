

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
    tags: z.array(z.string()).optional(),
    category: z.string().optional(), // New category field
    createdAt: FirebaseTimestampSchema.optional(),
    ownerId: z.string(),
    reminder: z.enum(['none', '5m', '10m', '30m', '1h']).optional(),
    color: z.string().optional(),
    subtasks: z.array(SubtaskSchema).optional(),
    deleted: z.boolean().optional(),
    deletedAt: FirebaseTimestampSchema.optional(),
    timeSpentSeconds: z.number().optional(),
});
export type Task = z.infer<typeof TaskSchema>;


export type TaskList = {
    id: string;
    name: string;
    ownerId: string;
    createdAt: Timestamp;
    stages?: Stage[];
    folderId?: string | null;
};

export type TaskFolder = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
  parentId?: string | null;
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
    text?: string; // Keep for backwards compatibility
    content?: any; // For rich text content
    color: string;
    textColor: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    ownerId: string;
    priority: 'High' | 'Medium' | 'Low';
    position?: { x: number; y: number };
    gridPosition?: { col: number; row: number };
    order?: number;
    imageUrl?: string;
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

/** Meeting Notes */
export type Attendee = {
    id: string;
    name: string;
    email: string;
    jobTitle?: string;
};

export type AgendaItem = {
    id: string;
    topic: string;
    isCompleted: boolean;
};

export type MeetingNote = {
    id: string;
    title: string;
    startDate: Timestamp;
    endDate: Timestamp | null;
    location?: string;
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
    | 'topic-master-1' | 'topic-master-10' | 'topic-master-50' | 'topic-master-100'
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
    theme: 'light' | 'dark' | 'theme-indigo' | 'theme-purple' | 'theme-green' | 'theme-sunset' | 'theme-mint' | 'theme-jade' | 'theme-periwinkle' | 'theme-sky' | 'theme-orchid' | 'theme-oceanic' | 'theme-aqua' | 'theme-lime' | 'theme-marigold' | 'theme-ice' | 'theme-sage' | 'theme-coral';
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
    studyTrackerView?: 'card' | 'list' | 'board';
    studyTrackerCardSize?: 'small' | 'medium' | 'large';
    goalsCardSize?: 'small' | 'medium' | 'large';
    flashcardsCardSize?: 'small' | 'medium' | 'large';
    whiteboardCardSize?: 'small' | 'medium' | 'large';
    mindMapCardSize?: 'small' | 'medium' | 'large';
    bookmarksView?: 'card' | 'list';
    bookmarkCardSize?: 'x-small' |'small' | 'large';
    homeCardSize?: 'small' | 'medium' | 'large';
    homeView?: 'overview' | 'analytics';
    listViews?: { [listId: string]: 'board' | 'list' | 'table' | 'calendar' };
    tasksView?: 'board' | 'list' | 'table' | 'calendar' | 'analytics';
    taskSettings?: {
        stages: Stage[];
        categories: string[];
    };
    tableColumns?: { [listId: string]: string[] };
    sidebarOrder?: string[];
    toolOrder?: string[];
    currency?: Currency;
    studyProfile?: StudyProfile;
    englishCoachProfile?: EnglishCoachProfile;
    ttsEngine?: 'gemini' | 'browser';
    browserTtsVoice?: string;
    geminiTtsVoice?: string;
    ttsRate?: number;
    ttsPitch?: number;
    conversationCoachVoices?: string[];
    pronunciationCoachVoice?: string;
    vocabularyCoachVoice?: string;
    shadowingCoachVoice?: string;
    defaultNoteStyle?: 'detailed' | 'bullet' | 'outline' | 'summary' | 'concise';
    defaultComplexity?: 'simple' | 'medium' | 'advanced';
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
  parentId?: string | null;
};

/** Whiteboard */
export type WhiteboardNode = {
    id: string;
    userId: string;
    type: 'pen' | 'text' | 'sticky' | 'shape' | 'image';
    x: number;
    y: number;
    width?: number;
    height?: number;
    rotation?: number;
    color?: string; 
    strokeWidth?: number;
    text?: string;
    fontSize?: number;
    shape?: 'rectangle' | 'circle' | 'triangle' | 'diamond' | 'arrow-right' | 'arrow-left';
    points?: number[];
    isDeleted?: boolean;
    isArrow?: boolean;
    zIndex?: number;
    src?: string; // For images
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
};

export type WhiteboardConnection = {
    from: string;
    to: string;
    color?: string;
    strokeWidth?: number;
};

export type Whiteboard = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  connections?: WhiteboardConnection[];
  backgroundColor?: string;
  backgroundGrid?: 'dotted' | 'lined' | 'plain';
  scale?: number;
  x?: number;
  y?: number;
};

export type WhiteboardTemplate = {
    id: string;
    name: string;
    ownerId: string;
    createdAt: Timestamp;
    nodes: WhiteboardNode[];
    connections: WhiteboardConnection[];
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
    folderId: z.string().nullable().optional(),
    status: z.enum(['Not Started', 'In Progress', 'Completed']).optional(),
});
export type StudyGoal = z.infer<typeof StudyGoalSchema>;

export type StudyFolder = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Timestamp;
  parentId?: string | null;
};

export type ChapterStatus = 'Not Started' | 'In Progress' | 'Done';

export const StudyChapterSchema = z.object({
    id: z.string(),
    goalId: z.string(),
    title: z.string(),
    order: z.number(),
    createdAt: FirebaseTimestampSchema,
    ownerId: z.string(),
    isCompleted: z.boolean().optional(),
    status: z.enum(['Not Started', 'In Progress', 'Done']).optional(),
    timeSpentSeconds: z.number().optional(),
    dueDate: FirebaseTimestampSchema.nullable().optional(),
    reminder: z.enum(['none', 'on-due-date', '1-day', '2-days', '1-week']).optional(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
});
export type StudyChapter = z.infer<typeof StudyChapterSchema>;

export const StudyTopicResourceSchema = z.object({
    id: z.string(),
    title: z.string(),
    url: z.string(),
});
export type StudyTopicResource = z.infer<typeof StudyTopicResourceSchema>;

export const StudyTopicSchema = z.object({
    id: z.string(),
    goalId: z.string(),
    chapterId: z.string(),
    title: z.string(),
    isCompleted: z.boolean(),
    order: z.number(),
    createdAt: FirebaseTimestampSchema,
    ownerId: z.string(),
    notes: z.string().optional(),
    resources: z.array(StudyTopicResourceSchema).optional(),
    timeSpentSeconds: z.number().optional(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
});
export type StudyTopic = z.infer<typeof StudyTopicSchema>;

export const StudySessionSchema = z.object({
    id: z.string(),
    topicId: z.string(),
    date: FirebaseTimestampSchema,
    durationSeconds: z.number(),
    ownerId: z.string(),
});
export type StudySession = z.infer<typeof StudySessionSchema>;


/** Studying Assistant Feature */
export const StudyMaterialRequestSchema = GenkitStudyMaterialRequestSchema;
export type StudyMaterialRequest = z.infer<typeof StudyMaterialRequestSchema>;
export const StudyMaterialResponseSchema = GenkitStudyMaterialResponseSchema.extend({
    tags: z.array(z.string()).optional(),
});
export type StudyMaterialResponse = z.infer<typeof StudyMaterialResponseSchema>;
export const QuizQuestionSchema = GenkitQuizQuestionSchema;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export const FlashcardSchema = GenkitFlashcardSchema;
export type Flashcard = z.infer<typeof FlashcardSchema>;

// Lecture Notes Schemas
export const LectureNotesRequestSchema = z.object({
  sourceText: z.string().min(50, { message: 'Source text must be at least 50 characters.' }),
});
export type LectureNotesRequest = z.infer<typeof LectureNotesRequestSchema>;

export const LectureNotesResponseSchema = z.object({
    executiveSummary: z.string().describe("A high-level overview of the core themes."),
    definitions: z.array(z.object({
        term: z.string(),
        definition: z.string(),
    })).describe("A list of key concepts and their concise definitions."),
    comparativeAnalysis: z.array(z.object({
        title: z.string().describe("Title for the comparison, e.g., 'LP vs. NLP'"),
        table: z.string().describe("A Markdown table comparing technologies, systems, or methodologies."),
    })).optional().describe("An array of markdown tables for comparative analysis."),
    mainContent: z.string().describe("The main body of the notes, structured with Markdown headings, lists, and bolded key terms."),
    methodology: z.array(z.object({
        title: z.string().describe("The name of the tool, model, or methodology."),
        summary: z.string().describe("A summary of its purpose and function."),
    })).optional().describe("A synthesis of specific tools or mathematical models."),
    bestPractices: z.array(z.object({
        title: z.string().describe("The heading for the strategic/procedural list."),
        items: z.array(z.string()).describe("A list of best practices or governance points."),
    })).optional().describe("A collection of strategic 'Do/Don't' or procedural lists.")
});
export type LectureNotesResponse = z.infer<typeof LectureNotesResponseSchema>;


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

/** Mind Map */
export type MindMapNode = WhiteboardNode & { // Inherits from WhiteboardNode but with specific constraints for mindmap
    parentId: string | null;
    children: string[];
    collapsed: boolean;
    bold: boolean;
};

export type MindMapType = {
    id: string;
    name: string;
    ownerId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    nodes: Record<string, MindMapNode>;
    connections: WhiteboardConnection[]; // Re-use for simplicity
    scale?: number;
    pan?: { x: number, y: number };
};

/** Journal */
export type JournalEntry = {
    id: string;
    title: string;
    content: any; // TipTap JSON
    ownerId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    mood: 'Happy' | 'Neutral' | 'Sad';
    tags: string[];
};

export type Attachment = {
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    uploadedAt: Timestamp;
};

    
