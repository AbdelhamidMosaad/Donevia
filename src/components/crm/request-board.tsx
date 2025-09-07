
'use client';

import type { ClientRequest, Client } from '@/lib/types';
import { RequestCard } from './request-card';
import { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useToast } from '@/hooks/use-toast';
import { updateRequest } from '@/lib/requests';
import { useAuth } from '@/hooks/use-auth';
import { RequestDialog } from './request-dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';

interface RequestBoardProps {
  requests: ClientRequest[];
  clients: Client[];
}

export const STAGES = [
    { id: 'new-request', name: 'New Request' },
    { id: 'quotation', name: 'Quotation' },
    { id: 'execution', name: 'Execution' },
    { id: 'reporting', name: 'Reporting' },
    { id: 'invoice', name: 'Invoice' },
    { id: 'completed', name: 'Completed' },
    { id: 'win', name: 'Win' },
    { id: 'lost', name: 'Lost' },
];

const LOSS_REASONS = ['Budget', 'Competition', 'Timing', 'Scope', 'Other'];

export function RequestBoard({ requests, clients }: RequestBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingRequest, setEditingRequest] = useState<ClientRequest | null>(null);
  const [movingRequest, setMovingRequest] = useState<{request: ClientRequest, newStage: string} | null>(null);
  const [lossReason, setLossReason] = useState('');

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || !user) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    const request = requests.find(r => r.id === draggableId);
    if (!request) return;

    if (destination.droppableId === 'lost') {
        // Defer the update until the reason is provided
        setMovingRequest({ request, newStage: destination.droppableId });
    } else {
        await updateRequest(user.uid, draggableId, { stage: destination.droppableId });
        toast({ title: "Request Updated", description: `Moved "${request.title}" to ${destination.droppableId}.`});
    }
  };

  const handleLossReasonSubmit = async () => {
    if (!movingRequest || !user) return;
    
    await updateRequest(user.uid, movingRequest.request.id, { stage: 'lost', lossReason });
    toast({ title: "Request Updated", description: `Moved "${movingRequest.request.title}" to Lost.` });
    setMovingRequest(null);
    setLossReason('');
  }

  const requestsByStage = useMemo(() => {
    const grouped: Record<string, ClientRequest[]> = {};
    STAGES.forEach(stage => grouped[stage.id] = []);
    requests.forEach(req => {
        if (grouped[req.stage]) {
            grouped[req.stage].push(req);
        }
    });
    return grouped;
  }, [requests]);

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 items-start">
          {STAGES.map(stage => (
            <div key={stage.id} className="flex flex-col gap-4">
              <h2 className="font-semibold font-headline text-lg sticky top-0 bg-background/80 backdrop-blur-sm py-2">{stage.name} ({requestsByStage[stage.id]?.length || 0})</h2>
              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] bg-muted/50 rounded-lg p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-primary/10' : ''}`}
                  >
                    {requestsByStage[stage.id]?.map((request, index) => (
                      <Draggable key={request.id} draggableId={request.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="mb-4"
                          >
                            <RequestCard request={request} client={clientMap.get(request.clientId)} onClick={() => setEditingRequest(request)} />
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
      {editingRequest && (
        <RequestDialog 
            isOpen={!!editingRequest} 
            onOpenChange={() => setEditingRequest(null)}
            clients={clients}
            request={editingRequest}
        />
      )}
       <AlertDialog open={!!movingRequest} onOpenChange={() => setMovingRequest(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Lost</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for losing the request "{movingRequest?.request.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
            <div className="py-4">
                <Label htmlFor="lossReason">Reason</Label>
                <Select onValueChange={setLossReason} defaultValue={lossReason}>
                    <SelectTrigger id="lossReason">
                        <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                        {LOSS_REASONS.map(reason => (
                            <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLossReasonSubmit} disabled={!lossReason}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
