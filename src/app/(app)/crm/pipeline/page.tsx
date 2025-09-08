
'use client';

import { RequestBoard } from '@/components/crm/request-board';
import { Kanban } from 'lucide-react';

export default function PipelinePage() {
    return (
        <div className="flex flex-col h-full">
             <div className="flex items-center gap-4 mb-6">
                <Kanban className="h-8 w-8 text-primary"/>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Sales Pipeline</h1>
                    <p className="text-muted-foreground">Manage your deals through a visual pipeline.</p>
                </div>
            </div>
            <div className="flex-1 overflow-x-auto">
                <RequestBoard />
            </div>
        </div>
    )
}
