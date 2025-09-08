
'use client';

import { useState, useEffect } from 'react';
import type { BrainstormingIdea } from '@/lib/types';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { IdeaCard } from './idea-card';
import { Card, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { updateIdeaOrder } from '@/lib/brainstorm';
import { useToast } from '@/hooks/use-toast';

interface BrainstormingCanvasProps {
  ideas: BrainstormingIdea[];
}

export function BrainstormingCanvas({ ideas: initialIdeas }: BrainstormingCanvasProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [ideas, setIdeas] = useState(initialIdeas);
    
    useEffect(() => {
        setIdeas(initialIdeas.sort((a, b) => a.order - b.order));
    }, [initialIdeas]);
    
    const onDragEnd = async (result: DropResult) => {
        if (!result.destination || !user) return;
        
        const reorderedIdeas = Array.from(ideas);
        const [movedItem] = reorderedIdeas.splice(result.source.index, 1);
        reorderedIdeas.splice(result.destination.index, 0, movedItem);

        const updatedIdeasWithOrder = reorderedIdeas.map((idea, index) => ({
            ...idea,
            order: index
        }));

        setIdeas(updatedIdeasWithOrder);

        try {
            const ideasToUpdate = updatedIdeasWithOrder.map(({ id, order }) => ({ id, order }));
            await updateIdeaOrder(user.uid, ideasToUpdate);
        } catch (e) {
            console.error("Failed to update idea order:", e);
            toast({ variant: 'destructive', title: 'Failed to reorder ideas.' });
            setIdeas(initialIdeas); // Revert on failure
        }
    };
    
    return (
        <Card className="h-full">
            <ScrollArea className="h-full">
                 <CardContent className="p-4 h-full">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="ideas-canvas">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4"
                                >
                                {ideas.map((idea, index) => (
                                    <Draggable key={idea.id} draggableId={idea.id} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                            >
                                                <IdeaCard idea={idea} dragHandleProps={provided.dragHandleProps} />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                    {ideas.length === 0 && (
                        <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                            <p>Your canvas is empty. Add an idea to get started!</p>
                        </div>
                    )}
                </CardContent>
            </ScrollArea>
        </Card>
    );
}
