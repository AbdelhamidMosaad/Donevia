
'use client';

import { useState, useRef, useEffect } from 'react';
import type { MindMap } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { GitBranch, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
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

interface MindMapCardProps {
  mindMap: MindMap;
  onDelete: () => void;
}

export function MindMapCard({ mindMap, onDelete }: MindMapCardProps) {
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
      console.error('Error renaming mind map: ', e);
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
    if (isEditing) return;
    router.push(`/mind-map/${mindMap.id}`);
  };

  return (
    <a href={`/mind-map/${mindMap.id}`} onClick={handleCardClick} className="block cursor-pointer">
      <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col group">
        <CardHeader className="flex-row items-start justify-between w-full relative">
          <div>
            {isEditing ? (
              <Input
                ref={inputRef}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleRename}
                className="text-lg font-headline"
                onClick={(e) => e.preventDefault()}
              />
            ) : (
              <CardTitle className="font-headline hover:underline text-xl flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                {mindMap.name}
              </CardTitle>
            )}
            <CardDescription className="mt-1">
              {mindMap.updatedAt
                ? `Updated on ${mindMap.updatedAt.toDate().toLocaleDateString()}`
                : 'Just now'}
            </CardDescription>
          </div>
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" /> Rename
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive w-full"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the "{mindMap.name}"
                        mind map. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      </Card>
    </a>
  );
}
