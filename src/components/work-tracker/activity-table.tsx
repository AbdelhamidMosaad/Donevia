
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { WorkActivity, WorkTrackerSettings } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, FileDown, RefreshCcw, ArrowUpDown, Edit, ChevronDown } from 'lucide-react';
import moment from 'moment';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import * as XLSX from 'xlsx';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityDialog } from './activity-dialog';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


interface ActivityTableProps {
    activities: WorkActivity[];
    settings: WorkTrackerSettings;
    onFilteredTradesChange: (filteredTrades: WorkActivity[]) => void;
}

type SortableColumn = 'date' | 'appointment' | 'category' | 'customer' | 'amount';
type SortDirection = 'asc' | 'desc';

export function ActivityTable({ activities, settings, onFilteredTradesChange }: ActivityTableProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    
    // Filter states
    const [dateFilterType, setDateFilterType] = useState<'all' | 'month' | 'period'>('all');
    const [filterMonth, setFilterMonth] = useState<string>(moment().format('M'));
    const [filterYear, setFilterYear] = useState<string>(moment().format('YYYY'));
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');
    const [filterAppointment, setFilterAppointment] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterCustomer, setFilterCustomer] = useState('all');
    
    // Sorting states
    const [sortColumn, setSortColumn] = useState<SortableColumn>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const [editingActivity, setEditingActivity] = useState<WorkActivity | null>(null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(true);

    const filteredAndSortedActivities = useMemo(() => {
        let filtered = activities.filter(activity => {
            const activityDate = moment(activity.date.toDate());
            
            if (dateFilterType === 'month') {
                if(!filterYear || !filterMonth) return true;
                if (activityDate.year() !== parseInt(filterYear) || (activityDate.month() + 1) !== parseInt(filterMonth)) {
                    return false;
                }
            } else if (dateFilterType === 'period') {
                const start = filterStartDate ? moment(filterStartDate).startOf('day') : null;
                const end = filterEndDate ? moment(filterEndDate).endOf('day') : null;
                if (start && activityDate.isBefore(start)) return false;
                if (end && activityDate.isAfter(end)) return false;
            }

            if (filterAppointment !== 'all' && activity.appointment !== filterAppointment) return false;
            if (filterCategory !== 'all' && activity.category !== filterCategory) return false;
            if (filterCustomer !== 'all' && activity.customer !== filterCustomer) return false;
            
            return true;
        });

        // Sorting logic
        return filtered.sort((a, b) => {
            const aVal = a[sortColumn as keyof WorkActivity];
            const bVal = b[sortColumn as keyof WorkActivity];

            let comparison = 0;
            if (sortColumn === 'date') {
                comparison = moment(a.date.toDate()).diff(moment(b.date.toDate()));
            } else if (typeof aVal === 'string' && typeof bVal === 'string') {
                comparison = aVal.localeCompare(bVal);
            } else if (typeof aVal === 'number' && typeof bVal === 'number') {
                comparison = aVal - bVal;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });

    }, [activities, dateFilterType, filterMonth, filterYear, filterStartDate, filterEndDate, filterAppointment, filterCategory, filterCustomer, sortColumn, sortDirection]);

    useEffect(() => {
        onFilteredTradesChange(filteredAndSortedActivities);
    }, [filteredAndSortedActivities, onFilteredTradesChange]);


    const handleSort = (column: SortableColumn) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }

    const renderSortArrow = (column: SortableColumn) => {
        if (sortColumn !== column) return null;
        return <ArrowUpDown className="h-4 w-4 ml-2" />;
    };

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
        const dataToExport = filteredAndSortedActivities.map(a => ({
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
    
    const settingsMap = useMemo(() => ({
        appointmentOptions: new Map(settings.appointmentOptions?.map(o => [o.value, o.color])),
        categoryOptions: new Map(settings.categoryOptions?.map(o => [o.value, o.color])),
        customerOptions: new Map(settings.customerOptions?.map(o => [o.value, o.color])),
    }), [settings]);

    return (
        <>
            <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Filters & Export</CardTitle>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <ChevronDown className={cn("h-5 w-5 transition-transform", !isFiltersOpen && "-rotate-90")} />
                            </Button>
                        </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
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
                            <div className="flex flex-col space-y-1.5">
                                <Label>Appointment</Label>
                                <Select value={filterAppointment} onValueChange={setFilterAppointment}>
                                    <SelectTrigger><SelectValue placeholder="All Appointments" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Appointments</SelectItem>
                                        {settings.appointmentOptions?.map(o => <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label>Category</Label>
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger><SelectValue placeholder="All Categories" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {settings.categoryOptions?.map(o => <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label>Customer</Label>
                                <Select value={filterCustomer} onValueChange={setFilterCustomer}>
                                    <SelectTrigger><SelectValue placeholder="All Customers" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Customers</SelectItem>
                                        {settings.customerOptions?.map(o => <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={resetFilters} variant="outline" className="w-full">
                                    <RefreshCcw />
                                    Reset
                                </Button>
                                <Button onClick={handleExport} variant="outline" className="w-full">
                                    <FileDown />
                                    Export
                                </Button>
                            </div>
                        </CardContent>
                    </CollapsibleContent>
                </Card>
            </Collapsible>
      
            <div className="border rounded-lg">
                <TooltipProvider>
                <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('date')}>
                            <div className="flex items-center">Date {renderSortArrow('date')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('appointment')}>
                            <div className="flex items-center">Appointment {renderSortArrow('appointment')}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
                            <div className="flex items-center">Category {renderSortArrow('category')}</div>
                        </TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('customer')}>
                            <div className="flex items-center">Customer {renderSortArrow('customer')}</div>
                        </TableHead>
                        <TableHead>Invoice #</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleSort('amount')}>
                            <div className="flex items-center">Amount {renderSortArrow('amount')}</div>
                        </TableHead>
                        <TableHead>Travel</TableHead>
                        <TableHead>OT Hours</TableHead>
                        <TableHead>OT Days</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredAndSortedActivities.length > 0 ? (
                        filteredAndSortedActivities.map(activity => (
                            <TableRow key={activity.id}>
                                <TableCell>{moment(activity.date.toDate()).format('YYYY-MM-DD')}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: settingsMap.appointmentOptions.get(activity.appointment) }} />
                                        {activity.appointment}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: settingsMap.categoryOptions.get(activity.category) }} />
                                        {activity.category}
                                    </div>
                                </TableCell>
                                <TableCell>{activity.description}</TableCell>
                                <TableCell>
                                        <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: settingsMap.customerOptions.get(activity.customer) }} />
                                        {activity.customer}
                                    </div>
                                </TableCell>
                                <TableCell>{activity.invoiceNumber || '-'}</TableCell>
                                <TableCell>{activity.amount?.toFixed(2) || '-'}</TableCell>
                                <TableCell>{activity.travelAllowance?.toFixed(2) || '-'}</TableCell>
                                <TableCell>{activity.overtimeHours || '-'}</TableCell>
                                <TableCell>{activity.overtimeDays || '-'}</TableCell>
                                <TableCell>{activity.notes || '-'}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="icon" onClick={() => setEditingActivity(activity)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
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
                                    </div>
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
                </TooltipProvider>
            </div>
            {editingActivity && (
                 <ActivityDialog
                    activity={editingActivity}
                    isOpen={!!editingActivity}
                    onOpenChange={(isOpen) => !isOpen && setEditingActivity(null)}
                    settings={settings}
                    onAddNewItem={() => {}} // This is handled in the main page form
                />
            )}
        </>
    );
}
