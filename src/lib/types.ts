import type { Timestamp } from "firebase/firestore";

export type Task = {
  id: string;
  title: string;
  description?: string;
  status: 'Backlog' | 'To Do' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: Timestamp;
  tags: string[];
  createdAt: Timestamp;
};
