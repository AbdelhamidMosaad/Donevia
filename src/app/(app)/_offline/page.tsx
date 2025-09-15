
'use client';

import { WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <WifiOff className="h-24 w-24 text-muted-foreground mb-4" />
        <h1 className="text-3xl font-bold font-headline">You are offline</h1>
        <p className="text-muted-foreground mt-2">
            It looks like you've lost your internet connection. This page can't be displayed right now.
        </p>
    </div>
  );
}
