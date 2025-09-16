
'use client';

import type { Bookmark } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, Palette } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { BookmarksIcon } from '../icons/tools/bookmarks-icon';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (focusColor?: boolean) => void;
  onDelete: () => void;
  size?: 'x-small' | 'small' | 'large';
}

const lightColorPalette = ['#FFFFFF', '#FEE2E2', '#D1C4E9', '#BBDEFB', '#C8E6C9', '#FFF9C4', '#FFE0B2', '#F5F5F5'];
const darkColorPalette = ['#1F2937', '#7F1D1D', '#4C1D95', '#1E3A8A', '#064E3B', '#713F12', '#7C2D12', '#374151'];


export function BookmarkCard({ bookmark, onEdit, onDelete, size = 'large' }: BookmarkCardProps) {
  const { settings } = useAuth();
  const isDarkMode = settings.theme?.includes('dark') || settings.theme?.includes('theme-');

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };
  
  const cardColor = isDarkMode 
    ? bookmark.color && lightColorPalette.includes(bookmark.color)
      ? darkColorPalette[lightColorPalette.indexOf(bookmark.color)] 
      : bookmark.color
    : bookmark.color;


  return (
    <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block cursor-pointer group h-full">
        <Card 
            className="relative h-full overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border-white/20 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl"
            style={{ backgroundColor: cardColor, color: isDarkMode ? '#FFFFFF' : 'hsl(var(--card-foreground))' }}
        >
            <div className={cn(
                "p-6 flex flex-col items-center text-center h-full justify-center",
                size === 'small' && 'p-4',
                size === 'x-small' && 'p-3'
            )}>
                <BookmarksIcon className={cn(
                  "mb-4", 
                  size === 'large' && 'h-24 w-24', 
                  size === 'small' && 'h-16 w-16',
                  size === 'x-small' && 'h-12 w-12 mb-2'
                )} />
                <h3 className={cn("font-bold font-headline", 
                    size === 'large' ? 'text-lg' : 'text-sm',
                    size === 'x-small' && 'text-xs'
                )}>{bookmark.title}</h3>
                {size !== 'x-small' && (
                  <>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1" style={{color: isDarkMode ? 'hsl(var(--muted-foreground))' : undefined}}>{bookmark.url}</p>
                    <p className="text-xs text-muted-foreground mt-2 px-2 py-1 bg-black/5 dark:bg-white/10 rounded-full capitalize" style={{color: isDarkMode ? 'hsl(var(--muted-foreground))' : undefined}}>{bookmark.category}</p>
                  </>
                )}
            </div>

            <div className="absolute top-2 right-2">
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:bg-black/10 dark:hover:bg-white/10" onClick={handleActionClick}>
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
