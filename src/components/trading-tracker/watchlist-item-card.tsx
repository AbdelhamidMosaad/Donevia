
'use client';

import { useState } from 'react';
import type { WatchlistItem } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '../ui/button';
import { MoreHorizontal, Edit, Trash2, Calendar, Bell, Flag } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel
} from '../ui/alert-dialog';
import { AddWatchlistItemDialog } from './add-watchlist-item-dialog';
import moment from 'moment';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

interface WatchlistItemCardProps {
  item: WatchlistItem;
  onDelete: () => void;
}

const priorityConfig = {
  High: { color: 'text-red-500', label: 'High Priority' },
  Medium: { color: 'text-yellow-500', label: 'Medium Priority' },
  Low: { color: 'text-gray-400', label: 'Low Priority' },
};


export function WatchlistItemCard({ item, onDelete }: WatchlistItemCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const priorityInfo = priorityConfig[item.priority || 'Medium'];

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };
  
  const statusColors = {
      'Watching': 'bg-blue-500',
      'Entered': 'bg-green-500',
      'Archived': 'bg-gray-500',
  }

  return (
    <>
      <Card 
        className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col group cursor-pointer"
        onClick={() => setIsEditDialogOpen(true)}
    >
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle className="font-headline group-hover:underline flex items-center gap-2">
                <span className="text-2xl">{item.symbol}</span>
                 <Badge className={statusColors[item.status]}>{item.status}</Badge>
            </CardTitle>
          </div>
           <div className="flex items-center gap-1">
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                       <Flag className={cn("h-5 w-5", priorityInfo.color)} />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{priorityInfo.label}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleActionClick}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent onClick={handleActionClick}>
                <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive w-full"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>This will permanently delete the item "{item.symbol}" from your watchlist.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground line-clamp-4">{item.notes}</p>
        </CardContent>
         <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
            {item.reminderDate && (
                 <div className="flex items-center gap-1">
                    <Bell className="h-3 w-3" />
                    <span>Follow up: {moment(item.reminderDate.toDate()).format('MMM D, YYYY')}</span>
                </div>
            )}
            <p>Added: {moment(item.createdAt.toDate()).format('MMM D, YYYY')}</p>
         </CardFooter>
      </Card>
       <AddWatchlistItemDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        item={item}
      />
    </>
  );
}
