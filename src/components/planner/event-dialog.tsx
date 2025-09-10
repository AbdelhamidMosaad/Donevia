
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import type { PlannerEvent, PlannerCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import moment from 'moment';

interface EventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: Partial<PlannerEvent> | null;
  categories: PlannerCategory[];
}

export function EventDialog({ isOpen, onOpenChange, event, categories }: EventDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<PlannerEvent>>({});

  useEffect(() => {
    if (event) {
      setFormData({
        ...event,
        start: event.start || new Date(),
        end: event.end || new Date(),
      });
    } else {
      setFormData({});
    }
  }, [event]);

  const handleChange = (field: keyof PlannerEvent, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleDateChange = (field: 'start' | 'end', date: string, time: string) => {
    const combined = moment(`${date} ${time}`).toDate();
    handleChange(field, combined);
  };
  
  const handleSave = async () => {
    if (!user || !formData.title) {
        toast({ variant: 'destructive', title: "Title is required" });
        return;
    }
    const eventData = { ...formData };

    try {
        if(eventData.id) {
            const eventRef = doc(db, 'users', user.uid, 'plannerEvents', eventData.id);
            await updateDoc(eventRef, eventData);
            toast({ title: 'Event updated successfully!' });
        } else {
            await addDoc(collection(db, 'users', user.uid, 'plannerEvents'), {
                ...eventData,
                ownerId: user.uid,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Event created successfully!' });
        }
        onOpenChange(false);
    } catch(e) {
        toast({ variant: 'destructive', title: "Error saving event" });
    }
  };
  
  const handleDelete = async () => {
    if(!user || !formData.id) return;
    const eventRef = doc(db, 'users', user.uid, 'plannerEvents', formData.id);
    await deleteDoc(eventRef);
    toast({ title: 'Event deleted' });
    onOpenChange(false);
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{formData.id ? 'Edit Event' : 'Create Event'}</DialogTitle>
          <DialogDescription>Fill in the details for your event.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Input 
            placeholder="Event Title" 
            value={formData.title || ''} 
            onChange={(e) => handleChange('title', e.target.value)}
          />
          <Textarea 
            placeholder="Description..."
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
          />
          <div className="flex items-center space-x-2">
            <Checkbox id="all-day" checked={formData.allDay} onCheckedChange={(checked) => handleChange('allDay', checked)} />
            <Label htmlFor="all-day">All-day event</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <Label>Start</Label>
                 <Input 
                    type="date" 
                    value={moment(formData.start).format('YYYY-MM-DD')}
                    onChange={(e) => handleDateChange('start', e.target.value, moment(formData.start).format('HH:mm'))}
                />
                {!formData.allDay && <Input 
                    type="time" 
                    value={moment(formData.start).format('HH:mm')}
                    onChange={(e) => handleDateChange('start', moment(formData.start).format('YYYY-MM-DD'), e.target.value)}
                    className="mt-2"
                />}
             </div>
             <div>
                <Label>End</Label>
                 <Input 
                    type="date"
                    value={moment(formData.end).format('YYYY-MM-DD')}
                    onChange={(e) => handleDateChange('end', e.target.value, moment(formData.end).format('HH:mm'))}
                />
                {!formData.allDay && <Input 
                    type="time" 
                    value={moment(formData.end).format('HH:mm')}
                    onChange={(e) => handleDateChange('end', moment(formData.end).format('YYYY-MM-DD'), e.target.value)}
                    className="mt-2"
                />}
             </div>
          </div>
          <div>
            <Label>Category</Label>
            <Select value={formData.categoryId} onValueChange={(value) => handleChange('categoryId', value)}>
                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                    {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }}/>
                                {cat.name}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="justify-between">
           {formData.id ? (
             <Button variant="destructive" onClick={handleDelete}>Delete</Button>
           ) : <div />}
           <div className="flex gap-2">
            <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
            <Button onClick={handleSave}>Save</Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
