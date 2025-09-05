
'use client';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Settings, PlusCircle, Save, Trash2, GripVertical } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from './ui/dialog';
import { Input } from './ui/input';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDoc, setDoc, getDocs, collection, addDoc, query, where } from 'firebase/firestore';
import type { Stage, BoardTemplate } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

interface BoardSettingsProps {
    listId: string;
    currentStages: Stage[];
}

export function BoardSettings({ listId, currentStages }: BoardSettingsProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [stages, setStages] = useState<Stage[]>([]);
    const [newStageName, setNewStageName] = useState('');
    const [templates, setTemplates] = useState<BoardTemplate[]>([]);
    const [newTemplateName, setNewTemplateName] = useState('');

    useEffect(() => {
        setStages(currentStages.sort((a, b) => a.order - b.order));
    }, [currentStages, open]);
    
    useEffect(() => {
        if (user && open) {
            const templatesRef = collection(db, 'users', user.uid, 'boardTemplates');
            getDocs(templatesRef).then(snapshot => {
                const templatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BoardTemplate));
                setTemplates(templatesData);
            });
        }
    }, [user, open]);

    const handleStageNameChange = (id: string, newName: string) => {
        setStages(stages.map(stage => stage.id === id ? { ...stage, name: newName } : stage));
    };

    const handleAddStage = () => {
        if (!newStageName.trim()) return;
        const newStage: Stage = {
            id: `stage_${Date.now()}`,
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
        setStages(stages.filter(stage => stage.id !== id));
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
        const listRef = doc(db, 'users', user.uid, 'taskLists', listId);

        // Find deleted stages to reassign tasks
        const deletedStageIds = currentStages.filter(cs => !stages.find(s => s.id === cs.id)).map(s => s.id);
        if (deletedStageIds.length > 0 && stages.length > 0) {
            const tasksRef = collection(db, 'users', user.uid, 'tasks');
            const q = query(tasksRef, where('listId', '==', listId), where('status', 'in', deletedStageIds));
            const tasksToUpdateSnap = await getDocs(q);
            const firstStageId = stages[0].id;
            const batch = new (await import('firebase/firestore')).WriteBatch(db);
            tasksToUpdateSnap.forEach(taskDoc => {
                batch.update(taskDoc.ref, { status: firstStageId });
            });
            await batch.commit();
        }

        await updateDoc(listRef, { stages: stages.map((s, i) => ({...s, order: i})) });
        toast({ title: "Board settings saved!" });
        setOpen(false);
    };
    
    const handleSaveAsTemplate = async () => {
        if (!user || !newTemplateName.trim()) return;
        const templateData = {
            name: newTemplateName,
            stages: stages.map(({id, ...rest}) => rest) // remove id
        };
        const templateRef = await addDoc(collection(db, 'users', user.uid, 'boardTemplates'), templateData);
        setTemplates([...templates, { id: templateRef.id, ...templateData }]);
        setNewTemplateName('');
        toast({ title: 'Template saved!', description: `"${newTemplateName}" is now available.`});
    };
    
    const handleApplyTemplate = async (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            const newStages = template.stages.map((s, i) => ({...s, id: `stage_${Date.now()}_${i}`}));
            setStages(newStages);
            toast({ title: 'Template applied!', description: `"${template.name}" stages are ready to be saved.`});
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Board Settings
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Board Settings</DialogTitle>
                    <DialogDescription>Customize stages and manage templates for this board.</DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    <div>
                        <Label>Load Template</Label>
                        <Select onValueChange={handleApplyTemplate}>
                            <SelectTrigger><SelectValue placeholder="Select a template" /></SelectTrigger>
                            <SelectContent>
                                {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Board Stages</Label>
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
                    
                    <div className="border-t pt-4">
                         <Label>Save as New Template</Label>
                        <div className="flex items-center gap-2 mt-2">
                            <Input placeholder="New template name" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} />
                            <Button variant="outline" onClick={handleSaveAsTemplate}><Save className="mr-2 h-4 w-4" /> Save Template</Button>
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

