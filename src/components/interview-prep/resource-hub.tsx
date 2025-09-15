
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function ResourceHub() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Resource Hub</CardTitle>
                <CardDescription>Tips, tricks, and checklists for interview success.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Links to articles, tips, and downloadable resources will appear here.</p>
            </CardContent>
        </Card>
    )
}
