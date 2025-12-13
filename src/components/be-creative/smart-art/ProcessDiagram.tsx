'use client';

import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ProcessDiagramProps {
  items: string[];
}

export function ProcessDiagram({ items }: ProcessDiagramProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <div className="flex items-center gap-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Card className="p-4 bg-primary/10 border-primary/20 shadow-sm">
              <CardContent className="p-0 text-center">
                <p className="font-semibold">{item}</p>
              </CardContent>
            </Card>
            {index < items.length - 1 && (
              <ChevronRight className="h-8 w-8 text-muted-foreground shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
