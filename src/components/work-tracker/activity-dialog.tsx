'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateDoc, doc, Timestamp, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import moment from 'moment';
import type { WorkActivity, WorkTrackerSettings } from '@/lib/types';
import { Save } from 'lucide-react';

const activitySchema = z.object({
    date: z.string().nonempty('Date is required.'),
    appointment: z.string().nonempty('Appointment type is required.'),
    category: z.string().nonempty('Task category is required.'),
    description: z.string().optional(),
    customer: z.string().nonempty('Customer is required.'),
    invoiceNumber: z.string().optional(),
    amount: z.coerce.number().optional(),
    travelAllowance: z.coerce.number().optional(),
    overtimeHours: z.coerce.number().optional(),
    overtimeDays: z.coerce.number().optional(),
    notes: z.string().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityDialogProps {
    activity: Partial<WorkActivity>;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    settings: WorkTrackerSettings;
    onAddNewItem: (type: 'appointmentOptions' | 'categoryOptions' | 'customerOptions', value: string) => void;
}

export function ActivityDialog({ activity, isOpen, onOpenChange, settings, onAddNewItem }: ActivityDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    const form = useForm<ActivityFormData>({
        resolver: zodResolver(activitySchema),
        defaultValues: {
            date: activity.date ? moment(activity.date.toDate()).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
            appointment: activity.appointment || '',
            category: activity.category || '',
            customer: activity.customer || '',
            description: activity.description || '',
            invoiceNumber: activity.invoiceNumber || '',
            notes: activity.notes || '',
            amount: activity.amount || 0,
            travelAllowance: activity.travelAllowance || 0,
            overtimeHours: activity.overtimeHours || 0,
            overtimeDays: activity.overtimeDays || 0,
        }
    });

    useEffect(() => {
        form.reset({
            date: activity.date ? moment(activity.date.toDate()).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
            appointment: activity.appointment || '',
            category: activity.category || '',
            customer: activity.customer || '',
            description: activity.description || '',
            invoiceNumber: activity.invoiceNumber || '',
            notes: activity.notes || '',
            amount: activity.amount || 0,
            travelAllowance: activity.travelAllowance || 0,
            overtimeHours: activity.overtimeHours || 0,
            overtimeDays: activity.overtimeDays || 0,
        });
    }, [activity, form]);

    const onSubmit = async (data: ActivityFormData) => {
        if (!user) return;
        setIsSaving(true);
        try {
            if (activity.id) { // If it's an existing activity (or a duplicate with a temp ID)
                 const activityRef = doc(db, 'users', user.uid, 'workActivities', activity.id);
                 await updateDoc(activityRef, {
                    ...data,
                    date: Timestamp.fromDate(new Date(data.date)),
                    updatedAt: Timestamp.now(),
                });
                toast({ title: 'Activity updated successfully!' });
            } else { // It's a new duplicated activity
                 await addDoc(collection(db, 'users', user.uid, 'workActivities'), {
                    ...data,
                    ownerId: user.uid,
                    date: Timestamp.fromDate(new Date(data.date)),
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                toast({ title: 'Duplicated activity created!' });
            }
            onOpenChange(false);
        } catch (e) {
            console.error("Error saving activity: ", e);
            toast({ variant: 'destructive', title: 'Failed to save activity.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{activity.id ? 'Edit Activity' : 'Duplicate Activity'}</DialogTitle>
                    <DialogDescription>{activity.id ? 'Update the details of your logged activity.' : 'Modify the details for the new duplicated activity.'}</DialogDescription>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-1">
                         <div className="flex flex-col space-y-1.5">
                            <label>Date</label>
                            <Input type="date" {...form.register('date')} />
                            {form.formState.errors.date && <p className="text-destructive text-xs">{form.formState.errors.date.message}</p>}
                        </div>

                        <Controller
                            name="appointment"
                            control={form.control}
                            render={({ field }) => (
                                <div className="flex flex-col space-y-1.5">
                                    <label>Appointment</label>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Select Appointment" /></SelectTrigger>
                                        <SelectContent>
                                            {settings.appointmentOptions?.map(o => <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        />
                         <Controller
                            name="category"
                            control={form.control}
                            render={({ field }) => (
                                <div className="flex flex-col space-y-1.5">
                                    <label>Category</label>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                        <SelectContent>
                                            {settings.categoryOptions?.map(o => <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        />
                        <Controller
                            name="customer"
                            control={form.control}
                            render={({ field }) => (
                                <div className="flex flex-col space-y-1.5">
                                    <label>Customer</label>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
                                        <SelectContent>
                                            {settings.customerOptions?.map(o => <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        />
                         <div className="flex flex-col space-y-1.5 md:col-span-2">
                            <label>Description</label>
                            <Input placeholder="Activity description..." {...form.register('description')} />
                        </div>
                         <div className="flex flex-col space-y-1.5">
                            <label>Invoice Number</label>
                            <Input placeholder="e.g. INV-001" {...form.register('invoiceNumber')} />
                        </div>
                         <div className="flex flex-col space-y-1.5">
                            <label>Amount ($)</label>
                            <Input type="number" placeholder="0.00" {...form.register('amount')} />
                        </div>

                        <div className="flex flex-col space-y-1.5">
                            <label>Travel Allowance ($)</label>
                            <Input type="number" placeholder="0.00" {...form.register('travelAllowance')} />
                        </div>
                         <div className="flex flex-col space-y-1.5">
                            <label>Overtime Hours</label>
                            <Input type="number" placeholder="0" {...form.register('overtimeHours')} />
                        </div>
                         <div className="flex flex-col space-y-1.5">
                            <label>Overtime Days</label>
                            <Input type="number" placeholder="0" {...form.register('overtimeDays')} />
                        </div>
                         <div className="flex flex-col space-y-1.5 md:col-span-2">
                            <label>Notes</label>
                            <Textarea placeholder="Additional notes..." {...form.register('notes')} />
                        </div>
                    </div>
                     <DialogFooter className="pt-4">
                        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                        <Button type="submit" disabled={isSaving}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
