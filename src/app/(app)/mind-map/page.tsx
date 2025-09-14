
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { MindMap } from '@/lib/types';
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  Timestamp,
  orderBy,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { MindMapCard } from '@/components/mind-map/mind-map-card';
import { deleteMindMap } from '@/lib/mind-maps';
import { MindMapIcon } from '@/components/icons/tools/mind-map-icon';

export default function MindMapDashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'users', user.uid, 'mindMaps'),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const mapsData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as MindMap)
        );
        setMindMaps(mapsData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleAddMindMap = async () => {
    if (!user) return;
    try {
      const docRef = await addDoc(collection(db, 'users', user.uid, 'mindMaps'), {
        name: 'Untitled Mind Map',
        ownerId: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        nodes: [],
        connections: [],
      });
      toast({
        title: '✓ Mind Map Created',
        description: `"Untitled Mind Map" has been created.`,
      });
      router.push(`/mind-map/${docRef.id}`);
    } catch (e) {
      console.error('Error adding mind map: ', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create mind map. Please try again.',
      });
    }
  };

  const handleDeleteMindMap = async (mapId: string) => {
    if (!user) return;
    try {
      await deleteMindMap(user.uid, mapId);
      toast({ title: 'Mind Map deleted' });
    } catch (e) {
      console.error('Error deleting mind map: ', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete mind map.',
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
            <MindMapIcon className="h-10 w-10 text-primary" />
            <div>
                <h1 className="text-3xl font-bold font-headline">Mind Maps</h1>
                <p className="text-muted-foreground">Visually organize your thoughts and ideas.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddMindMap}>
            <PlusCircle />
            New Mind Map
          </Button>
        </div>
      </div>

      {mindMaps.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50">
          <MindMapIcon className="h-24 w-24 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold font-headline">No Mind Maps Yet</h3>
          <p className="text-muted-foreground">
            Click "New Mind Map" to create your first one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {mindMaps.map((map) => (
            <MindMapCard
              key={map.id}
              mindMap={map}
              onDelete={() => handleDeleteMindMap(map.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
