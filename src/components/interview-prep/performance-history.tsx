
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import moment from "moment";

// Sample data until we have real sessions
const sampleSessions = [
    {
        id: "sample-session-1",
        jobTitle: "Senior Product Manager",
        createdAt: new Date(),
        status: "completed",
        overallScore: 85,
    }
];


export function PerformanceHistory() {
    const router = useRouter();

    const handleRowClick = (sessionId: string) => {
        router.push(`/interview-prep/${sessionId}`);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Performance History</CardTitle>
                <CardDescription>Review your past interview sessions and track your progress.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Job Title</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Overall Score</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sampleSessions.length > 0 ? (
                            sampleSessions.map(session => (
                                <TableRow key={session.id} onClick={() => handleRowClick(session.id)} className="cursor-pointer">
                                    <TableCell className="font-medium">{session.jobTitle}</TableCell>
                                    <TableCell>{moment(session.createdAt).format('YYYY-MM-DD')}</TableCell>
                                    <TableCell><Badge>{session.status}</Badge></TableCell>
                                    <TableCell>{session.overallScore}%</TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No completed interview sessions found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
