
'use client';

import { DayPicker } from 'react-day-picker';
import type { HabitCompletion } from '@/lib/types';
import { cn } from '@/lib/utils';
import moment from 'moment';

interface HabitCalendarProps {
  completions: HabitCompletion[];
  onDateToggle: (date: Date, isCompleted: boolean) => void;
}

export function HabitCalendar({ completions, onDateToggle }: HabitCalendarProps) {
  
  const completedDates = completions.map(c => moment(c.date, 'YYYY-MM-DD').toDate());

  const handleDayClick = (day: Date, modifiers: { completed?: boolean }) => {
    // Only allow toggling for past and present dates
    if (moment(day).isAfter(moment(), 'day')) {
        return;
    }
    onDateToggle(day, !!modifiers.completed);
  };

  return (
    <DayPicker
      mode="multiple"
      min={0} // Allows multiple selections
      selected={completedDates}
      onDayClick={handleDayClick}
      showOutsideDays
      classNames={{
        day_selected: "bg-green-500 text-white hover:bg-green-600 focus:bg-green-600",
        day: "cursor-pointer",
      }}
      modifiers={{
        completed: completedDates,
      }}
      modifiersClassNames={{
        completed: 'bg-green-200 dark:bg-green-800 rounded-md',
      }}
    />
  );
}
