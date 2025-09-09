
'use client';

import { useState } from 'react';
import type { MeetingNote } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { ClipboardSignature, MoreHorizontal, Trash2, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
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
import moment from 'moment';

interface MeetingNoteCardProps {
  note: MeetingNote;
  onDelete: () => void;
}

export function MeetingNoteCard({ note, onDelete }: MeetingNoteCardProps) {
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/meeting-notes/${note.id}`);
  };

  return (
    <a href={`/meeting-notes/${note.id}`} onClick={handleCardClick} className="block cursor-pointer">
      <Card className="hover:shadow-lg transition-shadow duration-300 h-full flex flex-col group">
        <CardHeader className="flex-row items-start justify-between w-full relative">
          <div>
            <CardTitle className="font-headline hover:underline text-xl flex items-center gap-2">
              <ClipboardSignature className="h-5 w-5 text-primary" />
              {note.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {note.date ? `Meeting on ${moment(note.date.toDate()).format('ll')}` : 'No date set'}
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
                        This will permanently delete the "{note.title}"
                        meeting note. This action cannot be undone.
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
        <CardFooter>
            <p className="text-xs text-muted-foreground">Updated: {moment(note.updatedAt.toDate()).fromNow()}</p>
        </CardFooter>
      </Card>
    </a>
  );
}
