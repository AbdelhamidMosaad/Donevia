
'use client';

import { useState, useRef, useEffect } from 'react';
import type { StudyFolder } from '@/lib/types';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Folder, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateStudyFolder } from '@/lib/study-tracker';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface StudyFolderCardProps {
  folder: StudyFolder;
  onDelete: () => void;
}

export function StudyFolderCard({ folder, onDelete }: StudyFolderCardProps) {
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
      setName(folder.name);
      return;
    }

    const folderRef = doc(db, 'users', user.uid, 'studyFolders', folder.id);
    try {
      await updateDoc(folderRef, { name: name.trim() });
      toast({ title: '✓ Folder Renamed' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error renaming folder' });
      setName(folder.name);
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
    }
  };
  
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <Link href={`/study-tracker/folder/${folder.id}`} onClick={handleCardClick} className="group block h-full">
        <Card className="relative h-full overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border-white/20 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl cursor-pointer">
            <div className="p-6 flex flex-col items-center text-center">
                 <Folder className="h-24 w-24 mb-4 text-primary" />
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
                  <h3 className="text-lg font-bold font-headline text-foreground">{folder.name}</h3>
                )}
                 <p className="text-xs text-muted-foreground mt-1">
                    Folder
                </p>
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={handleActionClick}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This will delete the folder "{folder.name}". Goals inside will not be deleted.</AlertDialogDescription>
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
    </Link>
  );
}
