
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, onSnapshot, writeBatch } from 'firebase/firestore';
import type { PlannerEvent, PlannerCategory, Task, Attachment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';
import { useDropzone } from 'react-dropzone';
import { getAuth } from 'firebase/auth';
import { Paperclip, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';


interface EventDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: Partial<PlannerEvent> | null;
  categories: PlannerCategory[];
}

const colorPalette = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'];

const getInitialFormData = (event: Partial<PlannerEvent> | null): Partial<PlannerEvent> => {
    if (!event) {
        return {
            title: '',
            description: '',
            start: new Date(),
            end: moment(new Date()).add(1, 'hour').toDate(),
            allDay: false,
            attachments: [],
            reminder: 'none',
            recurring: 'none',
            recurringEndDate: null,
            color: undefined,
            taskId: undefined,
            categoryId: undefined,
        };
    }
    return {
        ...event,
        start: event.start || new Date(),
        end: event.end || new Date(),
        attachments: event.attachments || [],
        reminder: event.reminder || 'none',
    };
};


export function EventDialog({ isOpen, onOpenChange, event, categories }: EventDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<PlannerEvent>>(getInitialFormData(event));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => setFilesToUpload(prev => [...prev, ...acceptedFiles]),
  });

  useEffect(() => {
    if(user) {
        const tasksQuery = query(collection(db, 'users', user.uid, 'tasks'));
        const unsubscribe = onSnapshot(tasksQuery, snapshot => {
            setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
        });
        return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData(event));
      setFilesToUpload([]);
    }
  }, [event, isOpen]);

  const handleChange = (field: keyof PlannerEvent, value: any) => {
    let newFormData = { ...formData, [field]: value };
    
    if (field === 'allDay') {
        const isAllDay = !!value;
        const currentStart = moment(newFormData.start);
        if (isAllDay) {
            newFormData.start = currentStart.startOf('day').toDate();
            newFormData.end = currentStart.endOf('day').toDate();
        } else {
             newFormData.end = moment(newFormData.start).add(1, 'hour').toDate();
        }
    }
    
    setFormData(newFormData);
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
    
    let uploadedAttachments: Attachment[] = [...(formData.attachments || [])];

    if(filesToUpload.length > 0) {
        const idToken = await getAuth().currentUser?.getIdToken();
        const uploadPromises = filesToUpload.map(async file => {
            const body = new FormData();
            body.append('file', file);
            body.append('idToken', idToken!);
            body.append('type', 'planner'); // Differentiate from CRM uploads
            
            const res = await fetch('/api/planner/upload', { method: 'POST', body });
            if (!res.ok) throw new Error(`Upload failed for ${file.name}`);
            const result = await res.json();
            return {
                id: uuidv4(),
                filename: result.filename,
                url: result.url,
                mimeType: result.mimeType,
                size: result.size,
                uploadedAt: Timestamp.now()
            };
        });
        
        try {
            const newAttachments = await Promise.all(uploadPromises);
            uploadedAttachments.push(...newAttachments);
        } catch(e) {
            toast({ variant: 'destructive', title: 'File upload failed', description: (e as Error).message });
            return;
        }
    }

    const eventData = { 
        ...formData, 
        taskId: formData.taskId || null,
        attachments: uploadedAttachments,
        recurring: formData.recurring === 'none' ? undefined : formData.recurring,
        recurringEndDate: formData.recurring === 'none' ? null : (formData.recurringEndDate ? formData.recurringEndDate : null),
        color: formData.color,
    };

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
        console.error("Error saving event:", e);
        toast({ variant: 'destructive', title: "Error saving event" });
    }
  };
  
  const handleDelete = async () => {
    if(!user || !formData.id) return;
    try {
        const eventRef = doc(db, 'users', user.uid, 'plannerEvents', formData.id);
        await deleteDoc(eventRef);
        toast({ title: 'Event deleted' });
        onOpenChange(false);
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error deleting event.' });
    }
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
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
            <Checkbox id="all-day" checked={!!formData.allDay} onCheckedChange={(checked) => handleChange('allDay', checked)} />
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
           <div className="grid grid-cols-2 gap-4">
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
             <div>
              <Label>Reminder</Label>
              <Select value={formData.reminder} onValueChange={(value) => handleChange('reminder', value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="5m">5 minutes before</SelectItem>
                        <SelectItem value="15m">15 minutes before</SelectItem>
                        <SelectItem value="30m">30 minutes before</SelectItem>
                        <SelectItem value="1h">1 hour before</SelectItem>
                        <SelectItem value="1d">1 day before</SelectItem>
                  </SelectContent>
              </Select>
            </div>
           </div>
           <div>
            <Label>Event Color</Label>
            <div className="flex flex-wrap gap-2 pt-2">
                {colorPalette.map(c => (
                    <button
                        key={c}
                        type="button"
                        className={cn("h-8 w-8 rounded-full border flex items-center justify-center transition-transform hover:scale-110", formData.color === c ? 'ring-2 ring-offset-2 ring-primary' : '')}
                        style={{ backgroundColor: c }}
                        onClick={() => handleChange('color', c)}
                    >
                       {formData.color === c && <Check className="h-4 w-4 text-white" />}
                    </button>
                ))}
                 <Button variant="ghost" size="sm" onClick={() => handleChange('color', undefined)}>
                    Use category color
                </Button>
             </div>
           </div>
           <div>
            <Label>Link to Task</Label>
            <Select value={formData.taskId} onValueChange={(value) => handleChange('taskId', value === 'none' ? undefined : value)}>
                <SelectTrigger><SelectValue placeholder="Select a task to link" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {tasks.map(task => (
                        <SelectItem key={task.id} value={task.id}>
                           {task.title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
           <div>
            <Label>Recurring</Label>
            <div className="flex items-center gap-4">
               <Select value={formData.recurring || 'none'} onValueChange={(value) => handleChange('recurring', value)}>
                <SelectTrigger><SelectValue placeholder="Does not repeat" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">Does not repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              {formData.recurring && formData.recurring !== 'none' && (
                  <Input 
                      type="date"
                      value={formData.recurringEndDate ? moment(formData.recurringEndDate).format('YYYY-MM-DD') : ''}
                      onChange={e => handleChange('recurringEndDate', e.target.value ? new Date(e.target.value) : null)}
                  />
              )}
            </div>
          </div>
          <div>
            <Label>Attachments</Label>
            <div {...getRootProps()} className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
            </div>
            <ul className="mt-2 space-y-1">
                {formData.attachments?.map((att: Attachment) => (
                    <li key={att.id} className="text-sm flex items-center justify-between bg-muted/50 p-1 rounded">
                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                            <Paperclip className="h-4 w-4" />
                            <span>{att.filename}</span>
                        </a>
                    </li>
                ))}
                 {filesToUpload.map((file, index) => (
                    <li key={index} className="text-sm flex items-center justify-between bg-blue-100/50 p-1 rounded">
                         <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            <span>{file.name}</span>
                          </div>
                    </li>
                ))}
            </ul>
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
