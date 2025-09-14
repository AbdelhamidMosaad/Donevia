
'use client';

import type { RecapResponse } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Lightbulb, Focus, BarChart3 } from 'lucide-react';

interface RecapDisplayProps {
  recap: RecapResponse;
  period: 'daily' | 'weekly';
}

export function RecapDisplay({ recap, period }: RecapDisplayProps) {
  const {
    title,
    quantitativeSummary,
    accomplishments,
    challenges,
    productivityInsights,
    nextPeriodFocus,
  } = recap;

  return (
    <Card className="shadow-lg animate-in fade-in-50">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">{title}</CardTitle>
        <CardDescription>
          Your AI-generated summary for this {period}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quantitative Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{quantitativeSummary.tasksCompleted}</p>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
            </div>
             <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{quantitativeSummary.milestonesCompleted}</p>
                <p className="text-sm text-muted-foreground">Milestones Hit</p>
            </div>
             <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-3xl font-bold text-purple-600">{quantitativeSummary.tasksCreated}</p>
                <p className="text-sm text-muted-foreground">Tasks Created</p>
            </div>
        </div>

        {/* Accomplishments */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Key Accomplishments
          </h3>
          <ul className="list-disc list-inside pl-2 space-y-1 text-muted-foreground">
            {accomplishments.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Challenges */}
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Challenges & Overdue Items
          </h3>
          <ul className="list-disc list-inside pl-2 space-y-1 text-muted-foreground">
            {challenges.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        {/* Insights & Focus */}
         <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-400">
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <Lightbulb className="h-5 w-5 text-blue-500" />
                    Productivity Insight
                </h3>
                <p className="text-sm text-muted-foreground">{productivityInsights}</p>
            </div>
             <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-400">
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                    <Focus className="h-5 w-5 text-purple-500" />
                    Focus for Next {period === 'daily' ? 'Day' : 'Week'}
                </h3>
                <p className="text-sm text-muted-foreground">{nextPeriodFocus}</p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
