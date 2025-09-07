
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GeneratedMaterialDisplayProps {
  htmlContent: string;
}

export function GeneratedMaterialDisplay({
  htmlContent,
}: GeneratedMaterialDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your AI-Generated Study Guide</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh] pr-4">
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
