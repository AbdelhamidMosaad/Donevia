
'use client';

import { useState, useRef, useEffect } from 'react';
import type { MindMap } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { MindMapIcon } from '../icons/tools/mind-map-icon';
import moment from 'moment';
import { cn } from '@/lib/utils';

interface MindMapCardProps {
  mindMap: MindMap;
  onDelete: () => void;
  size?: 'small' | 'medium' | 'large';
}

export function MindMapCard({ mindMap, onDelete, size = 'large' }: MindMapCardProps) {
  const [editingName, setEditingName] = useState(mindMap.name);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  const handleRename = async () => {
    if (!user || !editingName.trim() || editingName === mindMap.name) {
      setIsEditing(false);
      setEditingName(mindMap.name);
      return;
    }

    const mapRef = doc(db, 'users', user.uid, 'mindMaps', mindMap.id);
    try {
      await updateDoc(mapRef, { name: editingName.trim() });
      toast({ title: '✓ Mind Map Renamed' });
    } catch (e) {
      console.error("Error renaming mind map: ", e);
      toast({ variant: 'destructive', title: 'Error renaming mind map' });
      setEditingName(mindMap.name);
    } finally {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRename();
    else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingName(mindMap.name);
    }
  };
  
  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if(isEditing) return;
    router.push(`/mind-map/${mindMap.id}`);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div onClick={handleCardClick} className="group block h-full">
      <Card className="relative h-full overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border-white/20 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl cursor-pointer">
        <div className={cn("p-6 flex flex-col items-center text-center h-full justify-center", size === 'medium' && 'p-4', size === 'small' && 'p-3')}>
            <MindMapIcon className={cn("mb-4", size === 'large' && 'h-24 w-24', size === 'medium' && 'h-16 w-16', size === 'small' && 'h-12 w-12 mb-2')} />
            {isEditing ? (
              <Input
                ref={inputRef}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
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
                )}>{mindMap.name}</h3>
            )}
            {size !== 'small' && <p className="text-xs text-muted-foreground mt-1">
                {mindMap.updatedAt && typeof mindMap.updatedAt.toDate === 'function'
                ? `Updated ${moment(mindMap.updatedAt.toDate()).fromNow()}`
                : 'Just now'}
            </p>}
        </div>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={handleActionClick}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onClick={handleActionClick}>
                <DropdownMenuItem onSelect={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive w-full"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={handleActionClick}>
                      <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the "{mindMap.name}" mind map. This action cannot be undone.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={onDelete} variant="destructive">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
      </Card>
    </div>
  );
}
