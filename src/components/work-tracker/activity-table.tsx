
'use client';

import { useState, useMemo } from 'react';
import type { WorkActivity } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import moment from 'moment';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface ActivityTableProps {
    activities: WorkActivity[];
}

const appointmentOptions = ["Meeting", "Client Visit", "Phone Call", "Project Work", "Training", "Presentation", "Site Inspection"];
const categoryOptions = ["Administration", "Sales", "Marketing", "Development", "Support", "Planning", "Research"];
const customerOptions = ["ABC Corporation", "XYZ Ltd", "Global Tech", "Innovate Solutions", "Prime Services", "Tech Masters"];

export function ActivityTable({ activities }: ActivityTableProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [filterDate, setFilterDate] = useState('');
    const [filterAppointment, setFilterAppointment] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterCustomer, setFilterCustomer] = useState('');

    const filteredActivities = useMemo(() => {
        return activities.filter(activity => {
            if (filterDate && moment(activity.date.toDate()).format('YYYY-MM-DD') !== filterDate) return false;
            if (filterAppointment && activity.appointment !== filterAppointment) return false;
            if (filterCategory && activity.category !== filterCategory) return false;
            if (filterCustomer && activity.customer !== filterCustomer) return false;
            return true;
        });
    }, [activities, filterDate, filterAppointment, filterCategory, filterCustomer]);

    const resetFilters = () => {
        setFilterDate('');
        setFilterAppointment('');
        setFilterCategory('');
        setFilterCustomer('');
    };

    const handleDelete = async (activityId: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'workActivities', activityId));
            toast({ title: 'Activity deleted successfully!' });
        } catch (e) {
            console.error("Error deleting activity:", e);
            toast({ variant: 'destructive', title: 'Failed to delete activity.' });
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 border rounded-lg">
                <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} placeholder="Filter by date" />
                <Select value={filterAppointment} onValueChange={setFilterAppointment}>
                    <SelectTrigger><SelectValue placeholder="All Appointments" /></SelectTrigger>
                    <SelectContent>{appointmentOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
                 <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                    <SelectContent>{categoryOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
                 <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                    <SelectTrigger><SelectValue placeholder="All Customers" /></SelectTrigger>
                    <SelectContent>{customerOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                </Select>
                <Button onClick={resetFilters} variant="outline">Reset Filters</Button>
            </div>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Appointment</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Travel</TableHead>
                            <TableHead>OT Hours</TableHead>
                            <TableHead>OT Days</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredActivities.length > 0 ? (
                            filteredActivities.map(activity => (
                                <TableRow key={activity.id}>
                                    <TableCell>{moment(activity.date.toDate()).format('YYYY-MM-DD')}</TableCell>
                                    <TableCell>{activity.appointment}</TableCell>
                                    <TableCell>{activity.category}</TableCell>
                                    <TableCell>{activity.description}</TableCell>
                                    <TableCell>{activity.customer}</TableCell>
                                    <TableCell>{activity.invoiceNumber || '-'}</TableCell>
                                    <TableCell>{activity.amount?.toFixed(2) || '-'}</TableCell>
                                    <TableCell>{activity.travelAllowance?.toFixed(2) || '-'}</TableCell>
                                    <TableCell>{activity.overtimeHours || '-'}</TableCell>
                                    <TableCell>{activity.overtimeDays || '-'}</TableCell>
                                    <TableCell>{activity.notes || '-'}</TableCell>
                                    <TableCell>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the activity.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(activity.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={12} className="h-24 text-center">
                                    No activities found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
