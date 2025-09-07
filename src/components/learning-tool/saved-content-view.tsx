
'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc } from 'firebase/firestore';
import type { LearningToolEntry } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trash2, Loader2 } from 'lucide-react';
import { GeneratedContentDisplay } from './generated-content-display';
import { useToast } from '@/hooks/use-toast';
import moment from 'moment';
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
} from "@/components/ui/alert-dialog"

export function SavedContentView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedEntries, setSavedEntries] = useState<LearningToolEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    const q = query(
      collection(db, 'users', user.uid, 'learningToolEntries'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LearningToolEntry));
      setSavedEntries(entries);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching saved content: ", error);
      toast({ variant: 'destructive', title: 'Error fetching data' });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handleDelete = async (entryId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'learningToolEntries', entryId));
      toast({ title: 'Content deleted successfully.' });
    } catch (error) {
      console.error("Error deleting content: ", error);
      toast({ variant: 'destructive', title: 'Failed to delete content.' });
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (savedEntries.length === 0) {
    return (
      <Card className="text-center p-8">
        <CardHeader>
          <CardTitle>No Saved Content</CardTitle>
          <CardDescription>Your generated notes, quizzes, and flashcards will appear here once you save them.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="w-full">
        {savedEntries.map((entry) => (
          <AccordionItem value={entry.id} key={entry.id}>
            <AccordionTrigger>
              <div className="flex justify-between items-center w-full pr-4">
                <div className="text-left">
                  <p className="font-semibold">{entry.sourceTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    Saved on {moment(entry.createdAt.toDate()).format('MMMM D, YYYY')}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
                <div className="flex justify-end mb-2">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this set of learning materials.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(entry.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <GeneratedContentDisplay content={entry.content} isLoading={false} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
