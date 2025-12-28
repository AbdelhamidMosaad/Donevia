
'use client';

import { DoneviaLogo } from '@/components/logo';

export function WelcomeScreen() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background text-foreground z-50 animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-4 p-8 bg-card/50 backdrop-blur-sm rounded-3xl">
        <DoneviaLogo className="h-auto w-48" />
        <div className="text-center">
            <h1 className="text-3xl font-bold font-headline">Donevia</h1>
            <p className="text-muted-foreground">Get it done, your way.</p>
        </div>
        <div className="mt-4">
           <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse w-full"></div>
            </div>
        </div>
      </div>
    </div>
  );
}
