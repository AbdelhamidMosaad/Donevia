
'use client';

import { useState, useRef, useEffect } from 'react';
import type { DocFolder } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Folder, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';

interface FolderCardProps {
  folder: DocFolder;
  onDelete: () => void;
}

export function FolderCard({ folder, onDelete }: FolderCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(folder.name);
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleRename = async () => {
    if (!user || !name.trim() || name === folder.name) {
      setIsEditing(false);
      setName(folder.name); // Reset if name is empty or unchanged
      return;
    }

    const folderRef = doc(db, 'users', user.uid, 'docFolders', folder.id);
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
    if (isEditing) {
      e.preventDefault();
    }
  };

  return (
    <Link href={`/docs/folder/${folder.id}`} onClick={handleCardClick}>
        <Card className="hover:shadow-lg transition-shadow duration-300 group">
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <Folder className="h-6 w-6 text-primary shrink-0"/>
                {isEditing ? (
                  <Input 
                    ref={inputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleRename}
                    className="text-lg font-headline h-9"
                  />
                ) : (
                  <CardTitle className="font-headline text-xl truncate">{folder.name}</CardTitle>
                )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Rename
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This will delete the folder "{folder.name}". Documents inside will not be deleted.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">Delete Folder</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
        </Card>
    </Link>
  );
}
