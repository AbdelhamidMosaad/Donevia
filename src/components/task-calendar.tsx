
'use client';
import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Task } from '@/lib/types';
import { Calendar, momentLocalizer, Views, EventProps, ToolbarProps } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from './ui/button';
import { PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

const localizer = momentLocalizer(moment);

const CustomToolbar = (toolbar: ToolbarProps) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
  };

  const label = () => {
    const date = moment(toolbar.date);
    return (
      <span>
        <strong>{date.format('MMMM YYYY')}</strong>
      </span>
    );
  };
  
  const viewNames: (typeof Views[keyof typeof Views])[] = ['month', 'week', 'day'];

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-t-lg border-b">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={goToCurrent}>Today</Button>
        <Button variant="ghost" size="icon" onClick={goToBack}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={goToNext}><ChevronRight className="h-4 w-4" /></Button>
        <h2 className="text-xl font-headline">{label()}</h2>
      </div>
      <div className="flex items-center gap-2">
        {viewNames.map(view => (
            <Button
                key={view}
                variant={toolbar.view === view ? 'default' : 'outline'}
                onClick={() => toolbar.onView(view)}
            >
                {view.charAt(0).toUpperCase() + view.slice(1)}
            </Button>
        ))}
      </div>
    </div>
  );
};


const AddTaskDialog = ({ onSave }: { onSave: (task: Omit<Task, 'id' | 'createdAt'>) => void }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState(new Date());
    const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [status, setStatus] = useState<'Backlog' | 'To Do' | 'In Progress' | 'Done'>('To Do');

    const handleSave = () => {
        onSave({
            title,
            description,
            dueDate: Timestamp.fromDate(dueDate),
            priority,
            status,
            tags: [],
        });
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon"><PlusCircle className="h-5 w-5" /></Button>
            </DialogTrigger>
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
                        <Select onValueChange={(v: any) => setPriority(v)} defaultValue={priority}>
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
                        <Select onValueChange={(v: any) => setStatus(v)} defaultValue={status}>
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
                    <DialogClose asChild>
                        <Button onClick={handleSave}>Save</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const CustomEvent = ({ event }: EventProps<Task>) => {
    return (
        <div className="p-1">
            <strong>{event.title}</strong>
            <p className="text-xs">{event.priority}</p>
        </div>
    );
};

const DayCellWrapper = ({ children, value }: { children: React.ReactNode, value: Date }) => {
    const { user } = useAuth();

    const handleAddTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
        if (!user) return;
        try {
            const docRef = await addDoc(collection(db, 'users', user.uid, 'tasks'), {
                ...task,
                createdAt: Timestamp.now(),
            });
            console.log("Document written with ID: ", docRef.id);
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    };
    
    return (
        <div className="relative h-full group">
            {children}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <AddTaskDialog onSave={(task) => handleAddTask({...task, dueDate: Timestamp.fromDate(value)})} />
            </div>
        </div>
    );
};


export function TaskCalendar() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (user) {
      const q = collection(db, 'users', user.uid, 'tasks');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleEventDrop = useCallback(async (args: { event: any, start: any, end: any }) => {
    const { event, start } = args;
    if (user) {
      const taskRef = doc(db, 'users', user.uid, 'tasks', event.id);
      try {
        await updateDoc(taskRef, {
          dueDate: Timestamp.fromDate(new Date(start)),
        });
      } catch (error) {
        console.error("Error updating task dueDate: ", error);
      }
    }
  }, [user]);

  const calendarEvents = tasks.map(task => ({
    ...task,
    start: task.dueDate.toDate(),
    end: task.dueDate.toDate(),
    allDay: true,
  }));

  return (
    <div className="h-[calc(100vh-200px)] bg-card rounded-lg border">
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ flex: 1 }}
        onEventDrop={handleEventDrop as any}
        selectable
        components={{
          event: CustomEvent,
          toolbar: CustomToolbar,
          day: {
            cell: DayCellWrapper
          },
          week: {
            cell: DayCellWrapper
          },
        }}
      />
    </div>
  );
}
