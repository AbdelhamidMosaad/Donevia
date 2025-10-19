'use client';

import { useState, useRef, useEffect } from 'react';
import type { TaskFolder } from '@/lib/types';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Folder, MoreHorizontal, Edit, Trash2, Move } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '../ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface FolderCardProps {
  folder: TaskFolder;
  allFolders: TaskFolder[];
  onDelete: () => void;
  onMove: (folderId: string, newParentId: string | null) => void;
  size?: 'small' | 'medium' | 'large';
}

export function FolderCard({ folder, allFolders, onDelete, onMove, size = 'large' }: FolderCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(folder.name);
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleRename = async () => {
    if (!user || !name.trim() || name === folder.name) {
      setIsEditing(false);
      setName(folder.name);
      return;
    }

    const folderRef = doc(db, 'users', user.uid, 'taskFolders', folder.id);
    try {
      await updateDoc(folderRef, { name: name.trim() });
      toast({ title: '✓ Folder Renamed' });
    } catch (e) {
      console.error("Error renaming folder: ", e);
      toast({ variant: 'destructive', title: 'Error renaming folder' });
      setName(folder.name); // Revert on error
    } finally {
      setIsEditing(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRename();
    else if (e.key === 'Escape') {
      setIsEditing(false);
      setName(folder.name);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isEditing || (e.target as HTMLElement).closest('button, [role="menu"]')) {
      e.preventDefault();
    } else {
        router.push(`/dashboard/lists/folder/${folder.id}`);
    }
  };
  
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div onClick={handleCardClick} className="group block h-full">
        <Card className="relative h-full overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border-white/20 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl cursor-pointer">
            <div className={cn("p-6 flex flex-col items-center text-center h-full justify-center",
                size === 'medium' && 'p-4',
                size === 'small' && 'p-3'
            )}>
                 <Folder className={cn("mb-4 text-primary",
                    size === 'large' && 'h-24 w-24',
                    size === 'medium' && 'h-16 w-16',
                    size === 'small' && 'h-12 w-12 mb-2'
                 )} />
                {isEditing ? (
                  <Input 
                    ref={inputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleRename}
                    className="text-lg font-headline text-center bg-transparent"
                     onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h3 className={cn("font-bold font-headline text-foreground",
                    size === 'large' && 'text-lg',
                    size === 'medium' && 'text-base',
                    size === 'small' && 'text-sm'
                  )}>{folder.name}</h3>
                )}
                 {size !== 'small' && <p className="text-xs text-muted-foreground mt-1">
                    Folder
                </p>}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={handleActionClick}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent onClick={handleActionClick}>
                <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Rename
                </DropdownMenuItem>
                 <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Move className="mr-2 h-4 w-4" />Move
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {folder.parentId && <DropdownMenuItem onSelect={() => onMove(folder.id, null)}>Move to Root</DropdownMenuItem>}
                        {allFolders.filter(f => f.id !== folder.id && f.parentId !== folder.id).map(f => (
                             <DropdownMenuItem key={f.id} onSelect={() => onMove(folder.id, f.id)} disabled={folder.parentId === f.id}>
                                <Folder className="mr-2 h-4 w-4" /> {f.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={handleActionClick}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This will delete the folder "{folder.name}". Task lists inside will be moved to the root.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete Folder</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
        </Card>
    </div>
  );
}