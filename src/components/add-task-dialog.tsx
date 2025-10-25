
'use client';

import { useState, useEffect, ReactNode, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp, doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import moment from 'moment';
import type { Task, Stage, Subtask } from '@/lib/types';
import { DialogTrigger } from './ui/dialog';
import { PlusCircle, Trash2, Save, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Checkbox } from './ui/checkbox';
import { useTasks } from '@/hooks/use-tasks';

interface AddTaskDialogProps {
  children?: ReactNode;
  task?: Task | null;
  onTaskAdded: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => void;
  onTaskUpdated: (id: string, updates: Partial<Task>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultDueDate?: Date;
  categories: string[];
}

const cardColors = [
    '#FFFFFF', // White
    '#FEE2E2', // red-100
    '#FFEDD5', // orange-100
    '#FEF9C3', // yellow-100
    '#ECFCCB', // lime-100
    '#D1FAE5', // emerald-100
    '#CFFAFE', // cyan-100
    '#DBEAFE', // blue-100
    '#E0E7FF', // indigo-100
    '#E5E0FF', // violet-100
    '#F3E8FF', // purple-100
    '#FAE8FF', // fuchsia-100
];

const getRandomColor = () => cardColors[Math.floor(Math.random() * cardColors.length)];

export function AddTaskDialog({
  children,
  task,
  onTaskAdded,
  onTaskUpdated,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  defaultDueDate,
  categories,
}: AddTaskDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { stages } = useTasks();

  const isEditMode = !!task;
  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reflection, setReflection] = useState('');
  const [dueDate, setDueDate] = useState<Date>(defaultDueDate || new Date());
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [status, setStatus] = useState<Task['status'] | undefined>();
  const [reminder, setReminder] = useState<Task['reminder']>('none');
  const [color, setColor] = useState<string | undefined>(task?.color);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [category, setCategory] = useState<string>('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setReflection('');
    setDueDate(defaultDueDate || new Date());
    setPriority('Medium');
    setReminder('none');
    setColor(getRandomColor());
    setSubtasks([]);
    setCategory(categories?.[0] || 'general');
    if (stages.length > 0) {
      setStatus(stages[0].id);
    } else {
      setStatus(undefined);
    }
  }

  useEffect(() => {
    if (stages.length > 0 && !status) {
        setStatus(stages[0].id);
    }
  }, [stages, status]);

  useEffect(() => {
    if (open) {
      if (isEditMode && task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setReflection(task.reflection || '');
        setDueDate(task.dueDate.toDate());
        setPriority(task.priority);
        setStatus(task.status);
        setReminder(task.reminder || 'none');
        setColor(task.color);
        setSubtasks(task.subtasks || []);
        setCategory(task.category || 'general');
      } else {
        resetForm();
      }
    } else {
      resetForm();
    }
  }, [open, task, isEditMode, stages, defaultDueDate, categories]);

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([...subtasks, { id: uuidv4(), title: newSubtaskTitle.trim(), isCompleted: false, dueDate: null }]);
    setNewSubtaskTitle('');
  };

  const handleSubtaskChange = (subtaskId: string, field: keyof Subtask, value: any) => {
    setSubtasks(subtasks.map(st => st.id === subtaskId ? { ...st, [field]: value } : st));
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.filter(st => st.id !== subtaskId));
  }


  const handleSave = async (andAddNew: boolean = false) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    if (!title) {
        toast({ variant: 'destructive', title: 'Error', description: 'Task title is required.' });
        return;
    }
    if (!status) {
        toast({ variant: 'destructive', title: 'Error', description: 'Task status is required.' });
        return;
    }

    setIsSaving(true);
    const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'> = {
        title,
        description,
        reflection,
        dueDate: Timestamp.fromDate(dueDate),
        priority,
        status,
        reminder,
        color,
        subtasks,
        category: category || 'general',
        tags: task?.tags || [],
        deleted: false,
    };

    try {
      if (isEditMode && task && onTaskUpdated) {
          onTaskUpdated(task.id, taskData);
          toast({
            title: 'Task Updated',
            description: `"${title}" has been updated.`,
          });
      } else if (onTaskAdded) {
          onTaskAdded(taskData);
          toast({
            title: 'Task Added',
            description: `"${title}" has been added successfully.`,
          });
          
          if (andAddNew) {
            resetForm();
            return; // Don't close dialog
          }
      }
      setOpen(false);
    } catch (e) {
      console.error("Error saving task: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save task.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          <DialogDescription>{isEditMode ? 'Update the details of your task.' : 'Fill in the details for your new task.'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Subtasks</Label>
            <div className="col-span-3 space-y-2">
                {subtasks.map(st => (
                    <div key={st.id} className="flex items-center gap-2">
                        <Checkbox 
                            checked={st.isCompleted} 
                            onCheckedChange={(checked) => handleSubtaskChange(st.id, 'isCompleted', !!checked)}
                        />
                        <Input 
                            value={st.title} 
                            onChange={(e) => handleSubtaskChange(st.id, 'title', e.target.value)}
                            className="h-8 flex-1"
                        />
                         <Input 
                            type="date"
                            value={st.dueDate ? moment(st.dueDate.toDate()).format('YYYY-MM-DD') : ''}
                            onChange={(e) => handleSubtaskChange(st.id, 'dueDate', e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null)}
                            className="h-8 w-auto"
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteSubtask(st.id)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                <div className="flex items-center gap-2">
                    <Input 
                        placeholder="Add new subtask..."
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    />
                    <Button onClick={handleAddSubtask}><PlusCircle /> Add</Button>
                </div>
            </div>
          </div>
           <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="reflection" className="text-right pt-2">Reflection</Label>
            <Textarea id="reflection" value={reflection} onChange={(e) => setReflection(e.target.value)} className="col-span-3" placeholder="Jot down your thoughts, lessons learned, or progress notes..."/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDate" className="text-right">Due Date</Label>
            <Input id="dueDate" type="date" value={moment(dueDate).format('YYYY-MM-DD')} onChange={(e) => setDueDate(new Date(e.target.value))} className="col-span-3" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger className="col-span-3 capitalize"><SelectValue placeholder="Select a category"/></SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="priority" className="text-right">Priority</Label>
            <Select onValueChange={(v: Task['priority']) => setPriority(v)} value={priority}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <Select onValueChange={(v: Task['status']) => setStatus(v)} value={status}>
              <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a status" /></SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reminder" className="text-right">Reminder</Label>
            <Select onValueChange={(v: Task['reminder']) => setReminder(v)} value={reminder}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="5m">5 minutes before</SelectItem>
                <SelectItem value="10m">10 minutes before</SelectItem>
                <SelectItem value="30m">30 minutes before</SelectItem>
                <SelectItem value="1h">1 hour before</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          {!isEditMode && (
            <Button onClick={() => handleSave(true)} disabled={isSaving} variant="outline">
              {isSaving ? 'Saving...' : 'Save & Add Another'}
            </Button>
          )}
          <Button onClick={() => handleSave(false)} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
