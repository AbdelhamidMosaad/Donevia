
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Book, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { TradingStrategy } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { deleteStrategy } from '@/lib/trading-tracker';
import { StrategyDialog } from '@/components/trading-tracker/strategy-dialog';
import { StrategyCard } from '@/components/trading-tracker/strategy-card';

export default function TradingStrategiesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'tradingStrategies'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const strategiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradingStrategy));
        setStrategies(strategiesData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleDeleteStrategy = async (strategyId: string) => {
    if (!user) return;
    try {
      await deleteStrategy(user.uid, strategyId);
      toast({ title: 'Strategy deleted successfully' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error deleting strategy' });
    }
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/trading-tracker')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
                <Book className="h-8 w-8 text-primary"/>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Strategy Playbook</h1>
                    <p className="text-muted-foreground">Define and manage your personal trading strategies.</p>
                </div>
            </div>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
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
    </div>
  );
}

    