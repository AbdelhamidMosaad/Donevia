
'use client';

import type { Bookmark } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, Palette } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { BookmarksIcon } from '../icons/tools/bookmarks-icon';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (focusColor?: boolean) => void;
  onDelete: () => void;
}

export function BookmarkCard({ bookmark, onEdit, onDelete }: BookmarkCardProps) {
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer group h-full">
        <Card 
            className="relative h-full overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border-white/20 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl"
            style={{ backgroundColor: bookmark.color }}
        >
            <div className="p-6 flex flex-col items-center text-center h-full justify-center">
                <BookmarksIcon className="h-24 w-24 mb-4" />
                <h3 className="text-lg font-bold font-headline text-foreground">{bookmark.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{bookmark.url}</p>
                 <p className="text-xs text-muted-foreground mt-2 px-2 py-1 bg-black/5 rounded-full capitalize">{bookmark.category}</p>
            </div>

            <div className="absolute top-2 right-2">
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={handleActionClick}>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent onClick={handleActionClick}>
                    <DropdownMenuItem onSelect={() => onEdit(false)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onEdit(true)}><Palette className="mr-2 h-4 w-4" /> Change Color</DropdownMenuItem>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive w-full"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={handleActionClick}>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete the "{bookmark.title}" bookmark. This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onDelete} variant="destructive">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </Card>
    </a>
  );
}
