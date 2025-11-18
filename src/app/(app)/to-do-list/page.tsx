
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, query, where, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import moment from 'moment';
import { Loader2, ListTodo, Plus, Trash2, ArrowRight, Tag, Link as LinkIcon, Edit, Briefcase, Save, FolderDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useTasks } from '@/hooks/use-tasks';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '../ui/label';

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
  url?: string;
}

interface ToDoTemplate {
    id: string;
    name: string;
    items: { text: string; tags?: string[] }[];
}

const SimpleToDoList = ({ items, onToggle, onDelete, onMove, onUpdate, onAddToTasks, listType }: { items: ToDoItem[], onToggle: (id: string, completed: boolean) => void, onDelete: (id: string) => void, onMove?: (id: string) => void, onUpdate: (id: string, updates: Partial<ToDoItem>) => void, onAddToTasks: (item: ToDoItem) => void, listType: 'daily' | 'weekly' }) => {
    const [editingField, setEditingField] = useState<{ id: string; field: 'tags' | 'url' } | null>(null);
    const [editValue, setEditValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingField && inputRef.current) {
            inputRef.current.focus();
        }
    }, [editingField]);

    const handleStartEdit = (item: ToDoItem, field: 'tags' | 'url') => {
        setEditingField({ id: item.id, field });
        if (field === 'tags') {
            setEditValue(item.tags?.join(', ') || '');
        } else {
            setEditValue(item.url || '');
        }
    };
    
    const handleSaveEdit = () => {
        if (!editingField) return;

        const updates: Partial<ToDoItem> = {};
        if (editingField.field === 'tags') {
            updates.tags = editValue.split(',').map(tag => tag.trim()).filter(Boolean);
        } else {
            const trimmedUrl = editValue.trim();
            updates.url = trimmedUrl ? (trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`) : undefined;
        }
        
        onUpdate(editingField.id, updates);
        setEditingField(null);
        setEditValue('');
    };
    
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            setEditingField(null);
            setEditValue('');
        }
    };

    const incompleteItems = items.filter(item => !item.isCompleted);
    const completedItems = items.filter(item => item.isCompleted);

    const renderItem = (item: ToDoItem) => {
        const isEditingThisItem = editingField?.id === item.id;
        
        const itemLabel = (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className={cn("text-sm hover:underline", item.isCompleted && "line-through text-muted-foreground", !item.url && "pointer-events-none no-underline")}>
            {item.text}
            {item.url && <LinkIcon className="inline-block h-3 w-3 ml-1 text-muted-foreground" />}
          </a>
        );

        return (
          <div key={item.id} className="p-2 rounded-md hover:bg-muted group flex flex-col">
            <div className="flex items-start gap-3">
              <Checkbox id={`item-${item.id}`} checked={item.isCompleted} onCheckedChange={(checked) => onToggle(item.id, !!checked)} className="mt-1" />
              <div className="flex-1">
                  {itemLabel}
                  {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                          {item.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                      </div>
                  )}
              </div>
               <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(item, 'tags')} title="Edit Tags"><Tag className="h-4 w-4 text-muted-foreground"/></Button>
                   <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStartEdit(item, 'url')} title="Edit Link"><LinkIcon className="h-4 w-4 text-muted-foreground"/></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddToTasks(item)} title="Add to Task Manager"><Briefcase className="h-4 w-4 text-primary"/></Button>
                   {listType === 'weekly' && onMove && !item.isCompleted && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onMove(item.id)} title="Move to Today">
                          <ArrowRight className="h-4 w-4 text-primary" />
                      </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
               </div>
            </div>
            {isEditingThisItem && (
                 <div className="pl-8 pt-2">
                    <Input 
                        ref={inputRef}
                        placeholder={editingField.field === 'tags' ? 'Tags (comma-separated)...' : 'Add a link...'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={handleSaveEdit}
                        className="h-8"
                    />
                </div>
            )}
          </div>
        );
    }

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
  const { toast } = useToast();
  const { addTask, stages } = useTasks();
  const [items, setItems] = useState<ToDoItem[]>([]);
  const [templates, setTemplates] = useState<ToDoTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemText, setNewItemText] = useState('');
  const [newTags, setNewTags] = useState('');
  const [activeTab, setActiveTab] = useState<'today' | 'week'>('today');
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

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
    
    const unsubscribeItems = onSnapshot(q, (snapshot) => {
      const allItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ToDoItem));
      setItems(allItems.sort((a, b) => (a.order || 0) - (b.order || 0)));
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching to-do items:", error);
        setIsLoading(false);
    });

    const templatesQuery = query(collection(db, 'users', user.uid, 'todoTemplates'));
    const unsubscribeTemplates = onSnapshot(templatesQuery, (snapshot) => {
        setTemplates(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as ToDoTemplate)));
    });

    return () => {
        unsubscribeItems();
        unsubscribeTemplates();
    };
  }, [user, authLoading, router, todayDate, thisWeek]);

  const handleAddItem = async () => {
    if (!newItemText.trim() || !user) return;

    const type = activeTab === 'today' ? 'daily' : 'weekly';
    const date = activeTab === 'today' ? todayDate : thisWeek;

    const currentItems = items.filter(i => i.type === type && i.date === date);

    const newItem: Partial<ToDoItem> = {
        text: newItemText.trim(),
        isCompleted: false,
        type,
        date,
        ownerId: user.uid,
        order: currentItems.length,
        tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
    };
    
    await addDoc(collection(db, 'users', user.uid, 'todoItems'), {
        ...newItem,
        createdAt: serverTimestamp(),
    });

    setNewItemText('');
    setNewTags('');
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
  
  const handleUpdateItem = async (id: string, updates: Partial<ToDoItem>) => {
    if (!user) return;
    const itemRef = doc(db, 'users', user.uid, 'todoItems', id);
    await updateDoc(itemRef, { ...updates });
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
  
  const handleAddToTasks = async (item: ToDoItem) => {
    if (stages.length === 0) {
      toast({ variant: 'destructive', title: 'No task stages found!', description: 'Please set up your task board first.' });
      return;
    }
    
    let description = '';
    if (item.url) {
      description += `Original Link: ${item.url}\n\n`;
    }
    description += `Added from To-do List.`;
    
    await addTask({
      title: item.text,
      description,
      tags: item.tags,
      status: stages[0].id,
      priority: 'Medium',
      dueDate: Timestamp.fromDate(new Date()),
      category: 'general',
    });
    
    toast({ title: 'Task Created', description: `"${item.text}" has been added to your main task board.` });
  };

  const handleSaveTemplate = async () => {
    if(!user || !templateName.trim()) {
        toast({variant: 'destructive', title: 'Template name is required.'});
        return;
    };
    const currentItems = activeTab === 'today' ? dailyItems : weeklyItems;
    if(currentItems.length === 0) {
        toast({variant: 'destructive', title: 'Cannot save an empty list as a template.'});
        return;
    }

    const templateItems = currentItems.map(({ text, tags }) => ({ text, tags: tags || [] }));

    await addDoc(collection(db, 'users', user.uid, 'todoTemplates'), {
        name: templateName,
        items: templateItems,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
    });

    toast({title: 'Template saved!', description: `"${templateName}" is now available.`});
    setIsTemplateDialogOpen(false);
    setTemplateName('');
  };

  const handleLoadTemplate = async (templateId: string) => {
    if(!user) return;
    const template = templates.find(t => t.id === templateId);
    if(!template) return;

    const type = activeTab === 'today' ? 'daily' : 'weekly';
    const date = activeTab === 'today' ? todayDate : thisWeek;

    const currentItems = items.filter(i => i.type === type && i.date === date);
    let order = currentItems.length;

    const batch = writeBatch(db);
    template.items.forEach(item => {
        const newItemRef = doc(collection(db, 'users', user.uid, 'todoItems'));
        const newItemData: Partial<ToDoItem> = {
            text: item.text,
            tags: item.tags,
            isCompleted: false,
            type,
            date,
            ownerId: user.uid,
            order: order++,
            createdAt: serverTimestamp(),
        };
        batch.set(newItemRef, newItemData);
    });

    await batch.commit();
    toast({title: 'Template loaded!', description: `${template.items.length} items added to your list.`});
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if(!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'todoTemplates', templateId));
    toast({title: 'Template deleted.'});
  }

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
                  <SimpleToDoList 
                    items={listItems} 
                    onToggle={handleToggleItem} 
                    onDelete={handleDeleteItem} 
                    onMove={listType === 'weekly' ? handleMoveToToday : undefined}
                    onUpdate={handleUpdateItem}
                    onAddToTasks={handleAddToTasks}
                    listType={listType}
                   />
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
                          value={newTags}
                          onChange={(e) => setNewTags(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                          className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-8 text-sm"
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

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'today' | 'week'); setNewItemText(''); setNewTags(''); }}>
            <div className="flex justify-between items-center mb-2">
                <TabsList>
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="week">This Week</TabsTrigger>
                </TabsList>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)}><Save className="mr-2 h-4 w-4"/>Save as Template</Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline"><FolderDown className="mr-2 h-4 w-4"/>Load Template</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Select a Template</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {templates.map(template => (
                                <DropdownMenuItem key={template.id} onSelect={() => handleLoadTemplate(template.id)} className="flex justify-between items-center">
                                    <span>{template.name}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                </DropdownMenuItem>
                            ))}
                             {templates.length === 0 && <DropdownMenuItem disabled>No templates saved.</DropdownMenuItem>}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
          <TabsContent value="today">
            {renderList(dailyItems, 'daily')}
          </TabsContent>
          <TabsContent value="week">
            {renderList(weeklyItems, 'weekly')}
          </TabsContent>
        </Tabs>
      </div>

       <AlertDialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Save List as Template</AlertDialogTitle>
                    <AlertDialogDescription>
                        Enter a name for your new template. This will save the current list of tasks (without their completion status).
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input 
                        id="template-name"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="e.g., Morning Routine"
                        onKeyDown={(e) => { if(e.key === 'Enter') handleSaveTemplate() }}
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSaveTemplate} disabled={!templateName.trim()}>Save Template</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
