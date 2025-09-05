
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
  const [dueDate, setDueDate] = useState<Date>(defaultDueDate || new Date());
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [status, setStatus] = useState<Task['status'] | undefined>();

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate(defaultDueDate || new Date());
    setPriority('Medium');
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
          // Set default status when stages are loaded for a new task
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
        setDueDate(task.dueDate.toDate());
        setPriority(task.priority);
        setStatus(task.status);
      } else {
        resetForm();
      }
      setIsSaving(false);
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

    setIsSaving(true);
    const taskData = {
        title,
        description,
        dueDate: Timestamp.fromDate(dueDate),
        priority,
        status,
        tags: task?.tags || [],
        listId,
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
          setOpen(false); // Close after editing
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
            setTimeout(() => setOpen(false), 500);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Task' : 'Add New Task'}</DialogTitle>
          <DialogDescription>{isEditMode ? 'Update the details of your task.' : 'Fill in the details for your new task.'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" />
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
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          {!isEditMode && (
            <Button onClick={() => handleSave(true)} disabled={isSaving} variant="outline">
              {isSaving ? 'Saving...' : 'Save & Add Another'}
            </Button>
          )}
          <Button onClick={() => handleSave(false)} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

