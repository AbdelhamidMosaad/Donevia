
'use client';

import { useState, useMemo } from 'react';
import type { WorkActivity, WorkTrackerSettings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, FileDown } from 'lucide-react';
import moment from 'moment';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import * as XLSX from 'xlsx';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface ActivityTableProps {
    activities: WorkActivity[];
    settings: WorkTrackerSettings;
}

export function ActivityTable({ activities, settings }: ActivityTableProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    
    // State for filters
    const [dateFilterType, setDateFilterType] = useState<'all' | 'month' | 'period'>('all');
    const [filterMonth, setFilterMonth] = useState<string>(moment().format('M'));
    const [filterYear, setFilterYear] = useState<string>(moment().format('YYYY'));
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');
    const [filterAppointment, setFilterAppointment] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterCustomer, setFilterCustomer] = useState('all');

    const filteredActivities = useMemo(() => {
        return activities.filter(activity => {
            const activityDate = moment(activity.date.toDate());
            
            // Date filtering
            if (dateFilterType === 'month') {
                if(!filterYear || !filterMonth) return true; // Don't filter if year or month is not set
                if (activityDate.year() !== parseInt(filterYear) || (activityDate.month() + 1) !== parseInt(filterMonth)) {
                    return false;
                }
            } else if (dateFilterType === 'period') {
                const start = filterStartDate ? moment(filterStartDate).startOf('day') : null;
                const end = filterEndDate ? moment(filterEndDate).endOf('day') : null;
                if (start && activityDate.isBefore(start)) return false;
                if (end && activityDate.isAfter(end)) return false;
            }

            // Other filters
            if (filterAppointment !== 'all' && activity.appointment !== filterAppointment) return false;
            if (filterCategory !== 'all' && activity.category !== filterCategory) return false;
            if (filterCustomer !== 'all' && activity.customer !== filterCustomer) return false;
            
            return true;
        });
    }, [activities, dateFilterType, filterMonth, filterYear, filterStartDate, filterEndDate, filterAppointment, filterCategory, filterCustomer]);

    const resetFilters = () => {
        setDateFilterType('all');
        setFilterMonth(moment().format('M'));
        setFilterYear(moment().format('YYYY'));
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterAppointment('all');
        setFilterCategory('all');
        setFilterCustomer('all');
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

    const handleExport = () => {
        const dataToExport = filteredActivities.map(a => ({
            Date: moment(a.date.toDate()).format('YYYY-MM-DD'),
            Appointment: a.appointment,
            Category: a.category,
            Description: a.description,
            Customer: a.customer,
            'Invoice #': a.invoiceNumber,
            Amount: a.amount,
            'Travel Allowance': a.travelAllowance,
            'Overtime Hours': a.overtimeHours,
            'Overtime Days': a.overtimeDays,
            Notes: a.notes,
        }));
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'WorkActivities');
        XLSX.writeFile(workbook, 'Work_Activities.xlsx');
        toast({ title: 'Exporting data...' });
    }

    const availableYears = useMemo(() => {
        if (activities.length === 0) return [moment().year().toString()];
        const years = new Set(activities.map(a => moment(a.date.toDate()).year()));
        return Array.from(years).sort((a,b) => b-a).map(String);
    }, [activities]);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Filters &amp; Export</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
                    {/* Date Filters */}
                    <div className="flex flex-col space-y-1.5">
                        <Label>Date Filter</Label>
                        <Select value={dateFilterType} onValueChange={(v: 'all' | 'month' | 'period') => setDateFilterType(v)}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="month">By Month</SelectItem>
                                <SelectItem value="period">By Period</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {dateFilterType === 'month' && (
                        <>
                            <div className="flex flex-col space-y-1.5">
                                <Label>Month</Label>
                                <Select value={filterMonth} onValueChange={setFilterMonth}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {moment.months().map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label>Year</Label>
                                <Select value={filterYear} onValueChange={setFilterYear}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    {dateFilterType === 'period' && (
                        <>
                            <div className="flex flex-col space-y-1.5">
                                <Label>Start Date</Label>
                                <Input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label>End Date</Label>
                                <Input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
                            </div>
                        </>
                    )}

                    {/* Other Filters */}
                    <div className="flex flex-col space-y-1.5">
                        <Label>Appointment</Label>
                        <Select value={filterAppointment} onValueChange={setFilterAppointment}>
                            <SelectTrigger><SelectValue placeholder="All Appointments" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Appointments</SelectItem>
                                {settings.appointmentOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <Label>Category</Label>
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {settings.categoryOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <Label>Customer</Label>
                        <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                            <SelectTrigger><SelectValue placeholder="All Customers" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Customers</SelectItem>
                                {settings.customerOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={resetFilters} variant="outline" className="w-full">Reset</Button>
                        <Button onClick={handleExport} className="w-full"><FileDown className="mr-2 h-4 w-4" /> Export</Button>
                    </div>
                </CardContent>
            </Card>

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
                                    No activities found for the selected filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
