
'use client';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Settings, PlusCircle, Save, Trash2, GripVertical } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '../ui/dialog';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDocs, collection, query, where, writeBatch, setDoc } from 'firebase/firestore';
import type { PipelineStage } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Label } from '../ui/label';
import { v4 as uuidv4 } from 'uuid';

interface PipelineSettingsProps {
    currentStages: PipelineStage[];
}

export function PipelineSettings({ currentStages }: PipelineSettingsProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [stages, setStages] = useState<PipelineStage[]>([]);
    const [newStageName, setNewStageName] = useState('');

    useEffect(() => {
        setStages(currentStages.map((s, i) => ({...s, order: i})).sort((a, b) => a.order - b.order));
    }, [currentStages, open]);

    const handleStageNameChange = (id: string, newName: string) => {
        setStages(stages.map(stage => stage.id === id ? { ...stage, name: newName } : stage));
    };

    const handleAddStage = () => {
        if (!newStageName.trim()) return;
        const newStage: PipelineStage = {
            id: uuidv4(),
            name: newStageName.trim(),
            order: stages.length,
        };
        setStages([...stages, newStage]);
        setNewStageName('');
    };

    const handleDeleteStage = (id: string) => {
        if (stages.length <= 1) {
            toast({ variant: 'destructive', title: 'Cannot delete the last stage.'});
            return;
        }
        setStages(stages.filter(stage => stage.id !== id).map((s, i) => ({...s, order: i})));
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const items = Array.from(stages);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setStages(items.map((item, index) => ({ ...item, order: index })));
    };
    
    const handleSaveChanges = async () => {
        if (!user) return;
        
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'settings');
        const batch = writeBatch(db);

        // Reassign deals from deleted stages to the first available stage
        const currentStageIds = stages.map(s => s.id);
        const deletedStageIds = currentStages.filter(cs => !currentStageIds.includes(cs.id)).map(s => s.id);
        
        if (deletedStageIds.length > 0 && stages.length > 0) {
            const requestsRef = collection(db, 'users', user.uid, 'clientRequests');
            const q = query(requestsRef, where('stage', 'in', deletedStageIds));
            const requestsToUpdateSnap = await getDocs(q);
            const firstStageId = stages[0].id;
            requestsToUpdateSnap.forEach(requestDoc => {
                batch.update(requestDoc.ref, { stage: firstStageId });
            });
        }
        
        // Update the settings document with the new stages
        batch.set(settingsRef, { crmSettings: { pipelineStages: stages.map(({ ...rest }, i) => ({ ...rest, order: i })) } }, { merge: true });

        await batch.commit();

        toast({ title: "Pipeline settings saved!" });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Pipeline Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Pipeline Settings</DialogTitle>
                    <DialogDescription>Customize the stages in your sales pipeline.</DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    <div>
                        <Label>Pipeline Stages</Label>
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="stages">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 mt-2">
                                        {stages.map((stage, index) => (
                                            <Draggable key={stage.id} draggableId={stage.id} index={index}>
                                                {(provided) => (
                                                    <div ref={provided.innerRef} {...provided.draggableProps} className="flex items-center gap-2">
                                                        <span {...provided.dragHandleProps} className="cursor-grab p-1">
                                                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                                                        </span>
                                                        <Input 
                                                            value={stage.name} 
                                                            onChange={(e) => handleStageNameChange(stage.id, e.target.value)}
                                                        />
                                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteStage(stage.id)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                        <div className="flex items-center gap-2 mt-4">
                            <Input placeholder="New stage name" value={newStageName} onChange={(e) => setNewStageName(e.target.value)} />
                            <Button onClick={handleAddStage}><PlusCircle className="mr-2 h-4 w-4" /> Add Stage</Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
                    <Button onClick={handleSaveChanges}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
