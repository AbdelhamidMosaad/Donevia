
import type { Timestamp } from "firebase/firestore";

export type Stage = {
    id: string;
    name: string;
    order: number;
}

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: string; // Now a string to accommodate custom stages
  priority: 'Low' | 'Medium' | 'High';
  dueDate: Timestamp;
  tags: string[];
  createdAt: Timestamp;
  listId: string;
  reminder?: 'none' | '5m' | '10m' | '30m' | '1h';
};

export type TaskList = {
    id: string;
    name: string;
    createdAt: Timestamp;
    stages?: Stage[];
}

export type BoardTemplate = {
    id: string;
    name:string;
    stages: { name: string; order: number }[];
}

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


// --- Notebooks Data Model ---

/**
 * Represents a top-level notebook, which is a collection of sections.
 *
 * Firestore Path: /users/{userId}/notebooks/{notebookId}
 */
export type Notebook = {
    id: string;
    ownerId: string;
    title: string;
    color: string; // e.g., a hex color for the notebook tab
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

/**
 * Represents a section within a notebook, which is a collection of pages.
 *
 * Firestore Path: /users/{userId}/sections/{sectionId}
 */
export type Section = {
    id:string;
    notebookId: string;
    title: string;
    order: number; // For ordering sections within a notebook
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

/**
 * Represents a single page within a section.
 * Contains the actual content created by the user.
 *
 * Firestore Path: /users/{userId}/pages/{pageId}
 */
export type Page = {
    id: string;
    sectionId: string;
    title: string;
    content: any; // TipTap/ProseMirror JSON content
    searchText: string; // A lowercase string of all text for searching
    version: number; // For optimistic concurrency control
    createdAt: Timestamp;
    updatedAt: Timestamp;
    lastEditedBy?: string; // UID of the last user who edited
    canvasColor?: string;
};

/**
 * Represents a file attachment associated with a page.
 *
 * Firestore Path: /users/{userId}/attachments/{attachmentId}
 */
export type Attachment = {
    id: string;
    pageId: string;
    filename: string;
    url: string; // Cloud Storage URL
    thumbnailUrl: string | null;
    mimeType: string;
    size: number; // in bytes
    uploadedAt: Timestamp;
    userId: string;
};

/**
 * Represents a snapshot of a page's content at a specific point in time.
 *
 * Firestore Path: /users/{userId}/revisions/{revisionId}
 */
export type Revision = {
    id: string;
    pageId: string;
    title: string;
    snapshot: any; // TipTap/ProseMirror JSON content
    createdAt: Timestamp;
    authorId: string; // The user who made the change
    reason?: string; // e.g., "conflict-save-attempt"
};

/**
 * Represents sharing permissions for a notebook or a page.
 *
 * Firestore Path: /users/{userId}/shares/{shareId}
 */
export type Share = {
    id: string;
    notebookId: string | null; // ID of the notebook being shared
    pageId: string | null; // ID of the page being shared (if not the whole notebook)
    sharedWithUserId: string; // The user receiving access
    permission: 'viewer' | 'editor';
};


/**
 * Represents user-specific application settings.
 *
 * Firestore Path: /users/{userId}/profile/settings
 */
export interface UserSettings {
    theme: 'light' | 'dark' | 'theme-indigo' | 'theme-purple' | 'theme-green';
    font: 'inter' | 'roboto' | 'open-sans' | 'lato' | 'poppins' | 'source-sans-pro' | 'nunito' | 'montserrat' | 'playfair-display' | 'jetbrains-mono';
    sidebarOpen: boolean;
    notificationSound: boolean;
    docsView?: 'card' | 'list';
}

/**
 * Represents a document in the "Docs" module.
 *
 * Firestore Path: /users/{userId}/docs/{docId}
 */
export type Doc = {
    id: string;
    ownerId: string;
    title: string;
    content: any; // TipTap/ProseMirror JSON content
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

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

// --- Goals Data Model ---

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
    milestoneId?: string | null; // Optional: can be linked to a milestone
    text: string;
    createdAt: Timestamp;
};

// --- Habit Tracker Data Model ---

export type Habit = {
    id: string;
    title: string;
    description?: string;
    icon: string; // Lucide icon name
    frequency: 'daily'; // Initially just daily, can be expanded
    createdAt: Timestamp;
    updatedAt: Timestamp;
    archived: boolean;
};

export type HabitCompletion = {
    id: string;
    habitId: string;
    date: string; // YYYY-MM-DD format for easy querying
    completedAt: Timestamp;
};
