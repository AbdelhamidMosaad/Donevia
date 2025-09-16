
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Whiteboard } from '@/lib/types';
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  Timestamp,
  orderBy,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { WhiteboardCard } from '@/components/whiteboard/whiteboard-card';
import { WhiteboardIcon } from '@/components/icons/tools/whiteboard-icon';

export default function WhiteboardDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'users', user.uid, 'whiteboards'),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const boardsData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Whiteboard)
        );
        setWhiteboards(boardsData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleAddWhiteboard = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'whiteboards'), {
        name: 'Untitled Whiteboard',
        ownerId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      // Also create the data subdocument
      await setDoc(doc(db, 'users', user.uid, 'whiteboards', docRef.id, 'data', 'main'), {
        data: null
      });

      toast({
        title: '✓ Whiteboard Created',
        description: `"Untitled Whiteboard" has been created.`,
      });
      router.push(`/whiteboard/${docRef.id}`);
    } catch (e) {
      console.error('Error adding whiteboard: ', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create whiteboard. Please try again.',
      });
    }
  };

   const handleDeleteWhiteboard = async (boardId: string) => {
    if (!user) return;
    try {
      // Note: This doesn't delete subcollections. A more robust solution
      // would use a Firebase Function to handle cascading deletes.
      await deleteDoc(doc(db, 'users', user.uid, 'whiteboards', boardId));
      await deleteDoc(doc(db, 'users', user.uid, 'whiteboards', boardId, 'data', 'main'));
      toast({ title: 'Whiteboard deleted' });
    } catch (e) {
      console.error('Error deleting whiteboard: ', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete whiteboard.',
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
            <WhiteboardIcon className="h-10 w-10 text-primary" />
            <div>
                <h1 className="text-3xl font-bold font-headline">Whiteboards</h1>
                <p className="text-muted-foreground">Your collection of digital canvases.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddWhiteboard}>
            <PlusCircle />
            New Whiteboard
          </Button>
        </div>
      </div>

      {whiteboards.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-card/60 backdrop-blur-sm">
          <WhiteboardIcon className="h-24 w-24 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold font-headline">No Whiteboards Yet</h3>
          <p className="text-muted-foreground">
            Click "New Whiteboard" to create your first canvas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {whiteboards.map((board) => (
            <WhiteboardCard
              key={board.id}
              whiteboard={board}
              onDelete={() => handleDeleteWhiteboard(board.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
