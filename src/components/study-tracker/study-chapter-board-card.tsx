
'use client';

import { useMemo } from 'react';
import type { StudyChapter, StudyTopic } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface StudyChapterBoardCardProps {
  chapter: StudyChapter;
  topics: StudyTopic[];
}

export function StudyChapterBoardCard({ chapter, topics }: StudyChapterBoardCardProps) {
  const router = useRouter();

  const progressPercentage = useMemo(() => {
    if (topics.length === 0) {
        return chapter.isCompleted ? 100 : 0;
    }
    const completedCount = topics.filter(s => s.isCompleted).length;
    return (completedCount / topics.length) * 100;
  }, [topics, chapter.isCompleted]);

  const handleCardClick = () => {
    router.push(`/study-tracker/${chapter.goalId}`);
  };

  return (
    <Card 
        className="bg-card/80 backdrop-blur-sm border-white/20 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer group"
        onClick={handleCardClick}
    >
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-base font-bold font-headline leading-tight group-hover:underline">{chapter.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        <div className="w-full">
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">{topics.filter(t => t.isCompleted).length}/{topics.length} topics</p>
        </div>
         <div className="max-h-24 overflow-y-auto pr-1">
            {topics.sort((a,b) => a.order - b.order).map(topic => (
                <div key={topic.id} className="flex items-center gap-2 text-xs">
                    <Checkbox checked={topic.isCompleted} className="h-3 w-3" disabled/>
                    <span className={cn(topic.isCompleted && "line-through text-muted-foreground")}>{topic.title}</span>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
