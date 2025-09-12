
'use client';

import { useMemo } from 'react';
import type { ClientRequest } from '@/lib/types';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import moment from 'moment';
import { useAuth } from '@/hooks/use-auth';

interface AnalyticsDashboardProps {
  requests: ClientRequest[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    EGP: 'E£',
};

export function AnalyticsDashboard({ requests }: AnalyticsDashboardProps) {
  const { settings } = useAuth();
  const currencySymbol = currencySymbols[settings.currency || 'USD'] || '$';

  const totalDeals = requests.length;
  const wonDeals = useMemo(() => requests.filter(r => r.stage === 'win'), [requests]);
  const lostDeals = useMemo(() => requests.filter(r => r.stage === 'lost'), [requests]);
  
  const winRate = totalDeals > 0 ? (wonDeals.length / totalDeals) * 100 : 0;
  const totalValueWon = useMemo(() => wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0), [wonDeals]);
  
  const averageDealSize = wonDeals.length > 0 ? totalValueWon / wonDeals.length : 0;

  const dealsByStage = useMemo(() => {
    const counts: Record<string, number> = {};
    requests.forEach(req => {
        counts[req.stage] = (counts[req.stage] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [requests]);

  const dealsWonLast7Days = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => moment().subtract(i, 'days'));
    return last7Days.map(day => {
        const count = wonDeals.filter(deal => 
            moment(deal.updatedAt.toDate()).isSame(day, 'day')
        ).length;
        return { date: day.format('ddd'), won: count };
    }).reverse();
  }, [wonDeals]);


  return (
    <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader><CardTitle>Total Deals</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{totalDeals}</p></CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Win Rate</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{winRate.toFixed(1)}%</p></CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Total Value Won</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{currencySymbol}{totalValueWon.toLocaleString()}</p></CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Avg. Deal Size</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{currencySymbol}{averageDealSize.toLocaleString()}</p></CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                <CardTitle>Deals by Stage</CardTitle>
                <CardDescription>A breakdown of all deals by their current stage.</CardDescription>
                </CardHeader>
                <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={dealsByStage} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {dealsByStage.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Deals Won This Week</CardTitle>
                <CardDescription>Number of deals won over the last 7 days.</CardDescription>
                </CardHeader>
                <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dealsWonLast7Days}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="won" fill="var(--color-primary)" radius={4} />
                    </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
