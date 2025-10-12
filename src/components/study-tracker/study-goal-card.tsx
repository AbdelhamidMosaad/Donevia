
'use client';

import type { StudyGoal, StudySubtopic, StudyFolder } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, GraduationCap, Calendar, Tag, Move, Folder } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import moment from 'moment';
import Link from 'next/link';
import { AddStudyGoalDialog } from './add-study-goal-dialog';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Badge } from '../ui/badge';
import { StudyTrackerIcon } from '../icons/tools/study-tracker-icon';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';

interface StudyGoalCardProps {
  goal: StudyGoal;
  folders: StudyFolder[];
  onDelete: (goalId: string) => void;
  onMove: (goalId: string, folderId: string | null) => void;
}

export function StudyGoalCard({ goal, folders, onDelete, onMove }: StudyGoalCardProps) {
  const { user } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [subtopics, setSubtopics] = useState<StudySubtopic[]>([]);
  const [editingName, setEditingName] = useState(goal.title);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && goal.id) {
        const subtopicsQuery = query(collection(db, 'users', user.uid, 'studySubtopics'), where('goalId', '==', goal.id));
        const unsubscribe = onSnapshot(subtopicsQuery, (snapshot) => {
            setSubtopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySubtopic)));
        });
        return () => unsubscribe();
    }
  }, [user, goal.id]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
    }
  }, [isEditing]);
  
  const handleRename = async () => {
    if (!user || !editingName.trim() || editingName === goal.title) {
        setIsEditing(false);
        setEditingName(goal.title);
        return;
    }
    const goalRef = doc(db, 'users', user.uid, 'studyGoals', goal.id);
    try {
        await updateDoc(goalRef, { title: editingName.trim() });
        toast({ title: '✓ Goal Renamed' });
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error renaming goal' });
        setEditingName(goal.title);
    } finally {
        setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleRename();
    else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditingName(goal.title);
    }
  };


  const progressPercentage = useMemo(() => {
    if (subtopics.length === 0) return 0;
    const completedCount = subtopics.filter(m => m.isCompleted).length;
    return (completedCount / subtopics.length) * 100;
  }, [subtopics]);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if(isEditing || target.closest('button, [role="menu"]')) {
      e.preventDefault();
      return;
    }
    router.push(`/study-tracker/${goal.id}`);
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <>
      <div onClick={handleCardClick} className="group block h-full">
        <Card className="relative h-full overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm border-white/20 shadow-lg transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl cursor-pointer">
           <div className="p-6 flex flex-col items-center text-center">
                <StudyTrackerIcon className="h-24 w-24 mb-4" />
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
                  <h3 className="text-lg font-bold font-headline text-foreground">{goal.title}</h3>
                )}
                <p className="text-xs text-muted-foreground mt-1">Target: {goal.dueDate ? moment(goal.dueDate.toDate()).format('MMM D, YYYY') : 'Not set'}</p>
                <div className="w-full mt-4">
                    <Progress value={progressPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">{Math.round(progressPercentage)}% complete</p>
                </div>
            </div>
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={handleActionClick}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent onClick={handleActionClick}>
                <DropdownMenuItem onSelect={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4" /> Rename</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
                 <DropdownMenuSub>
                    <DropdownMenuSubTrigger><Move className="mr-2 h-4 w-4" />Move to Folder</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        {goal.folderId && <DropdownMenuItem onSelect={() => onMove(goal.id, null)}>Remove from folder</DropdownMenuItem>}
                        {folders.map(folder => (
                            <DropdownMenuItem key={folder.id} onSelect={() => onMove(goal.id, folder.id)} disabled={goal.folderId === folder.id}>
                                <Folder className="mr-2 h-4 w-4" /> {folder.name}
                            </DropdownMenuItem>
                        ))}
                        {folders.length === 0 && <DropdownMenuItem disabled>No folders available</DropdownMenuItem>}
                    </DropdownMenuSubContent>
                 </DropdownMenuSub>
                 <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={handleActionClick} className="text-destructive focus:text-destructive w-full"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={handleActionClick}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete the goal "{goal.title}" and all its chapters and subtopics.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(goal.id)} variant="destructive">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
        </Card>
      </div>
      <AddStudyGoalDialog goal={goal} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
    </>
  );
}
