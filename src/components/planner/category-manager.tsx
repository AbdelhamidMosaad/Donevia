
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import type { PlannerCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CategoryManagerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: PlannerCategory[];
}

const defaultColors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef"];

export function CategoryManager({ isOpen, onOpenChange, categories }: CategoryManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = async () => {
    if (!user || !newCategoryName.trim()) return;

    const color = defaultColors[categories.length % defaultColors.length];

    try {
      await addDoc(collection(db, 'users', user.uid, 'plannerCategories'), {
        name: newCategoryName,
        color: color,
        ownerId: user.uid,
      });
      setNewCategoryName('');
      toast({ title: "Category added!" });
    } catch (e) {
      toast({ variant: 'destructive', title: "Error adding category" });
    }
  };

  const handleUpdateCategory = async (categoryId: string, newColor: string) => {
    if (!user) return;
    const categoryRef = doc(db, 'users', user.uid, 'plannerCategories', categoryId);
    try {
        await updateDoc(categoryRef, { color: newColor });
    } catch (e) {
        toast({ variant: 'destructive', title: "Error updating category color" });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!user) return;
    const categoryRef = doc(db, 'users', user.uid, 'plannerCategories', categoryId);
     try {
        await deleteDoc(categoryRef);
        toast({ title: "Category deleted" });
    } catch (e) {
        toast({ variant: 'destructive', title: "Error deleting category" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
          <DialogDescription>Create, edit, and delete your event categories.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            {categories.map(category => (
              <div key={category.id} className="flex items-center gap-2">
                <input
                  type="color"
                  value={category.color}
                  onChange={(e) => handleUpdateCategory(category.id, e.target.value)}
                  className="w-8 h-8 p-0 border-none rounded-md cursor-pointer"
                />
                <Input value={category.name} readOnly className="flex-1 bg-muted" />
                <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t pt-4">
            <Input
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <Button onClick={handleAddCategory}><PlusCircle className="mr-2 h-4 w-4" /> Add</Button>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
