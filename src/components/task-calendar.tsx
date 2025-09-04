
'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Task } from '@/lib/types';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

export function TaskCalendar() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (user) {
      const q = collection(db, 'users', user.uid, 'tasks');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
        setTasks(tasksData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    
    // This is a simplified example. A real implementation would involve updating the date.
    // For this example, we'll just log it.
    console.log('Task dragged:', result.draggableId, 'to new position:', result.destination.index);
    // To update in firestore:
    // const taskRef = doc(db, 'users', user.uid, 'tasks', result.draggableId);
    // await updateDoc(taskRef, { status: result.destination.droppableId });
  };
  
  const tasksForSelectedDate = tasks.filter(task => 
    selectedDate && task.dueDate.toDate().toDateString() === selectedDate.toDateString()
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="p-0"
            modifiers={{
              hasTask: tasks.map(t => t.dueDate.toDate())
            }}
            modifiersStyles={{
              hasTask: {
                fontWeight: 'bold',
                textDecoration: 'underline',
                color: 'hsl(var(--primary))'
              }
            }}
          />
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>{selectedDate ? selectedDate.toLocaleDateString() : 'Select a date'}</CardTitle>
            <CardDescription>Tasks for the selected day.</CardDescription>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="tasks">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {tasksForSelectedDate.length > 0 ? (
                      tasksForSelectedDate.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="p-3 bg-card rounded-lg border"
                            >
                              <p className="font-semibold">{task.title}</p>
                              <p className="text-sm text-muted-foreground">{task.status} - {task.priority}</p>
                            </div>
                          )}
                        </Draggable>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No tasks for this day.</p>
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
