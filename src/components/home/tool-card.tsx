
'use client';

import * as LucideIcons from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { cn } from '@/lib/utils';
import { createElement } from 'react';

interface ToolCardProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

export function ToolCard({ href, icon, title, description, color }: ToolCardProps) {
  const IconComponent = (LucideIcons as any)[icon];

  return (
    <Link href={href} className="h-full">
      <Card className="h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col">
        <CardHeader className="p-4 flex-1">
          <div className="p-3 bg-muted w-fit rounded-lg mb-3">
            {IconComponent ? createElement(IconComponent, { className: cn("h-6 w-6", color) }) : null}
          </div>
          <CardTitle className="font-headline text-md group-hover:text-primary transition-colors">{title}</CardTitle>
           <CardDescription className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
