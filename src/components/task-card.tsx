import type { Task } from '@/lib/mock-data';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MoreHorizontal, Flag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
}

const priorityIcons = {
  Low: <Flag className="h-4 w-4 text-gray-400" />,
  Medium: <Flag className="h-4 w-4 text-yellow-500" />,
  High: <Flag className="h-4 w-4 text-red-500" />,
};

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Card className="mb-4 hover:shadow-md transition-shadow duration-200 cursor-grab active:cursor-grabbing">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <p className="font-semibold text-sm leading-tight">{task.title}</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1" title={task.priority}>
              {priorityIcons[task.priority]}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(task.dueDate, 'MMM d')}</span>
            </div>
          </div>
          <Avatar className="h-6 w-6">
            <AvatarImage src="https://picsum.photos/24/24" data-ai-hint="person avatar"/>
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {task.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
