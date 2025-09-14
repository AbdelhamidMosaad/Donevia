
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
    <Link href={href}>
      <Card className="h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
        <CardHeader>
          <div className="p-3 bg-muted w-fit rounded-lg mb-4">
            {IconComponent ? createElement(IconComponent, { className: cn("h-6 w-6", color) }) : null}
          </div>
          <CardTitle className="font-headline group-hover:text-primary transition-colors">{title}</CardTitle>
          <CardDescription className="line-clamp-2">{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
