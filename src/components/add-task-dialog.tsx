
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
import type { Task, Stage } from '@/lib/types';
import { DialogTrigger } from './ui/dialog';

interface AddTaskDialogProps {
  children?: ReactNode;
  listId: string;
  task?: Task | null;
  onTaskAdded?: (id: string) => void;
  onTaskUpdated?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultDueDate?: Date;
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
  listId,
  task,
  onTaskAdded,
  onTaskUpdated,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  defaultDueDate,
}: AddTaskDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);

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

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setReflection('');
    setDueDate(defaultDueDate || new Date());
    setPriority('Medium');
    setReminder('none');
    setColor(getRandomColor());
    if (stages.length > 0) {
      setStatus(stages[0].id);
    } else {
      setStatus(undefined);
    }
  }

  useEffect(() => {
    if (user && listId) {
      const listRef = doc(db, 'users', user.uid, 'taskLists', listId);
      const unsubscribe = onSnapshot(listRef, (docSnap) => {
        if (docSnap.exists()) {
          const listData = docSnap.data();
          const listStages = listData.stages?.sort((a: Stage, b: Stage) => a.order - b.order) || [];
          setStages(listStages);
          if (!isEditMode && listStages.length > 0) {
            setStatus(listStages[0].id);
          }
        }
      });
      return () => unsubscribe();
    }
  }, [user, listId, isEditMode]);

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
      } else {
        resetForm();
      }
    } else {
      resetForm();
    }
  }, [open, task, isEditMode, stages, defaultDueDate]);


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

    console.log('Attempting to save task:', title);
    setIsSaving(true);
    const taskData = {
        title,
        description,
        reflection,
        dueDate: Timestamp.fromDate(dueDate),
        priority,
        status,
        reminder,
        color,
        tags: task?.tags || [],
        listId,
        ownerId: user.uid,
        ...(isEditMode ? {} : { createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp(),
    };

    try {
      if (isEditMode && task) {
          const taskRef = doc(db, 'users', user.uid, 'tasks', task.id);
          await updateDoc(taskRef, taskData);
          toast({
            title: 'Task Updated',
            description: `"${title}" has been updated.`,
          });
          onTaskUpdated?.();
          if (!andAddNew) setOpen(false);
      } else {
          const docRef = await addDoc(collection(db, 'users', user.uid, 'tasks'), taskData);
          toast({
            title: 'Task Added',
            description: `"${title}" has been added successfully.`,
          });
          onTaskAdded?.(docRef.id);
          
          if (andAddNew) {
            resetForm();
          } else {
            setOpen(false);
          }
      }
    } catch (e) {
      console.error("Error saving document: ", e);
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
            <Label htmlFor="reflection" className="text-right pt-2">Reflection</Label>
            <Textarea id="reflection" value={reflection} onChange={(e) => setReflection(e.target.value)} className="col-span-3" placeholder="Jot down your thoughts, lessons learned, or progress notes..."/>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dueDate" className="text-right">Due Date</Label>
            <Input id="dueDate" type="date" value={moment(dueDate).format('YYYY-MM-DD')} onChange={(e) => setDueDate(new Date(e.target.value))} className="col-span-3" />
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
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          {!isEditMode && (
            <Button onClick={() => handleSave(true)} disabled={isSaving} variant="outline">
              {isSaving ? 'Saved' : 'Save & Add Another'}
            </Button>
          )}
          <Button onClick={() => handleSave(false)} disabled={isSaving}>
            {isSaving ? 'Saved' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
