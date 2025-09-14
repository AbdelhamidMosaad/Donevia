
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { TradingStrategy } from '@/lib/types';
import { addStrategy, updateStrategy } from '@/lib/trading-tracker';
import { Save } from 'lucide-react';

interface StrategyDialogProps {
  strategy?: TradingStrategy | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StrategyDialog({
  strategy,
  isOpen,
  onOpenChange,
}: StrategyDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const isEditMode = !!strategy;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const resetForm = () => {
    setName('');
    setDescription('');
  };

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && strategy) {
        setName(strategy.name);
        setDescription(strategy.description);
      } else {
        resetForm();
      }
    }
  }, [isOpen, strategy, isEditMode]);

  const handleSave = async () => {
    if (!user || !name.trim()) {
      toast({ variant: 'destructive', title: 'Strategy name is required.' });
      return;
    }
    
    setIsSaving(true);
    
    const strategyData = {
        name,
        description,
    };

    try {
      if (isEditMode && strategy) {
        await updateStrategy(user.uid, strategy.id, strategyData);
        toast({ title: 'Strategy updated successfully!' });
      } else {
        await addStrategy(user.uid, strategyData);
        toast({ title: 'Strategy created successfully!' });
      }
      onOpenChange(false);
    } catch (e) {
      console.error("Error saving strategy: ", e);
      toast({ variant: 'destructive', title: 'Error saving strategy.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Strategy' : 'Create New Strategy'}</DialogTitle>
          <DialogDescription>
            Define your trading strategy or guideline.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Strategy Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Mean Reversion" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description / Rules</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Describe the setup, entry/exit criteria, and risk management rules..."
              className="min-h-[200px]"
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save />
            {isSaving ? 'Saving...' : 'Save Strategy'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
