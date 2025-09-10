'use client';
import type { MeetingNote } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ClipboardSignature, MoreHorizontal, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useRouter } from 'next/navigation';
import moment from 'moment';

interface MeetingNoteListViewProps {
  notes: MeetingNote[];
  onDelete: (noteId: string) => void;
}

export function MeetingNoteListView({ notes, onDelete }: MeetingNoteListViewProps) {
    const router = useRouter();

  if (notes.length === 0) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50">
            <ClipboardSignature className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-headline">No Meeting Notes Yet</h3>
            <p className="text-muted-foreground">
                Click "New Meeting Note" to create your first one.
            </p>
        </div>
    )
  }

  const handleNavigate = (e: React.MouseEvent, noteId: string) => {
    e.preventDefault();
    router.push(`/meeting-notes/${noteId}`);
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Meeting Date</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notes.map(note => (
            <TableRow key={note.id} onClick={(e) => handleNavigate(e, note.id)} className="cursor-pointer">
              <TableCell>
                  <a href={`/meeting-notes/${note.id}`} onClick={(e) => handleNavigate(e, note.id)} className="flex items-center gap-2 font-medium text-primary hover:underline">
                      <ClipboardSignature className="h-4 w-4" />
                      {note.title}
                  </a>
              </TableCell>
              <TableCell>{moment(note.date.toDate()).format('ll')}</TableCell>
              <TableCell>{moment(note.updatedAt.toDate()).fromNow()}</TableCell>
              <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Delete</DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the "{note.title}" meeting note. This action cannot be undone.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => onDelete(note.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
