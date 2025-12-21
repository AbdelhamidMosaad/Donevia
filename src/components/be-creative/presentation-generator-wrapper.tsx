// src/components/be-creative/presentation-generator-wrapper.tsx
'use client';

import dynamic from 'next/dynamic';

const PresentationGenerator = dynamic(
  () => import('./presentation-generator'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading presentation tools...</p>
        </div>
      </div>
    ),
  }
);

export default PresentationGenerator;