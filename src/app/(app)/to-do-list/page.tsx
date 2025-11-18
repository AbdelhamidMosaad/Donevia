'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import moment from 'moment';
import { Loader2, ListTodo, Plus, Trash2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface ToDoItem {
  id: string;
  text: string;
  isCompleted: boolean;
  type: 'daily' | 'weekly';
  date: string; // 'YYYY-MM-DD' for daily, 'YYYY-WW' for weekly
  createdAt: any;
  ownerId: string;
  order: number;
}

const SimpleToDoList = ({ items, onToggle, onDelete }: { items: ToDoItem[], onToggle: (id: string, completed: boolean) => void, onDelete: (id: string) => void }) => {
    const completedItems = items.filter(item => item.isCompleted);
    const incompleteItems = items.filter(item => !item.isCompleted);

    return (
        <div className="space-y-2">
            {incompleteItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted group">
                    <Checkbox id={`item-${item.id}`} checked={item.isCompleted} onCheckedChange={(checked) => onToggle(item.id, !!checked)} />
                    <label htmlFor={`item-${item.id}`} className="flex-1 text-sm">{item.text}</label>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => onDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
            {completedItems.length > 0 && incompleteItems.length > 0 && <Separator className="my-4"/>}
            {completedItems.map(item => (
                 <div key={item.id} className="flex items-center gap-3 p-2 rounded-md group">
                    <Checkbox id={`item-${item.id}`} checked={item.isCompleted} onCheckedChange={(checked) => onToggle(item.id, !!checked)} />
                    <label htmlFor={`item-${item.id}`} className="flex-1 text-sm text-muted-foreground line-through">{item.text}</label>
                     <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => onDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
        </div>
    );
};

export default function ToDoListPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ToDoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'week'>('today');

  const todayDate = moment().format('YYYY-MM-DD');
  const thisWeek = moment().format('YYYY-WW');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/');
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, 'users', user.uid, 'todoItems'),
      where('date', 'in', [todayDate, thisWeek])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ToDoItem));
      setItems(allItems.sort((a, b) => a.order - b.order));
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching to-do items:", error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, router, todayDate, thisWeek]);

  const handleAddItem = async () => {
    if (!newItemText.trim() || !user) return;
    
    const type = activeTab === 'today' ? 'daily' : 'weekly';
    const date = activeTab === 'today' ? todayDate : thisWeek;

    const currentItems = items.filter(i => i.type === type && i.date === date);
    
    const newItem: Omit<ToDoItem, 'id' | 'createdAt'> = {
      text: newItemText.trim(),
      isCompleted: false,
      type,
      date,
      ownerId: user.uid,
      order: currentItems.length,
    };

    await addDoc(collection(db, 'users', user.uid, 'todoItems'), {
        ...newItem,
        createdAt: serverTimestamp(),
    });

    setNewItemText('');
  };

  const handleToggleItem = async (id: string, isCompleted: boolean) => {
    if (!user) return;
    const itemRef = doc(db, 'users', user.uid, 'todoItems', id);
    await updateDoc(itemRef, { isCompleted });
  };
  
  const handleDeleteItem = async (id: string) => {
    if (!user) return;
    const itemRef = doc(db, 'users', user.uid, 'todoItems', id);
    await deleteDoc(itemRef);
  };

  const dailyItems = useMemo(() => items.filter(item => item.type === 'daily' && item.date === todayDate), [items, todayDate]);
  const weeklyItems = useMemo(() => items.filter(item => item.type === 'weekly' && item.date === thisWeek), [items, thisWeek]);
  
  if (authLoading || !user) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full items-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <ListTodo className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-headline">To-do List</h1>
            <p className="text-muted-foreground">A simple checklist for your day and week.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'today' | 'week')}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
          </TabsList>
          <TabsContent value="today">
             <Card>
                <CardContent className="p-4">
                    {isLoading ? (
                        <div className="text-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : dailyItems.length === 0 ? (
                         <p className="text-center text-muted-foreground p-8">Your list for today is empty. Add a task below!</p>
                    ) : (
                        <SimpleToDoList items={dailyItems} onToggle={handleToggleItem} onDelete={handleDeleteItem}/>
                    )}
                     <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                        <Plus className="text-muted-foreground" />
                        <Input 
                            placeholder="Add a to-do for today..."
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                            className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="week">
            <Card>
                <CardContent className="p-4">
                    {isLoading ? (
                        <div className="text-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : weeklyItems.length === 0 ? (
                         <p className="text-center text-muted-foreground p-8">Your list for this week is empty. Add a task below!</p>
                    ) : (
                        <SimpleToDoList items={weeklyItems} onToggle={handleToggleItem} onDelete={handleDeleteItem}/>
                    )}
                     <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                        <Plus className="text-muted-foreground" />
                        <Input 
                            placeholder="Add a to-do for this week..."
                            value={newItemText}
                            onChange={(e) => setNewItemText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                            className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
