
'use client';

import { useMemo } from 'react';
import type { Task, Stage } from '@/lib/types';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import moment from 'moment';

interface AnalyticsDashboardProps {
  tasks: Task[];
  stages: Stage[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export function AnalyticsDashboard({ tasks, stages }: AnalyticsDashboardProps) {

  const doneStageIds = useMemo(() => stages.filter(s => s.name.toLowerCase() === 'done').map(s => s.id), [stages]);

  const tasksCompleted = useMemo(() => tasks.filter(t => doneStageIds.includes(t.status)).length, [tasks, doneStageIds]);
  const tasksOverdue = useMemo(() => tasks.filter(t => moment(t.dueDate.toDate()).isBefore(moment(), 'day') && !doneStageIds.includes(t.status)).length, [tasks, doneStageIds]);
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;
  
  const averageTasksPerDay = useMemo(() => {
    if (tasks.length === 0) return 0;
    const firstTaskDate = tasks.reduce((oldest, task) => {
        if (task.createdAt && task.createdAt.toDate() < oldest) {
            return task.createdAt.toDate();
        }
        return oldest;
    }, new Date());
    const daysSinceFirstTask = moment().diff(moment(firstTaskDate), 'days') + 1;
    return tasksCompleted / daysSinceFirstTask;
  }, [tasks, tasksCompleted]);

  const tasksByStatus = useMemo(() => {
    const stageMap = new Map(stages.map(s => [s.id, s.name]));
    const counts: Record<string, number> = {};
    
    tasks.forEach(task => {
        const stageName = stageMap.get(task.status) || 'Uncategorized';
        counts[stageName] = (counts[stageName] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));

  }, [tasks, stages]);

  const completionsLast7Days = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => moment().subtract(i, 'days'));
    return last7Days.map(day => {
        const count = tasks.filter(task => 
            doneStageIds.includes(task.status) && 
            moment(task.dueDate.toDate()).isSame(day, 'day')
        ).length;
        return {
            date: day.format('ddd'),
            completed: count
        };
    }).reverse();
  }, [tasks, doneStageIds]);


  return (
    <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader>
                    <CardTitle>Tasks Completed</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{tasksCompleted}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Tasks Overdue</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{tasksOverdue}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{completionRate.toFixed(1)}%</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Avg. Daily Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-4xl font-bold">{averageTasksPerDay.toFixed(1)}</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                <CardTitle>Tasks by Status</CardTitle>
                <CardDescription>A breakdown of all your tasks by their current stage.</CardDescription>
                </CardHeader>
                <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={tasksByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {tasksByStatus.map((entry, index) => (
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
                <CardTitle>Completions This Week</CardTitle>
                <CardDescription>Number of tasks completed over the last 7 days.</CardDescription>
                </CardHeader>
                <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={completionsLast7Days}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="completed" fill="var(--color-primary)" radius={4} />
                    </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
