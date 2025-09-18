
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const DigitalWhiteboard = dynamic(
  () => import('@/components/whiteboard/digital-whiteboard'),
  { 
    ssr: false,
    loading: () => (
        <div className="w-full h-full p-4">
            <Skeleton className="w-full h-full" />
        </div>
    )
  }
);

export default function WhiteboardCanvasPage() {
  return <DigitalWhiteboard />;
}
