
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, GripHorizontal, Minus, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { MindMapType } from '@/lib/types';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { MindMapCard } from '@/components/mind-map/mind-map-card';
import { addMindMap, deleteMindMap } from '@/lib/mind-maps';
import { MindMapIcon } from '@/components/icons/tools/mind-map-icon';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type CardSize = 'small' | 'medium' | 'large';

export default function MindMapDashboardPage() {
  const { user, loading, settings } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [mindMaps, setMindMaps] = useState<MindMapType[]>([]);
  const [cardSize, setCardSize] = useState<CardSize>(settings.mindMapCardSize || 'large');

  useEffect(() => {
    if(settings.mindMapCardSize) {
        setCardSize(settings.mindMapCardSize);
    }
  }, [settings.mindMapCardSize]);

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
        const boardsData = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as MindMapType)
        );
        setMindMaps(boardsData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleCardSizeChange = async (newSize: CardSize) => {
    if (newSize && user) {
        setCardSize(newSize);
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        await setDoc(settingsRef, { mindMapCardSize: newSize }, { merge: true });
    }
  }

  const handleAddMindMap = async () => {
    if (!user) return;
    try {
      const docRef = await addMindMap(user.uid, 'Untitled Mind Map');
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
                <p className="text-muted-foreground">Your collection of visual brainstorms.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <ToggleGroup type="single" value={cardSize} onValueChange={handleCardSizeChange} aria-label="Card size toggle">
                <ToggleGroupItem value="small" aria-label="Small cards"><GripHorizontal/></ToggleGroupItem>
                <ToggleGroupItem value="medium" aria-label="Medium cards"><Minus/></ToggleGroupItem>
                <ToggleGroupItem value="large" aria-label="Large cards"><Plus/></ToggleGroupItem>
            </ToggleGroup>
          <Button onClick={handleAddMindMap}>
            <PlusCircle />
            New Mind Map
          </Button>
        </div>
      </div>

      {mindMaps.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-card/60 backdrop-blur-sm">
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
              map={map}
              onDelete={() => handleDeleteMindMap(map.id)}
              size={cardSize}
            />
          ))}
        </div>
      )}
    </div>
  );
}
