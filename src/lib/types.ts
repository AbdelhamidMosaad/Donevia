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
