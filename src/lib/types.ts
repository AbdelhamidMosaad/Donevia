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
 *
 * Example Document:
 * {
 *   "ownerId": "user_abc",
 *   "title": "Project Phoenix",
 *   "color": "#4A90E2",
 *   "createdAt": Timestamp(November 26, 2023 at 5:00:00 PM UTC+2),
 *   "updatedAt": Timestamp(November 27, 2023 at 10:30:00 AM UTC+2)
 * }
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
 * (Query by notebookId)
 *
 * Example Document:
 * {
 *   "notebookId": "notebook_123",
 *   "title": "User Research",
 *   "order": 0
 * }
 */
export type Section = {
    id: string;
    notebookId: string;
    title: string;
    order: number; // For ordering sections within a notebook
};

/**
 * Represents a single page within a section.
 * Contains the actual content created by the user.
 *
 * Firestore Path: /users/{userId}/pages/{pageId}
 * (Query by sectionId)
 *
 * Example Document:
 * {
 *   "sectionId": "section_xyz",
 *   "title": "Initial User Interview Notes",
 *   "content": { "type": "doc", "content": [...] },
 *   "searchText": "initial user interview notes persona pain points...",
 *   "version": 2,
 *   "createdAt": Timestamp(November 27, 2023 at 11:00:00 AM UTC+2),
 *   "updatedAt": Timestamp(November 27, 2023 at 11:45:00 AM UTC+2)
 * }
 */
export type Page = {
    id: string;
    sectionId: string;
    title: string;
    content: any; // TipTap/ProseMirror JSON content
    searchText: string; // A lowercase string of all text for searching
    version: number; // For concurrency control
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

/**
 * Represents a file attachment associated with a page.
 *
 * Firestore Path: /users/{userId}/attachments/{attachmentId}
 * (Query by pageId)
 *
 * Example Document:
 * {
 *   "pageId": "page_abc",
 *   "filename": "interview_transcript.pdf",
 *   "url": "https://firebasestorage.googleapis.com/...",
 *   "mimeType": "application/pdf",
 *   "size": 102400,
 *   "uploadedAt": Timestamp(November 27, 2023 at 11:30:00 AM UTC+2)
 * }
 */
export type Attachment = {
    id: string;
    pageId: string;
    filename: string;
    url: string; // Cloud Storage URL
    mimeType: string;
    size: number; // in bytes
    uploadedAt: Timestamp;
};

/**
 * Represents a snapshot of a page's content at a specific point in time.
 *
 * Firestore Path: /users/{userId}/revisions/{revisionId}
 * (Query by pageId)
 *
 * Example Document:
 * {
 *   "pageId": "page_abc",
 *   "snapshot": { "type": "doc", "content": [...] },
 *   "createdAt": Timestamp(November 27, 2023 at 11:15:00 AM UTC+2),
 *   "authorId": "user_def"
 * }
 */
export type Revision = {
    id: string;
    pageId: string;
    snapshot: any; // TipTap/ProseMirror JSON content
    createdAt: Timestamp;
    authorId: string; // The user who made the change
};

/**
 * Represents sharing permissions for a notebook or a page.
 *
 * Firestore Path: /users/{userId}/shares/{shareId}
 *
 * Example Document (sharing a notebook):
 * {
 *   "notebookId": "notebook_123",
 *   "pageId": null,
 *   "sharedWithUserId": "user_xyz",
 *   "permission": "editor"
 * }
 */
export type Share = {
    id: string;
    notebookId: string | null; // ID of the notebook being shared
    pageId: string | null; // ID of the page being shared (if not the whole notebook)
    sharedWithUserId: string; // The user receiving access
    permission: 'viewer' | 'editor';
};
