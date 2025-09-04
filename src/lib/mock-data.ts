export type Task = {
  id: string;
  title: string;
  status: 'Backlog' | 'To Do' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: Date;
  tags: string[];
};

export const tasks: Task[] = [
  {
    id: 'TASK-1',
    title: 'Design the landing page hero section',
    status: 'Done',
    priority: 'High',
    dueDate: new Date('2024-08-01'),
    tags: ['UI', 'Design'],
  },
  {
    id: 'TASK-2',
    title: 'Implement Google Authentication with Firebase',
    status: 'In Progress',
    priority: 'High',
    dueDate: new Date('2024-08-10'),
    tags: ['Backend', 'Auth'],
  },
  {
    id: 'TASK-3',
    title: 'Develop the Kanban board view',
    status: 'In Progress',
    priority: 'High',
    dueDate: new Date('2024-08-15'),
    tags: ['Frontend', 'UI'],
  },
  {
    id: 'TASK-4',
    title: 'Set up Firestore database schema for tasks',
    status: 'To Do',
    priority: 'Medium',
    dueDate: new Date('2024-08-05'),
    tags: ['Backend', 'Database'],
  },
  {
    id: 'TASK-5',
    title: 'Create rich text editor component for notes',
    status: 'To Do',
    priority: 'Medium',
    dueDate: new Date('2024-08-20'),
    tags: ['Frontend', 'Editor'],
  },
  {
    id: 'TASK-6',
    title: 'Build the mind mapping feature',
    status: 'Backlog',
    priority: 'Low',
    dueDate: new Date('2024-09-01'),
    tags: ['Feature'],
  },
  {
    id: 'TASK-7',
    title: 'Write unit tests for authentication flow',
    status: 'To Do',
    priority: 'Medium',
    dueDate: new Date('2024-08-12'),
    tags: ['Testing', 'Backend'],
  },
  {
    id: 'TASK-8',
    title: 'Deploy the application to Firebase Hosting',
    status: 'Backlog',
    priority: 'Low',
    dueDate: new Date('2024-09-15'),
    tags: ['DevOps'],
  },
];
