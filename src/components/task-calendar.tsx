
'use client';
import { useState, useEffect, useCallback, ReactNode } from 'react';
import { updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Task } from '@/lib/types';
import { Calendar, momentLocalizer, Views, EventProps, ToolbarProps } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AddTaskDialog } from './add-task-dialog';
import { useTasks } from '@/hooks/use-tasks';

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

interface DayCellWrapperProps {
    children: React.ReactNode;
    value: Date;
}

const DayCellWrapper = ({ children, value }: DayCellWrapperProps) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { addTask, updateTask } = useTasks();
    const categories = useAuth().settings.taskSettings?.categories || [];

    const handleOpenDialog = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).classList.contains('rbc-day-bg')) {
        setIsDialogOpen(true);
      }
    }
    
    return (
      <AddTaskDialog 
        defaultDueDate={value} 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        onTaskAdded={addTask}
        onTaskUpdated={updateTask}
        categories={categories}
      >
        <div className="relative h-full" onClick={handleOpenDialog}>
            {children}
        </div>
      </AddTaskDialog>
    );
};

interface TaskCalendarProps {
    tasks: Task[];
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

export function TaskCalendar({ tasks, onUpdateTask }: TaskCalendarProps) {
  const [events, setEvents] = useState<Task[]>([]);
  const [view, setView] = useState<keyof typeof Views>(Views.MONTH);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    setEvents(tasks.map(task => ({
      ...task,
      start: task.dueDate.toDate(),
      end: task.dueDate.toDate(),
    })));
  }, [tasks]);

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date, end: Date }) => {
      // Logic to open AddTaskDialog can be added here if needed
    },
    []
  );

  const handleSelectEvent = useCallback(
    (event: Task) => {
      // Logic to open an edit dialog could go here
    },
    []
  );

  const handleEventDrop = useCallback(
    async ({ event, start, end }: { event: any, start: any, end: any }) => {
      onUpdateTask(event.id, { dueDate: Timestamp.fromDate(start) });
    },
    [onUpdateTask]
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
            dayWrapper: (props) => <DayCellWrapper {...props} />,
          },
          week: {
             dayWrapper: (props) => <DayCellWrapper {...props} />,
          },
          day: {
             dayWrapper: (props) => <DayCellWrapper {...props} />,
          }
        }}
      />
    </div>
  );
}
