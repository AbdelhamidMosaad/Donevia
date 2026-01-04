
'use client';

import { GoogleCalendarManager } from '@/components/planner/google-calendar-manager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Circle, ArrowRight } from 'lucide-react';
import { useGoogleCalendar } from '@/hooks/use-google-calendar';
import { useState } from 'react';
import type { PlannerEvent } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function TestGCalPage() {
    const { isConnected, createGoogleEvent, updateGoogleEvent, deleteGoogleEvent } = useGoogleCalendar();
    const [testState, setTestState] = useState<Record<string, 'pending' | 'success' | 'error'>>({});
    const [createdEventId, setCreatedEventId] = useState<string | null>(null);
    const { toast } = useToast();

    const Step = ({ title, status, children }: { title: string; status: 'pending' | 'success' | 'error'; children: React.ReactNode }) => {
        const statusConfig = {
            pending: { icon: <Circle className="text-muted-foreground" />, color: 'border-border' },
            success: { icon: <CheckCircle className="text-green-500" />, color: 'border-green-500' },
            error: { icon: <AlertCircle className="text-destructive" />, color: 'border-destructive' },
        };
        return (
            <div className={`p-4 border-l-4 ${statusConfig[status].color}`}>
                <div className="flex items-start gap-3">
                    <div className="pt-1">{statusConfig[status].icon}</div>
                    <div>
                        <h4 className="font-bold">{title}</h4>
                        <div className="text-sm text-muted-foreground mt-2 space-y-2">{children}</div>
                    </div>
                </div>
            </div>
        )
    };
    
    const runTest = async (testName: string, testFn: () => Promise<any>) => {
        setTestState(prev => ({...prev, [testName]: 'pending'}));
        try {
            const result = await testFn();
            setTestState(prev => ({...prev, [testName]: 'success'}));
            toast({ title: `${testName} test passed!`, description: 'Check your Google Calendar.' });
            return result;
        } catch (error: any) {
            setTestState(prev => ({...prev, [testName]: 'error'}));
            toast({ variant: 'destructive', title: `Test Failed: ${testName}`, description: error.message });
            return null;
        }
    }

    const testCreate = async () => {
        const event: Partial<PlannerEvent> = {
            title: 'Donevia Test Event',
            description: 'This is a test event created from the Donevia app.',
            start: new Date(),
            end: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
            allDay: false
        };
        const result = await runTest('createEvent', () => createGoogleEvent(event as PlannerEvent));
        if (result && result.id) {
            setCreatedEventId(result.id);
        }
    };
    
    const testUpdate = async () => {
        if (!createdEventId) {
            toast({ variant: 'destructive', title: 'Cannot update, no event created yet.'});
            return;
        }
        const event: Partial<PlannerEvent> = {
            title: 'Donevia Test Event (Updated)',
            description: 'This event has been updated.',
            start: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
            end: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
            allDay: false
        };
         await runTest('updateEvent', () => updateGoogleEvent(createdEventId, event as PlannerEvent));
    };

    const testDelete = async () => {
        if (!createdEventId) {
            toast({ variant: 'destructive', title: 'Cannot delete, no event created yet.'});
            return;
        }
        await runTest('deleteEvent', () => deleteGoogleEvent(createdEventId));
        setCreatedEventId(null);
    };

    return (
        <div className="container py-8">
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>Google Calendar Sync Test Script</CardTitle>
                    <CardDescription>
                        Follow these steps to verify that the Google Calendar integration is working correctly.
                        Check your primary Google Calendar in another window to confirm changes.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Step title="Step 1: Authenticate with Google" status={isConnected ? 'success' : 'pending'}>
                        <p>Click the button below to connect your Google Calendar. This will open a pop-up window for you to sign in and grant permissions.</p>
                        <GoogleCalendarManager />
                        {isConnected && <p className="font-semibold text-green-600">Successfully connected!</p>}
                    </Step>

                    <Step title="Step 2: Create a Test Event" status={testState.createEvent || 'pending'}>
                        <p>This will create a new event in your Google Calendar called "Donevia Test Event" for one hour from now.</p>
                        <Button onClick={testCreate} disabled={!isConnected}>Run Create Test</Button>
                    </Step>
                    
                    <Step title="Step 3: Update the Test Event" status={testState.updateEvent || 'pending'}>
                        <p>This updates the event created in the previous step. The title will change and the event will be moved two hours into the future.</p>
                        <Button onClick={testUpdate} disabled={!createdEventId}>Run Update Test</Button>
                    </Step>

                    <Step title="Step 4: Delete the Test Event" status={testState.deleteEvent || 'pending'}>
                        <p>This will remove the test event from your Google Calendar.</p>
                        <Button onClick={testDelete} disabled={!createdEventId} variant="destructive">Run Delete Test</Button>
                    </Step>

                     <Step title="Step 5: Error Handling (Manual Test)" status="pending">
                        <p>To test error handling:</p>
                        <ol className="list-decimal pl-5 space-y-1">
                            <li>Go to your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Account Permissions</a>.</li>
                            <li>Find "Donevia" in the list and click "Remove access".</li>
                            <li>Return here and try to run the "Create Test" again. It should fail and show an error toast.</li>
                            <li>You can then reconnect using the button in Step 1 to restore functionality.</li>
                        </ol>
                    </Step>
                </CardContent>
            </Card>
        </div>
    );
}
