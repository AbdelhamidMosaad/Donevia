
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
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import moment from 'moment';
import type { Task } from '@/lib/types';

interface AddTaskDialogProps {
  children: ReactNode;
  defaultTitle?: string;
  defaultStatus?: Task['status'];
  defaultDueDate?: Date;
  onTaskAdded?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddTaskDialog({ 
  children, 
  defaultTitle = '', 
  defaultStatus = 'To Do', 
  defaultDueDate,
  onTaskAdded,
  open: controlledOpen,
  onOpenChange: setControlledOpen
}: AddTaskDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const open = controlledOpen ?? internalOpen;
  const setOpen = setControlledOpen ?? setInternalOpen;
  
  const memoizedDefaultDueDate = useMemo(() => defaultDueDate || new Date(), [defaultDueDate]);

  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(memoizedDefaultDueDate);
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [status, setStatus] = useState<Task['status']>(defaultStatus);

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setStatus(defaultStatus);
      setDueDate(memoizedDefaultDueDate);
      // Reset other fields
      setDescription('');
      setPriority('Medium');
      setIsSaving(false);
    }
  }, [defaultTitle, defaultStatus, memoizedDefaultDueDate, open]);


  const handleSave = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to add a task.',
      });
      return;
    }
    if (!title) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Task title is required.',
        });
        return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'tasks'), {
        title,
        description,
        dueDate: Timestamp.fromDate(dueDate),
        priority,
        status,
        tags: [],
        createdAt: Timestamp.now(),
      });
      toast({
        title: 'Task Added',
        description: `"${title}" has been added successfully.`,
      });
      setOpen(false);
      if (onTaskAdded) {
        onTaskAdded();
      }
    } catch (e) {
      console.error("Error adding document: ", e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add task. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
          <DialogDescription>Fill in the details for your new task.</DialogDescription>
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
            <Select onValueChange={(v: Task['priority']) => setPriority(v)} defaultValue={priority}>
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
            <Select onValueChange={(v: Task['status']) => setStatus(v)} defaultValue={status}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Backlog">Backlog</SelectItem>
                <SelectItem value="To Do">To Do</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Ok'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
