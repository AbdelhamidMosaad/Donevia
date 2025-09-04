
'use client';
import { useState, useEffect, useCallback, ReactNode } from 'react';
import { collection, onSnapshot, doc, updateDoc, Timestamp, query } from 'firebase/firestore';
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
        <div className="text-xs p-0.5 whitespace-normal">
            <strong>{event.title}</strong>
        </div>
    );
};

const DayCellWrapper = ({ children, value }: { children: ReactNode, value: Date }) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleOpenDialog = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDialogOpen(true);
    }
    
    return (
        <div className="relative h-full group">
            {children}
            <AddTaskDialog defaultDueDate={value} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleOpenDialog}
                  className="absolute top-1 right-1 h-6 w-6 text-primary opacity-20 group-hover:opacity-100 transition-opacity cursor-pointer">
                   <PlusCircle className="h-5 w-5" />
                </Button>
            </AddTaskDialog>
        </div>
    );
};


export function TaskCalendar() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Task[]>([]);
  const [view, setView] = useState<keyof typeof Views>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'tasks'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksData);
        setEvents(tasksData.map(task => ({
          ...task,
          start: task.dueDate.toDate(),
          end: task.dueDate.toDate(),
        })));
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date, end: Date }) => {
      // For now, we'll just log the selection.
      // In the future, this could open an AddTaskDialog.
      console.log('Selected slot:', start, end);
    },
    []
  );

  const handleSelectEvent = useCallback(
    (event: Task) => {
      // In the future, this could open an EditTaskDialog.
      console.log('Selected event:', event);
    },
    []
  );

  const handleEventDrop = useCallback(
    async ({ event, start, end }: { event: any, start: any, end: any }) => {
      if (user && event.id) {
        const taskRef = doc(db, 'users', user.uid, 'tasks', event.id);
        await updateDoc(taskRef, {
          dueDate: Timestamp.fromDate(start),
        });
      }
    },
    [user]
  );
  

  return (
    <div className="h-[calc(100vh-200px)] bg-card rounded-lg border">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        selectable
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onEventDrop={handleEventDrop}
        view={view}
        date={date}
        onView={(v) => setView(v as keyof typeof Views)}
        onNavigate={(d) => setDate(d)}
        components={{
          toolbar: CustomToolbar,
          event: CustomEvent,
          month: {
            dateHeader: ({ label, date }) => {
                const isToday = moment(date).isSame(new Date(), 'day');
                return (
                    <div className="flex items-center gap-2">
                        {isToday && <div className="w-2 h-2 rounded-full bg-primary" />}
                        <span>{label}</span>
                    </div>
                );
            },
            dayWrapper: DayCellWrapper,
          },
          week: {
             dayWrapper: DayCellWrapper,
          },
          day: {
             dayWrapper: DayCellWrapper,
          }
        }}
      />
    </div>
  );
}
