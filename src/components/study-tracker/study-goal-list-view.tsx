
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { StudyGoal, StudySubtopic, StudyFolder } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, GraduationCap, Move, Folder } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Progress } from '../ui/progress';
import moment from 'moment';
import { AddStudyGoalDialog } from './add-study-goal-dialog';

interface StudyGoalListViewProps {
  goals: StudyGoal[];
  folders: StudyFolder[];
  onDelete: (goalId: string) => void;
  onMove: (goalId: string, folderId: string | null) => void;
}

function GoalRow({ goal, folders, onDelete, onMove }: { goal: StudyGoal; folders: StudyFolder[]; onDelete: (goalId: string) => void; onMove: (goalId: string, folderId: string | null) => void; }) {
  const { user } = useAuth();
  const [subtopics, setSubtopics] = useState<StudySubtopic[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user && goal.id) {
        const subtopicsQuery = query(collection(db, 'users', user.uid, 'studySubtopics'), where('goalId', '==', goal.id));
        const unsubscribe = onSnapshot(subtopicsQuery, (snapshot) => {
            setSubtopics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySubtopic)));
        });
        return () => unsubscribe();
    }
  }, [user, goal.id]);

  const progressPercentage = useMemo(() => {
    if (subtopics.length === 0) return 0;
    const completedCount = subtopics.filter(m => m.isCompleted).length;
    return (completedCount / subtopics.length) * 100;
  }, [subtopics]);

  const handleRowClick = (e: React.MouseEvent) => {
      if((e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]')) {
          e.preventDefault();
          return;
      }
      router.push(`/study-tracker/${goal.id}`);
  }

  return (
    <>
      <TableRow onClick={handleRowClick} className="cursor-pointer">
        <TableCell>
            <div className="flex items-center gap-2 font-medium text-primary hover:underline">
                <GraduationCap className="h-4 w-4"/>
                {goal.title}
            </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Progress value={progressPercentage} className="w-32" />
            <span className="text-xs text-muted-foreground">{Math.round(progressPercentage)}%</span>
          </div>
        </TableCell>
        <TableCell>{goal.dueDate ? moment(goal.dueDate.toDate()).format('MMM D, YYYY') : '-'}</TableCell>
        <TableCell>{goal.createdAt ? moment(goal.createdAt.toDate()).format('MMM D, YYYY') : '-'}</TableCell>
        <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
               <DropdownMenuSub>
                <DropdownMenuSubTrigger><Move className="mr-2 h-4 w-4" />Move to Folder</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                    {goal.folderId && <DropdownMenuItem onSelect={() => onMove(goal.id, null)}>Remove from folder</DropdownMenuItem>}
                    {folders && folders.map(folder => (
                        <DropdownMenuItem key={folder.id} onSelect={() => onMove(goal.id, folder.id)} disabled={goal.folderId === folder.id}>
                            <Folder className="mr-2 h-4 w-4" /> {folder.name}
                        </DropdownMenuItem>
                    ))}
                    {(!folders || folders.length === 0) && <DropdownMenuItem disabled>No folders available</DropdownMenuItem>}
                </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle></AlertDialogHeader>
                  <AlertDialogDescription>This will permanently delete the goal "{goal.title}" and all its data.</AlertDialogDescription>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(goal.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      <AddStudyGoalDialog goal={goal} open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} />
    </>
  );
}

export function StudyGoalListView({ goals, folders, onDelete, onMove }: StudyGoalListViewProps) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Goal</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Target Date</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {goals.map(goal => (
            <GoalRow key={goal.id} goal={goal} folders={folders} onDelete={onDelete} onMove={onMove} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
