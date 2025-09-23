
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, LayoutGrid, List, Minus, Plus, GripHorizontal } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { MeetingNote } from '@/lib/types';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { deleteMeetingNote } from '@/lib/meeting-notes';
import { NewMeetingNoteDialog } from '@/components/meeting-notes/new-meeting-note-dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { MeetingNoteCardView } from '@/components/meeting-notes/meeting-note-card-view';
import { MeetingNoteListView } from '@/components/meeting-notes/meeting-note-list-view';
import { MeetingNotesIcon } from '@/components/icons/tools/meeting-notes-icon';

type View = 'card' | 'list';
type CardSize = 'small' | 'medium' | 'large';

export default function MeetingNotesDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([]);
  const [isNewNoteDialogOpen, setIsNewNoteDialogOpen] = useState(false);
  const [view, setView] = useState<View>('card');
  const [cardSize, setCardSize] = useState<CardSize>('large');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (user) {
      const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
      getDoc(settingsRef).then(docSnap => {
        if (docSnap.exists()) {
            const userSettings = docSnap.data();
            if (userSettings.meetingNotesView) {
              setView(userSettings.meetingNotesView);
            }
             if (userSettings.meetingNotesCardSize) {
                setCardSize(userSettings.meetingNotesCardSize);
            }
        }
      });
    }
  }, [user]);


  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'users', user.uid, 'meetingNotes'),
        orderBy('startDate', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notesData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as MeetingNote)
        );
        setMeetingNotes(notesData);
      });
      return () => unsubscribe();
    }
  }, [user]);
  
  const handleViewChange = async (newView: View) => {
    if (newView) {
        setView(newView);
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
            await setDoc(settingsRef, { meetingNotesView: newView }, { merge: true });
        }
    }
  }

  const handleCardSizeChange = async (newSize: CardSize) => {
    if (newSize) {
        setCardSize(newSize);
        if (user) {
            const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
            await setDoc(settingsRef, { meetingNotesCardSize: newSize }, { merge: true });
        }
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    try {
      await deleteMeetingNote(user.uid, noteId);
      toast({ title: 'Meeting Note deleted' });
    } catch (e) {
      console.error('Error deleting meeting note: ', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete meeting note.',
      });
    }
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <MeetingNotesIcon className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-headline">Meeting Notes</h1>
            <p className="text-muted-foreground">Capture and organize your meeting minutes.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <ToggleGroup type="single" value={view} onValueChange={handleViewChange} aria-label="View toggle">
              <ToggleGroupItem value="card" aria-label="Card view">
                <LayoutGrid />
              </ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view">
                <List />
              </ToggleGroupItem>
            </ToggleGroup>
             {view === 'card' && (
                 <ToggleGroup type="single" value={cardSize} onValueChange={handleCardSizeChange} aria-label="Card size toggle">
                    <ToggleGroupItem value="small" aria-label="Small cards"><GripHorizontal/></ToggleGroupItem>
                    <ToggleGroupItem value="medium" aria-label="Medium cards"><Minus/></ToggleGroupItem>
                    <ToggleGroupItem value="large" aria-label="Large cards"><Plus/></ToggleGroupItem>
                </ToggleGroup>
            )}
          <Button onClick={() => setIsNewNoteDialogOpen(true)}>
            <PlusCircle />
            New Meeting Note
          </Button>
        </div>
      </div>
      
      <div className="flex-1">
        {view === 'card' ? (
          <MeetingNoteCardView notes={meetingNotes} onDelete={handleDeleteNote} cardSize={cardSize} />
        ) : (
           <MeetingNoteListView notes={meetingNotes} onDelete={handleDeleteNote} />
        )}
      </div>

      <NewMeetingNoteDialog open={isNewNoteDialogOpen} onOpenChange={setIsNewNoteDialogOpen} />
    </div>
  );
}
