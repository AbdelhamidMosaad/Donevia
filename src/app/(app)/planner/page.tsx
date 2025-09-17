
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PlannerEvent, PlannerCategory, Task } from '@/lib/types';
import { Calendar as BigCalendar, momentLocalizer, Views, ToolbarProps, EventProps } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Settings, PlusCircle, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { EventDialog } from '@/components/planner/event-dialog';
import { CategoryManager } from '@/components/planner/category-manager';
import { useEventReminders } from '@/hooks/use-planner-reminders';
import { PlannerIcon } from '@/components/icons/tools/planner-icon';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';


const localizer = momentLocalizer(moment);

const standardViews: (typeof Views[keyof typeof Views])[] = [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA];

const CustomToolbar = (toolbar: ToolbarProps) => {
  const goToBack = () => toolbar.onNavigate('PREV');
  const goToNext = () => toolbar.onNavigate('NEXT');
  const goToCurrent = () => toolbar.onNavigate('TODAY');
  const label = () => moment(toolbar.date).format('MMMM YYYY');

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-t-lg border-b">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={goToCurrent}>Today</Button>
        <Button variant="ghost" size="icon" onClick={goToBack}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={goToNext}><ChevronRight className="h-4 w-4" /></Button>
        <h2 className="text-xl font-headline">{label()}</h2>
      </div>
       <div className="hidden md:flex items-center gap-2">
        {standardViews.map((view) => {
            return (
                <Button
                    key={view}
                    variant={toolbar.view === view ? 'default' : 'ghost'}
                    onClick={() => toolbar.onView(view)}
                    className="capitalize"
                >
                    {view}
                </Button>
            );
        })}
      </div>
    </div>
  );
};

// Helper function to get contrasting text color
const getContrastYIQ = (hexcolor: string) => {
    if (!hexcolor) return 'black';
    hexcolor = hexcolor.replace("#", "");
    if (hexcolor.length !== 6) return 'black';
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}

const CustomEvent = ({ event, isAllDay: isAllDayProp }: EventProps<PlannerEvent>) => {
    const isAllDay = isAllDayProp ?? event.allDay;
    const title = event.title;

    let timeString = '';
    if (!isAllDay) {
        const start = moment(event.start);
        const end = moment(event.end);
        if (end.diff(start, 'minutes') > 0) {
            timeString = `${start.format('h:mma')} - ${end.format('h:mma')}`;
        } else {
            timeString = start.format('h:mma');
        }
    }

    return (
        <div className="flex items-center h-full px-2 text-xs truncate min-h-[20px]">
            <span className="font-medium whitespace-nowrap">{[timeString, title].filter(Boolean).join(' ')}</span>
        </div>
    );
};


const DayCellWrapper = ({ children, value }: { children: React.ReactNode, value: Date }) => {
    const isToday = moment(value).isSame(new Date(), 'day');
    return (
        <div className={cn("rbc-day-bg", isToday && 'rbc-today-custom')}>
            {children}
        </div>
    );
};


