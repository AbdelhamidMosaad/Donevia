
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
import { AddTaskDialog } from './add-task-dialog';

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

const CustomEvent = ({ event }: EventProps<Task>) => {
    return (
        <div className="p-1">
            <strong>{event.title}</strong>
            <p className="text-xs">{event.priority}</p>
        </div>
    );
};

const DayCellWrapper = ({ children, value }: { children: React.ReactNode, value: Date }) => {
    return (
        <div className="relative h-full group">
            {children}
            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <AddTaskDialog defaultDueDate={value}>
                    <Button variant="ghost" size="icon"><PlusCircle className="h-5 w-5" /></Button>
                </AddTaskDialog>
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
          month: {
            dateHeader: ({ label, date }) => (
                <div className="relative group p-2 text-center">
                    <div>{label}</div>
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <AddTaskDialog defaultDueDate={date}>
                            <Button variant="ghost" size="icon" className="h-6 w-6"><PlusCircle className="h-4 w-4" /></Button>
                        </AddTaskDialog>
                    </div>
                </div>
            )
          },
          day: {
            header: ({ label, date }) => (
                <div className="relative group p-2 text-center">
                    <div>{label}</div>
                     <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <AddTaskDialog defaultDueDate={date}>
                            <Button variant="ghost" size="icon" className="h-6 w-6"><PlusCircle className="h-4 w-4" /></Button>
                        </AddTaskDialog>
                    </div>
                </div>
            )
          },
           week: {
            header: ({ label, date }) => (
                <div className="relative group p-2 text-center">
                    <div>{label}</div>
                     <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <AddTaskDialog defaultDueDate={date}>
                            <Button variant="ghost" size="icon" className="h-6 w-6"><PlusCircle className="h-4 w-4" /></Button>
                        </AddTaskDialog>
                    </div>
                </div>
            )
          },
        }}
      />
    </div>
  );
}
