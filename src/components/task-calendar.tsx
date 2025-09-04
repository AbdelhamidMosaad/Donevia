
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
        <div className="p-0.5 text-xs truncate">
            <strong>{event.title}</strong>
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
  const { user }.