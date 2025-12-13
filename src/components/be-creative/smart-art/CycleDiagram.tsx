'use client';

import * as React from "react";
import { ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CycleDiagramProps {
  items: string[];
}

export function CycleDiagram({ items }: CycleDiagramProps) {
  if (!items || items.length < 2) return null;
  const radius = 100;
  const numItems = items.length;

  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <div className="relative" style={{ width: radius * 2 + 80, height: radius * 2 + 80 }}>
        {items.map((item, index) => {
          const angle = (index / numItems) * 2 * Math.PI - Math.PI / 2;
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);

          const nextAngle = ((index + 0.5) / numItems) * 2 * Math.PI - Math.PI / 2;
          const arrowX = radius * 0.7 * Math.cos(nextAngle);
          const arrowY = radius * 0.7 * Math.sin(nextAngle);
          const arrowRotation = nextAngle * (180 / Math.PI) + 90;

          return (
            <React.Fragment key={index}>
              <Card
                className="absolute w-28 text-center p-2 bg-primary/10 border-primary/20 shadow-sm"
                style={{
                  transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                  left: '50%',
                  top: '50%',
                }}
              >
                <CardContent className="p-0">
                  <p className="font-semibold text-xs">{item}</p>
                </CardContent>
              </Card>
              <ArrowRight
                className="absolute h-6 w-6 text-muted-foreground"
                style={{
                  transform: `translate(-50%, -50%) translate(${arrowX}px, ${arrowY}px) rotate(${arrowRotation}deg)`,
                  left: '50%',
                  top: '50%',
                }}
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
