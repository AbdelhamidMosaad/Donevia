
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface Reminder {
  title: string;
  description: string;
}

interface ReminderDialogContextType {
  isOpen: boolean;
  reminder: Reminder | null;
  showReminder: (reminder: Reminder) => void;
  hideReminder: () => void;
}

const ReminderDialogContext = createContext<ReminderDialogContextType | undefined>(undefined);

export function useReminderDialog() {
  const context = useContext(ReminderDialogContext);
  if (!context) {
    throw new Error('useReminderDialog must be used within a ReminderDialogProvider');
  }
  return context;
}

export function ReminderDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reminder, setReminder] = useState<Reminder | null>(null);

  const showReminder = (newReminder: Reminder) => {
    setReminder(newReminder);
    setIsOpen(true);
  };

  const hideReminder = () => {
    setIsOpen(false);
    setReminder(null);
  };

  const value = {
    isOpen,
    reminder,
    showReminder,
    hideReminder,
  };

  return (
    <ReminderDialogContext.Provider value={value}>
      {children}
    </ReminderDialogContext.Provider>
  );
}
