
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ClientRequest, Client, PipelineStage } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, doc, updateDoc, writeBatch, getDocs, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';
import { RequestCard } from './request-card';
import { Button } from '../ui/button';
import { PlusCircle, Settings } from 'lucide-react';
import { RequestDialog } from './request-dialog';
import { PipelineSettings } from './pipeline-settings';
import { v4 as uuidv4 } from 'uuid';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { deleteRequest } from '@/lib/requests';

const defaultStages: PipelineStage[] = [
    { id: 'new', name: 'New', order: 0 },
    { id: 'contacted', name: 'Contacted', order: 1 },
    { id: 'proposal', name: 'Proposal', order: 2 },
    { id: 'won', name: 'Won', order: 3 },
    { id: 'lost', name: 'Lost', order: 4 },
];

export function RequestBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [editingRequest, setEditingRequest] = useState<ClientRequest | null>(null);
  
  useEffect(() => {
    if (!user) return;
    
    const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
    const unsubscribeSettings = onSnapshot(settingsRef, async (docSnap) => {
        if (docSnap.exists()) {
            const settings = docSnap.data();
            if (settings.crmSettings?.pipelineStages) {
                setStages(settings.crmSettings.pipelineStages.sort((a:PipelineStage,b:PipelineStage) => a.order - b.order));
            } else {
                 await updateDoc(settingsRef, { 'crmSettings.pipelineStages': defaultStages });
                 setStages(defaultStages);
            }
        } else {
            await setDoc(settingsRef, { crmSettings: { pipelineStages: defaultStages } });
            setStages(defaultStages);
        }
    });

    const reqQuery = query(collection(db, 'users', user.uid, 'clientRequests'));
    const unsubscribeReqs = onSnapshot(reqQuery, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientRequest)));
    });

    const clientQuery = query(collection(db, 'users', user.uid, 'clients'));
    const unsubscribeClients = onSnapshot(clientQuery, (snapshot) => {
      setClients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
    });

    return () => {
      unsubscribeSettings();
      unsubscribeReqs();
      unsubscribeClients();
    };
  }, [user]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || !user) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const request = requests.find(r => r.id === draggableId);
    const newStageId = destination.droppableId;
    
    if (request && newStageId) {
        const requestRef = doc(db, 'users', user.uid, 'clientRequests', draggableId);
        try {
            await updateDoc(requestRef, { stage: newStageId });
            const stageName = stages.find(s => s.id === newStageId)?.name || newStageId;
            toast({
                title: 'Deal Updated',
                description: `"${request.title}" moved to ${stageName}.`,
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error updating deal.' });
        }
    }
  };

  const requestsByStage = useMemo(() => {
    const initial: Record<string, ClientRequest[]> = {};
    stages.forEach(stage => initial[stage.id] = []);
    return requests.reduce((acc, request) => {
        if(acc[request.stage]) {
            acc[request.stage].push(request);
        }
        return acc;
    }, initial);
  }, [requests, stages]);

  const handleAddNewRequest = async () => {
    if (!user || stages.length === 0) return;
    try {
        await addDoc(collection(db, 'users', user.uid, 'clientRequests'), {
            title: 'New Deal',
            stage: stages[0].id,
            clientId: '',
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        toast({ title: 'New deal added!' });
    } catch(e) {
        toast({ variant: 'destructive', title: 'Error adding new deal.' });
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!user) return;
    try {
      await deleteRequest(user.uid, requestId);
      toast({ title: 'Deal deleted' });
    } catch(e) {
      toast({ variant: 'destructive', title: 'Error deleting deal' });
    }
  };

  const handleEditRequest = (request: ClientRequest) => {
    setEditingRequest(request);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-end mb-4 gap-2">
        <PipelineSettings currentStages={stages} />
        <Button onClick={handleAddNewRequest}>
          <PlusCircle /> New Deal
        </Button>
      </div>
      <ScrollArea className="flex-1 -mx-4">
        <div className="flex px-4 pb-4">
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 items-start">
            {stages.map(stage => (
                <div key={stage.id} className="flex flex-col w-72">
                <h2 className="text-lg font-semibold font-headline p-3 capitalize">{stage.name}</h2>
                <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex flex-col gap-4 bg-muted/50 rounded-lg p-4 min-h-[300px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary/10' : ''}`}
                    >
                        {requestsByStage[stage.id]?.map((req, index) => (
                        <Draggable key={req.id} draggableId={req.id} index={index}>
                            {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                <RequestCard 
                                  request={req} 
                                  clients={clients} 
                                  onDelete={() => handleDeleteRequest(req.id)}
                                  onEdit={() => handleEditRequest(req)}
                                />
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
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {editingRequest && (
        <RequestDialog
            isOpen={!!editingRequest}
            onOpenChange={(open) => {
                if (!open) setEditingRequest(null);
            }}
            request={editingRequest}
            clients={clients}
        />
      )}
    </div>
  );
}
