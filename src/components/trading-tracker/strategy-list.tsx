
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Book } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { TradingStrategy } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { deleteStrategy } from '@/lib/trading-tracker';
import { StrategyDialog } from '@/components/trading-tracker/strategy-dialog';
import { StrategyCard } from '@/components/trading-tracker/strategy-card';

interface StrategyListProps {
  strategies: TradingStrategy[];
}

export function StrategyList({ strategies }: StrategyListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const handleDeleteStrategy = async (strategyId: string) => {
    if (!user) return;
    try {
      await deleteStrategy(user.uid, strategyId);
      toast({ title: 'Strategy deleted successfully' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error deleting strategy' });
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle />
          New Strategy
        </Button>
      </div>
      
      {strategies.length === 0 ? (
         <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50">
          <Book className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold font-headline">No Strategies Yet</h3>
          <p className="text-muted-foreground">Click "New Strategy" to add your first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strategies.map(strategy => (
                <StrategyCard 
                    key={strategy.id} 
                    strategy={strategy} 
                    onDelete={() => handleDeleteStrategy(strategy.id)}
                />
            ))}
        </div>
      )}

      <StrategyDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </>
  );
}
