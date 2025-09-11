
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from './ui/button';
import { useReminderDialog } from '@/hooks/use-reminder-dialog';
import { BellRing } from 'lucide-react';

export function ReminderDialog() {
  const { isOpen, reminder, hideReminder } = useReminderDialog();

  if (!isOpen || !reminder) {
    return null;
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={hideReminder}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
             <BellRing className="h-6 w-6 text-primary" />
            {reminder.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {reminder.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction asChild>
             <Button onClick={hideReminder}>Acknowledge</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
