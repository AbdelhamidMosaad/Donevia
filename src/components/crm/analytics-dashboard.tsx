
'use client';

import { useMemo } from 'react';
import type { ClientRequest, Client } from '@/lib/types';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { STAGES } from './request-board';

interface AnalyticsDashboardProps {
  requests: ClientRequest[];
  clients: Client[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export function AnalyticsDashboard({ requests, clients }: AnalyticsDashboardProps) {

  const stageData = useMemo(() => {
    const counts = STAGES.map(stage => ({
      name: stage.name,
      requests: requests.filter(r => r.stage === stage.id).length
    }));
    return counts;
  }, [requests]);

  const valueByStageData = useMemo(() => {
     return STAGES.map(stage => ({
      name: stage.name,
      value: requests
        .filter(r => r.stage === stage.id)
        .reduce((sum, r) => sum + (r.invoiceAmount || 0), 0)
    }));
  }, [requests]);

  const winLossData = useMemo(() => {
    const wins = requests.filter(r => r.stage === 'win').length;
    const losses = requests.filter(r => r.stage === 'lost').length;
    if (wins === 0 && losses === 0) return [];
    return [
      { name: 'Won', value: wins },
      { name: 'Lost', value: losses },
    ];
  }, [requests]);
  
  const lossReasonData = useMemo(() => {
    const reasons = requests
        .filter(r => r.stage === 'lost' && r.lossReason)
        .reduce((acc, r) => {
            acc[r.lossReason!] = (acc[r.lossReason!] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

    return Object.entries(reasons).map(([name, value]) => ({ name, value }));
  }, [requests]);

  const totalClients = clients.length;
  const wonRequests = requests.filter(r => r.stage === 'win');
  const totalWonValue = wonRequests.reduce((sum, r) => sum + (r.invoiceAmount || 0), 0);
  const winRate = winLossData.length > 0 ? (wonRequests.length / (wonRequests.length + requests.filter(r => r.stage === 'lost').length)) * 100 : 0;


  return (
    <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             <Card>
                <CardHeader><CardTitle>Total Clients</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{totalClients}</p></CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Total Won Value</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">${totalWonValue.toLocaleString()}</p></CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle>Win Rate</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{winRate.toFixed(1)}%</p></CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Open Requests</CardTitle></CardHeader>
                <CardContent><p className="text-4xl font-bold">{requests.filter(r => r.stage !== 'win' && r.stage !== 'lost').length}</p></CardContent>
            </Card>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            <Card>
                <CardHeader>
                <CardTitle>Requests by Stage</CardTitle>
                <CardDescription>Number of client requests in each pipeline stage.</CardDescription>
                </CardHeader>
                <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stageData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} />
                        <YAxis allowDecimals={false}/>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="requests" fill="var(--color-primary)" radius={4} />
                    </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Value by Stage</CardTitle>
                <CardDescription>Total invoice amount of requests in each stage.</CardDescription>
                </CardHeader>
                <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={valueByStageData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} interval={0} />
                        <YAxis tickFormatter={(value) => `$${Number(value).toLocaleString()}`} />
                        <ChartTooltip content={<ChartTooltipContent formatter={(value) => `$${Number(value).toLocaleString()}`} />} />
                        <Bar dataKey="value" fill="var(--color-accent)" radius={4} />
                    </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                <CardTitle>Win/Loss Ratio</CardTitle>
                <CardDescription>Ratio of completed requests that were won vs. lost.</CardDescription>
                </CardHeader>
                <CardContent>
                {winLossData.length > 0 ? (
                <ChartContainer config={{}} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={winLossData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {winLossData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
                ) : <p className="text-muted-foreground text-center py-12">No "Won" or "Lost" requests to display.</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                <CardTitle>Loss Reasons</CardTitle>
                <CardDescription>Common reasons for losing deals.</CardDescription>
                </CardHeader>
                <CardContent>
                {lossReasonData.length > 0 ? (
                <ChartContainer config={{}} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lossReasonData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis dataKey="name" type="category" width={100} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" name="Count" fill="var(--color-destructive)" radius={4} />
                    </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
                ) : <p className="text-muted-foreground text-center py-12">No data on loss reasons available.</p>}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
