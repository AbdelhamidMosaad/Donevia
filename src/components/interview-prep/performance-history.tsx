
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function PerformanceHistory() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Performance History</CardTitle>
                <CardDescription>Review your past interview sessions and track your progress.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>A list or chart of past performance will be shown here.</p>
            </CardContent>
        </Card>
    )
}
