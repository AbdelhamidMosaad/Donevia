'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import moment from 'moment';
import { Loader2, ListTodo, Plus, Trash2, ArrowRight, Tag } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface ToDoItem {
  id: string;
  text: string;
  isCompleted: boolean;
  type: 'daily' | 'weekly';
  date: string; // 'YYYY-MM-DD' for daily, 'YYYY-WW' for weekly
  createdAt: any;
  ownerId: string;
  order: number;
  tags?: string[];
}

const SimpleToDoList = ({ items, onToggle, onDelete, onMove, listType }: { items: ToDoItem[], onToggle: (id: string, completed: boolean) => void, onDelete: (id: string) => void, onMove?: (id: string) => void, listType: 'daily' | 'weekly' }) => {
    const completedItems = items.filter(item => item.isCompleted);
    const incompleteItems = items.filter(item => !item.isCompleted);

    const renderItem = (item: ToDoItem) => (
      <div key={item.id} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted group">
          <Checkbox id={`item-${item.id}`} checked={item.isCompleted} onCheckedChange={(checked) => onToggle(item.id, !!checked)} className="mt-1" />
          <div className="flex-1">
              <label htmlFor={`item-${item.id}`} className={cn("text-sm", item.isCompleted && "line-through text-muted-foreground")}>{item.text}</label>
              {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                      {item.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                  </div>
              )}
          </div>
          {listType === 'weekly' && onMove && (
             <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => onMove(item.id)} title="Move to Today">
                  <ArrowRight className="h-4 w-4 text-primary" />
              </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
      </div>
    );

    return (
        <div className="space-y-1">
            {incompleteItems.map(renderItem)}
            {completedItems.length > 0 && incompleteItems.length > 0 && <Separator className="my-2"/>}
            {completedItems.map(renderItem)}
        </div>
    );
};

export default function ToDoListPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ToDoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [newItemTags, setNewItemTags] = useState('');
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
      tags: newItemTags.split(',').map(tag => tag.trim()).filter(Boolean),
    };

    await addDoc(collection(db, 'users', user.uid, 'todoItems'), {
        ...newItem,
        createdAt: serverTimestamp(),
    });

    setNewItemText('');
    setNewItemTags('');
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

  const handleMoveToToday = async (id: string) => {
    if (!user) return;
    const itemToMove = items.find(item => item.id === id);
    if (itemToMove && itemToMove.type === 'weekly') {
        const itemRef = doc(db, 'users', user.uid, 'todoItems', id);
        await updateDoc(itemRef, {
            type: 'daily',
            date: todayDate,
        });
    }
  };

  const dailyItems = useMemo(() => items.filter(item => item.type === 'daily' && item.date === todayDate), [items, todayDate]);
  const weeklyItems = useMemo(() => items.filter(item => item.type === 'weekly' && item.date === thisWeek), [items, thisWeek]);
  
  if (authLoading || !user) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  const renderList = (listItems: ToDoItem[], listType: 'daily' | 'weekly') => (
       <Card>
          <CardContent className="p-4">
              {isLoading ? (
                  <div className="text-center p-8"><Loader2 className="animate-spin" /></div>
              ) : listItems.length === 0 && newItemText === '' ? (
                   <p className="text-center text-muted-foreground p-8">Your list for {listType === 'daily' ? 'today' : 'this week'} is empty. Add a task below!</p>
              ) : (
                  <SimpleToDoList items={listItems} onToggle={handleToggleItem} onDelete={handleDeleteItem} onMove={listType === 'weekly' ? handleMoveToToday : undefined} listType={listType} />
              )}
               <div className="flex flex-col gap-2 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Plus className="text-muted-foreground" />
                    <Input 
                        placeholder={`Add a to-do for ${listType === 'daily' ? 'today' : 'this week'}...`}
                        value={newItemText}
                        onChange={(e) => setNewItemText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        className="border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                   <div className="flex items-center gap-2 pl-8">
                      <Tag className="text-muted-foreground h-4 w-4" />
                      <Input 
                          placeholder="Tags (comma-separated)..."
                          value={newItemTags}
                          onChange={(e) => setNewItemTags(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                          className="h-8 border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                      />
                  </div>
              </div>
          </CardContent>
      </Card>
  );

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

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'today' | 'week'); setNewItemText(''); setNewItemTags(''); }}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
          </TabsList>
          <TabsContent value="today">
            {renderList(dailyItems, 'daily')}
          </TabsContent>
          <TabsContent value="week">
            {renderList(weeklyItems, 'weekly')}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
