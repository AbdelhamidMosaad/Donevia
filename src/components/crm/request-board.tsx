
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ClientRequest, Client } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, doc, updateDoc, writeBatch, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';
import { RequestCard } from './request-card';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';
import { RequestDialog } from './request-dialog';
import { v4 as uuidv4 } from 'uuid';

const stages = ['New', 'Contacted', 'Proposal', 'Won', 'Lost'];

export function RequestBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const reqQuery = query(collection(db, 'users', user.uid, 'clientRequests'));
    const unsubscribeReqs = onSnapshot(reqQuery, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientRequest)));
    });

    const clientQuery = query(collection(db, 'users', user.uid, 'clients'));
    const unsubscribeClients = onSnapshot(clientQuery, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
    });

    return () => {
      unsubscribeReqs();
      unsubscribeClients();
    };
  }, [user]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || !user) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const request = requests.find(r => r.id === draggableId);
    const newStage = destination.droppableId as ClientRequest['stage'];
    
    if (request && newStage) {
        const requestRef = doc(db, 'users', user.uid, 'clientRequests', draggableId);
        try {
            await updateDoc(requestRef, { stage: newStage });
            toast({
                title: 'Deal Updated',
                description: `"${request.title}" moved to ${newStage}.`,
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating deal.' });
        }
    }
  };

  const requestsByStage = useMemo(() => {
    const initial: Record<string, ClientRequest[]> = {};
    stages.forEach(stage => initial[stage] = []);
    return requests.reduce((acc, request) => {
        acc[request.stage].push(request);
        return acc;
    }, initial);
  }, [requests]);

  const handleAddNewRequest = async () => {
    if (!user) return;
    try {
        await addDoc(collection(db, 'users', user.uid, 'clientRequests'), {
            title: 'New Deal',
            stage: 'New',
            clientId: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        toast({ title: 'New deal added!' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error adding new deal.' });
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={handleAddNewRequest}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Deal
        </Button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-5 gap-6 items-start">
          {stages.map(stage => (
            <div key={stage} className="flex flex-col">
              <h2 className="text-lg font-semibold font-headline p-3 capitalize">{stage}</h2>
              <Droppable droppableId={stage}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col gap-4 bg-muted/50 rounded-lg p-4 min-h-[300px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary/10' : ''}`}
                  >
                    {requestsByStage[stage]?.map((req, index) => (
                      <Draggable key={req.id} draggableId={req.id} index={index}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <RequestCard request={req} clients={clients} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </>
  );
}
