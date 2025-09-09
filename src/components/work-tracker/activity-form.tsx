
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';
import moment from 'moment';
import type { WorkTrackerSettings } from '@/lib/types';
import { AddSettingItem } from './add-setting-item';
import { Separator } from '../ui/separator';

const activitySchema = z.object({
    date: z.string().nonempty('Date is required.'),
    appointment: z.string().nonempty('Appointment type is required.'),
    category: z.string().nonempty('Task category is required.'),
    description: z.string().nonempty('Description is required.'),
    customer: z.string().nonempty('Customer is required.'),
    invoiceNumber: z.string().optional(),
    amount: z.coerce.number().optional(),
    travelAllowance: z.coerce.number().optional(),
    overtimeHours: z.coerce.number().optional(),
    overtimeDays: z.coerce.number().optional(),
    notes: z.string().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

interface ActivityFormProps {
    settings: WorkTrackerSettings;
    onAddNewItem: (type: 'appointmentOptions' | 'categoryOptions' | 'customerOptions', value: string) => void;
}

export function ActivityForm({ settings, onAddNewItem }: ActivityFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      date: moment().format('YYYY-MM-DD'),
      appointment: '',
      category: '',
      customer: '',
      description: '',
      invoiceNumber: '',
      notes: '',
    },
  });

  const onSubmit = async (data: ActivityFormData) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'You must be logged in.'});
        return;
    }
    console.log('Attempting to save work activity:', data.description);
    setIsSaving(true);
    try {
        await addDoc(collection(db, 'users', user.uid, 'workActivities'), {
            ...data,
            date: Timestamp.fromDate(new Date(data.date)),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        toast({ title: 'Activity logged successfully!' });
        form.reset();
        form.setValue('date', moment().format('YYYY-MM-DD'));
    } catch(e) {
        console.error("Error adding activity: ", e);
        toast({ variant: 'destructive', title: 'Failed to log activity.' });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Log New Activity</CardTitle>
        <CardDescription>Fill out the form below to add a new entry to your activity log.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                {settings.appointmentOptions?.map(o => (
                                    <SelectItem key={o.id} value={o.value}>
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: o.color }} />
                                            {o.value}
                                        </div>
                                    </SelectItem>
                                ))}
                                <Separator />
                                <AddSettingItem type="appointmentOptions" onAdd={onAddNewItem} />
                            </SelectContent>
                        </Select>
                        {form.formState.errors.appointment && <p className="text-destructive text-xs">{form.formState.errors.appointment.message}</p>}
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
                                {settings.categoryOptions?.map(o => (
                                    <SelectItem key={o.id} value={o.value}>
                                       <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: o.color }} />
                                            {o.value}
                                        </div>
                                    </SelectItem>
                                ))}
                                <Separator />
                                <AddSettingItem type="categoryOptions" onAdd={onAddNewItem} />
                            </SelectContent>
                        </Select>
                        {form.formState.errors.category && <p className="text-destructive text-xs">{form.formState.errors.category.message}</p>}
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
                                {settings.customerOptions?.map(o => (
                                    <SelectItem key={o.id} value={o.value}>
                                        <div className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: o.color }} />
                                            {o.value}
                                        </div>
                                    </SelectItem>
                                ))}
                                <Separator />
                                <AddSettingItem type="customerOptions" onAdd={onAddNewItem} />
                            </SelectContent>
                        </Select>
                        {form.formState.errors.customer && <p className="text-destructive text-xs">{form.formState.errors.customer.message}</p>}
                    </div>
                )}
            />

            <div className="flex flex-col space-y-1.5 md:col-span-2">
                <label>Description</label>
                <Input placeholder="Activity description..." {...form.register('description')} />
                {form.formState.errors.description && <p className="text-destructive text-xs">{form.formState.errors.description.message}</p>}
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
        </CardContent>
        <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
                <PlusCircle className="mr-2 h-4 w-4" /> {isSaving ? 'Saved' : 'Add Activity'}
            </Button>
        </CardFooter>
      </form>
    </>
  );
}
