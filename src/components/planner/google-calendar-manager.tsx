
'use client';

import { useGoogleCalendar } from '@/hooks/use-google-calendar';
import { Button } from '../ui/button';
import { Calendar, Trash2 } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function GoogleCalendarManager() {
    const { isConnected, isLoading, connect, disconnect } = useGoogleCalendar();

    if (isLoading) {
        return <Button variant="outline" disabled>Loading...</Button>;
    }

    if (isConnected) {
        return (
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Disconnect Calendar
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will disconnect your Google Calendar. You can reconnect it at any time.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={disconnect}>Disconnect</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        );
    }

    return (
        <Button onClick={connect} variant="outline">
            <Calendar className="mr-2 h-4 w-4" /> Connect Google Calendar
        </Button>
    );
}
