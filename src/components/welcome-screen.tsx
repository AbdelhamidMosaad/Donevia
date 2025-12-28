
'use client';

import { DoneviaLogo } from '@/components/logo';

export function WelcomeScreen() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center animated-gradient-background">
      <div className="flex flex-col items-center gap-6 text-center text-white p-8 bg-black/20 backdrop-blur-lg rounded-3xl shadow-2xl">
        <DoneviaLogo className="h-auto w-48" />
        <div className="space-y-1">
          <h1 className="text-4xl font-bold font-headline tracking-tight">Donevia</h1>
          <p className="text-white/80">Get it done, your way.</p>
        </div>
        <div className="mt-4">
           <div className="relative w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-1/3 bg-white rounded-full animate-pulse"></div>
            </div>
        </div>
      </div>
    </div>
  );
}
