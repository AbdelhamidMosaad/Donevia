
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const AdvancedMindMap = dynamic(
  () => import('@/components/mind-map/mind-map-tool'),
  { 
    ssr: false,
    loading: () => (
        <div className="w-full h-full p-4">
            <Skeleton className="w-full h-full" />
        </div>
    )
  }
);

export default function MindMapCanvasPage() {
  return <AdvancedMindMap />;
}