export default function PlannerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [categories, setCategories] = useState<PlannerCategory[]>([]);
  
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<PlannerEvent> | null>(null);
  const [currentView, setCurrentView] = useState<any>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [tasks, setTasks] = useState<Task[]>([]);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);


  // Initialize reminder hook
  useEventReminders(events);

  const combinedEvents = useMemo(() => {
    return events.map(event => {
        const linkedTask = tasks.find(t => t.id === event.taskId);
        return {
            ...event,
            title: linkedTask ? `[T] ${event.title}` : event.title,
        };
    });
  }, [events, tasks]);

  useEffect(() => {
    if (!user) {
        router.push('/');
        return;
    }
    
    // Fetch events from Firestore
    const eventsQuery = query(collection(db, 'users', user.uid, 'plannerEvents'));
    const unsubscribeEvents = onSnapshot(eventsQuery, snapshot => {
        setEvents(snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                start: data.start.toDate(),
                end: data.end.toDate(),
                recurringEndDate: data.recurringEndDate ? data.recurringEndDate.toDate() : null
            } as PlannerEvent
        }));
    });

    // Fetch categories from Firestore
    const categoriesQuery = query(collection(db, 'users', user.uid, 'plannerCategories'));
    const unsubscribeCategories = onSnapshot(categoriesQuery, snapshot => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PlannerCategory)));
    });

    // Fetch tasks to link titles
    const tasksQuery = query(collection(db, 'users', user.uid, 'tasks'));
    const unsubscribeTasks = onSnapshot(tasksQuery, snapshot => {
        setTasks(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Task)));
    });

    return () => {
        unsubscribeEvents();
        unsubscribeCategories();
        unsubscribeTasks();
    };
  }, [user, router]);

  const handleSelectSlot = useCallback(({ start, end }: { start: Date, end: Date }) => {
    setSelectedEvent({ start, end, allDay: false });
    setIsEventDialogOpen(true);
  }, []);

  const handleSelectEvent = (event: PlannerEvent) => {
      setSelectedEvent(event);
      setIsEventDialogOpen(true);
  };
  
  const handleEventDrop = async ({ event, start, end }: { event: any, start: any, end: any }) => {
    if (!user) return;
    const eventRef = doc(db, 'users', user.uid, 'plannerEvents', event.id);
    await updateDoc(eventRef, { start, end });
  };
  
  const eventStyleGetter = (event: PlannerEvent) => {
    let backgroundColor = '#3174ad'; // Default color
    
    if (event.color) {
        backgroundColor = event.color;
    } else {
        const category = categories.find(c => c.id === event.categoryId);
        if (category) {
            backgroundColor = category.color;
        }
    }
    
    const textColor = getContrastYIQ(backgroundColor);
    
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.9,
        color: textColor,
        border: '0px',
        display: 'block'
      }
    };
  };
  
  const handleNavigate = useCallback((newDate: Date) => setCurrentDate(newDate), [setCurrentDate]);

  const toggleFullscreen = useCallback(() => {
    const elem = calendarContainerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        toast({ variant: 'destructive', title: 'Error entering fullscreen.', description: err.message });
      });
    } else {
      document.exitFullscreen();
    }
  }, [toast]);
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);


  return (
    <div className={cn("flex flex-col h-full gap-6", isFullscreen ? "p-4 bg-background" : "")}>
       <div className={cn("flex flex-col md:flex-row items-start md:items-center justify-between gap-4", isFullscreen && "hidden")}>
        <div className="flex items-center gap-4">
            <PlannerIcon className="h-10 w-10 text-primary"/>
            <div>
                <h1 className="text-3xl font-bold font-headline">Planner</h1>
                <p className="text-muted-foreground">Organize your time, events, and tasks.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsCategoryManagerOpen(true)}>
                <Settings className="mr-2 h-4 w-4" /> Manage Categories
            </Button>
            <Button onClick={() => handleSelectSlot({ start: new Date(), end: new Date() })}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Event
            </Button>
            <Button variant="outline" size="icon" onClick={toggleFullscreen}>
                <Maximize />
            </Button>
        </div>
      </div>

       <div ref={calendarContainerRef} className={cn("h-[calc(100vh-220px)] bg-card rounded-lg border", isFullscreen && "h-full")}>
            <BigCalendar
                localizer={localizer}
                events={combinedEvents}
                startAccessor="start"
                endAccessor="end"
                titleAccessor="title"
                style={{ height: '100%' }}
                selectable
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                onEventDrop={handleEventDrop}
                eventPropGetter={eventStyleGetter}
                components={{ 
                    toolbar: CustomToolbar,
                    event: CustomEvent,
                    month: {
                        dateHeader: ({ label, date }) => {
                            const isToday = moment(date).isSame(new Date(), 'day');
                            return (
                                <div className={cn("rbc-header-custom", isToday && 'text-primary font-bold')}>
                                    <span>{label}</span>
                                </div>
                            )
                        },
                         dayWrapper: DayCellWrapper,
                    },
                }}
                view={currentView}
                onView={(view) => setCurrentView(view)}
                date={currentDate}
                onNavigate={handleNavigate}
            />
        </div>

        <EventDialog 
            isOpen={isEventDialogOpen}
            onOpenChange={setIsEventDialogOpen}
            event={selectedEvent}
            categories={categories}
        />
        <CategoryManager
            isOpen={isCategoryManagerOpen}
            onOpenChange={setIsCategoryManagerOpen}
            categories={categories}
        />
    </div>
  );
}
