
'use client';

import { useMemo } from 'react';
import type { WorkActivity, WorkTrackerSettings } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useAuth } from '@/hooks/use-auth';
import moment from 'moment';
import { DollarSign, Hourglass, TrendingUp } from 'lucide-react';

interface AnalyticsDashboardProps {
  activities: WorkActivity[];
  settings: WorkTrackerSettings;
}

const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    EGP: 'E£',
};

const COLORS = ["#4361EE", "#F72585", "#4CC9F0", "#7209B7", "#3A0CA3", "#B5179E", "#F48C06", "#FFBA08"];

export function AnalyticsDashboard({ activities, settings }: AnalyticsDashboardProps) {
  const { settings: authSettings } = useAuth();
  const currencySymbol = currencySymbols[authSettings.currency || 'USD'] || '$';

  const totalRevenue = useMemo(() => {
    return activities.reduce((sum, activity) => sum + (activity.amount || 0), 0);
  }, [activities]);
  
  const totalOvertimeHours = useMemo(() => {
    return activities.reduce((sum, activity) => sum + (activity.overtimeHours || 0), 0);
  }, [activities]);
  
  const averageRevenue = useMemo(() => {
      const activitiesWithRevenue = activities.filter(a => (a.amount || 0) > 0);
      if (activitiesWithRevenue.length === 0) return 0;
      return totalRevenue / activitiesWithRevenue.length;
  }, [activities, totalRevenue]);

  const revenueBy = (key: 'category' | 'customer' | 'appointment') => {
      const data: Record<string, number> = {};
      activities.forEach(activity => {
          const name = activity[key === 'appointment' ? 'appointment' : key];
          if(name && (activity.amount || 0) > 0) {
              data[name] = (data[name] || 0) + activity.amount!;
          }
      });
      return Object.entries(data).map(([name, value]) => ({ name, value }));
  }
  
  const revenueByCategory = useMemo(() => revenueBy('category'), [activities]);
  const revenueByCustomer = useMemo(() => revenueBy('customer'), [activities]);
  const revenueByAppointment = useMemo(() => revenueBy('appointment'), [activities]);

  const monthlyRevenue = useMemo(() => {
      const data: Record<string, number> = {};
      const last6Months = Array.from({length: 6}, (_, i) => moment().subtract(i, 'months').format('YYYY-MM'));
      
      last6Months.forEach(month => data[month] = 0);

      activities.forEach(activity => {
          const month = moment(activity.date.toDate()).format('YYYY-MM');
          if (data[month] !== undefined) {
              data[month] += (activity.amount || 0);
          }
      });

      return Object.entries(data).map(([month, revenue]) => ({
          name: moment(month, 'YYYY-MM').format('MMM YY'),
          revenue,
      })).reverse();
  }, [activities]);
  
  const renderPieChart = (data: {name: string, value: number}[], title: string) => {
      if (data.length === 0) return <p className="text-muted-foreground text-center py-8">No revenue data for {title.toLowerCase()}.</p>;
      return (
          <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                  <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {data.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${currencySymbol}${Number(value).toFixed(2)}`} />} />
                  <Legend />
              </PieChart>
          </ResponsiveContainer>
      );
  }

  if (activities.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 border rounded-lg bg-muted/50">
        <p className="text-muted-foreground">No activities recorded for the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-3">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{totalRevenue.toFixed(2)}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Overtime</CardTitle>
                    <Hourglass className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalOvertimeHours} hours</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Revenue / Activity</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{currencySymbol}{averageRevenue.toFixed(2)}</div>
                </CardContent>
            </Card>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Total revenue over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={{}} className="h-[300px] w-full">
                    <ResponsiveContainer>
                        <BarChart data={monthlyRevenue}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                            <YAxis tickFormatter={(value) => `${currencySymbol}${value}`}/>
                            <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${currencySymbol}${Number(value).toFixed(2)}`} />} />
                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={4} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
        
        <div className="grid gap-6 md:grid-cols-3">
             <Card>
                <CardHeader>
                    <CardTitle>Revenue by Category</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderPieChart(revenueByCategory, "Categories")}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Revenue by Customer</CardTitle>
                </CardHeader>
                <CardContent>
                    {renderPieChart(revenueByCustomer, "Customers")}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Revenue by Appointment Type</CardTitle>
                </CardHeader>
                <CardContent>
                   {renderPieChart(revenueByAppointment, "Appointments")}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
