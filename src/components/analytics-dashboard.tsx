
'use client';

import { useMemo } from 'react';
import type { Task, Stage } from '@/lib/types';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import moment from 'moment';
import Link from 'next/link';

interface AnalyticsDashboardProps {
  tasks: Task[];
  stages: Stage[];
}

function TaskItem({ task }: { task: Task }) {
    return (
        <Link href={`/dashboard/list/${task.listId}`} className="block hover:bg-muted p-2 rounded-md transition-colors">
             <div className="flex justify-between items-start">
                <p className="font-medium text-sm truncate pr-4">{task.title}</p>
                {task.dueDate && <p className="text-xs text-muted-foreground shrink-0">{moment(task.dueDate.toDate()).format('MMM D')}</p>}
             </div>
        </Link>
    );
}

export function AnalyticsDashboard({ tasks, stages }: AnalyticsDashboardProps) {

  const doneStageIds = useMemo(() => stages.filter(s => s.name.toLowerCase() === 'done').map(s => s.id), [stages]);

  const tasksCompleted = useMemo(() => tasks.filter(t => doneStageIds.includes(t.status)).length, [tasks, doneStageIds]);
  const tasksOverdue = useMemo(() => tasks.filter(t => moment(t.dueDate.toDate()).isBefore(moment(), 'day') && !doneStageIds.includes(t.status)).length, [tasks, doneStageIds]);
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;
  
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
  
  const recentTasks = useMemo(() => {
    return [...tasks]
        .sort((a,b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0))
        .slice(0, 5);
  }, [tasks]);

  const highPriorityTasks = useMemo(() => {
    return tasks
        .filter(t => t.priority === 'High' && !doneStageIds.includes(t.status))
        .sort((a,b) => a.dueDate.toMillis() - b.dueDate.toMillis())
        .slice(0, 5);
  }, [tasks, doneStageIds]);
  
  const dueSoonTasks = useMemo(() => {
    const now = moment();
    return tasks
        .filter(t => !doneStageIds.includes(t.status) && moment(t.dueDate.toDate()).isAfter(now))
        .sort((a,b) => a.dueDate.toMillis() - b.dueDate.toMillis())
        .slice(0, 5);
  }, [tasks, doneStageIds]);


  return (
    <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card>
                <CardHeader>
                    <CardTitle>Recently Created</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {recentTasks.length > 0 ? recentTasks.map(t => <TaskItem key={t.id} task={t}/>) : <p className="text-sm text-muted-foreground">No recent tasks.</p>}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>High Priority</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {highPriorityTasks.length > 0 ? highPriorityTasks.map(t => <TaskItem key={t.id} task={t}/>) : <p className="text-sm text-muted-foreground">No high-priority tasks.</p>}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Due Soon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {dueSoonTasks.length > 0 ? dueSoonTasks.map(t => <TaskItem key={t.id} task={t}/>) : <p className="text-sm text-muted-foreground">No upcoming tasks.</p>}
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
