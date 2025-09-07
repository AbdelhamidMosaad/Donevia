
'use client';

import { useState, useEffect, ReactNode } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import type { Habit } from '@/lib/types';
import { addHabit, updateHabit } from '@/lib/habits';
import { iconList } from '@/lib/icon-list';
import * as LucideIcons from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface AddHabitDialogProps {
  habit?: Habit | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export function AddHabitDialog({
  habit,
  open,
  onOpenChange,
  children
}: AddHabitDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!habit;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<Habit['frequency']>('daily');
  const [icon, setIcon] = useState('CheckCircle');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFrequency('daily');
    setIcon('TrendingUp');
  };

  useEffect(() => {
    if (open) {
      if (isEditMode && habit) {
        setTitle(habit.title);
        setDescription(habit.description || '');
        setFrequency(habit.frequency);
        setIcon(habit.icon);
      } else {
        resetForm();
      }
      setIsSaving(false);
    }
  }, [open, habit, isEditMode]);

  const handleSave = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in.' });
      return;
    }
    if (!title) {
        toast({ variant: 'destructive', title: 'Habit title is required.' });
        return;
    }

    setIsSaving(true);
    const habitData = {
        title,
        description,
        frequency,
        icon,
    };

    try {
      if (isEditMode && habit) {
        await updateHabit(user.uid, habit.id, habitData);
        toast({ title: 'Habit Updated', description: `"${title}" has been updated.` });
      } else {
        await addHabit(user.uid, habitData);
        toast({ title: 'Habit Added', description: `"${title}" has been added successfully.` });
      }
      onOpenChange?.(false);
    } catch (e) {
      console.error("Error saving habit: ", e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save habit.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Habit' : 'Create New Habit'}</DialogTitle>
          <DialogDescription>{isEditMode ? 'Update the details of your habit.' : 'Define a new habit to track.'}</DialogDescription>
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
            <Label htmlFor="frequency" className="text-right">Frequency</Label>
            <Select onValueChange={(v: Habit['frequency']) => setFrequency(v)} value={frequency}>
              <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="icon" className="text-right">Icon</Label>
             <Select onValueChange={setIcon} value={icon}>
                <SelectTrigger className="col-span-3">
                    <div className="flex items-center gap-2">
                        {React.createElement((LucideIcons as any)[icon], {className: "h-4 w-4"})}
                        <SelectValue />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <ScrollArea className="h-72">
                    {iconList.map(iconName => {
                         const IconComponent = (LucideIcons as any)[iconName];
                         return(
                            <SelectItem key={iconName} value={iconName}>
                                <div className="flex items-center gap-2">
                                 <IconComponent className="h-4 w-4" />
                                 <span>{iconName}</span>
                                </div>
                            </SelectItem>
                         )
                    })}
                    </ScrollArea>
                </SelectContent>
             </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
