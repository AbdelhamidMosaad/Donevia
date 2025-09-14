
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
        <CardHeader className="p-4">
          <div className="p-2 bg-muted w-fit rounded-lg mb-2">
            {IconComponent ? createElement(IconComponent, { className: cn("h-5 w-5", color) }) : null}
          </div>
          <CardTitle className="font-headline text-base group-hover:text-primary transition-colors">{title}</CardTitle>
        </CardHeader>
      </Card>
    </Link>
  );
}
