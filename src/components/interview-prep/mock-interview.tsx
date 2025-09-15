
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function MockInterview() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Mock Interview</CardTitle>
                <CardDescription>Start a simulated interview session.</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Mock interview setup and interaction will go here.</p>
            </CardContent>
        </Card>
    )
}
