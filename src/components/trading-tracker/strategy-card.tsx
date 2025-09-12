
'use client';

import { useState } from 'react';
import type { TradingStrategy } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '../ui/button';
import { MoreHorizontal, Edit, Trash2, Book } from 'lucide-react';
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
import { StrategyDialog } from './strategy-dialog';

interface StrategyCardProps {
  strategy: TradingStrategy;
  onDelete: () => void;
}

export function StrategyCard({ strategy, onDelete }: StrategyCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <Card 
        className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col group cursor-pointer"
        onClick={() => setIsEditDialogOpen(true)}
    >
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle className="font-headline group-hover:underline flex items-center gap-2">
                <Book className="h-5 w-5 text-primary"/>
                {strategy.name}
            </CardTitle>
          </div>
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
                        <AlertDialogDescription>This will permanently delete the strategy "{strategy.name}".</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground line-clamp-4">{strategy.description}</p>
        </CardContent>
      </Card>
       <StrategyDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        strategy={strategy}
      />
    </>
  );
}

    