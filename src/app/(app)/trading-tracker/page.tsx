
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, TrendingUp, Book } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Trade } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TradeHistoryTable } from '@/components/trading-tracker/trade-history-table';
import { AddTradeDialog } from '@/components/trading-tracker/add-trade-dialog';
import { deleteTrade } from '@/lib/trading-tracker';
import { useToast } from '@/hooks/use-toast';

export default function TradingTrackerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'trades'), orderBy('entryDate', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const tradesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade));
        setTrades(tradesData);
      });
      return () => unsubscribe();
    }
  }, [user]);
  
  const handleDeleteTrade = async (tradeId: string) => {
    if (!user) return;
    try {
      await deleteTrade(user.uid, tradeId);
      toast({ title: 'Trade deleted' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error deleting trade' });
    }
  };

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
            <TrendingUp className="h-8 w-8 text-primary"/>
            <div>
                <h1 className="text-3xl font-bold font-headline">Trading Tracker</h1>
                <p className="text-muted-foreground">Record, analyze, and improve your trading performance.</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push('/trading-tracker/strategies')}>
              <Book className="mr-2 h-4 w-4" />
              Strategy Playbook
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Trade
            </Button>
        </div>
      </div>
      
      <TradeHistoryTable trades={trades} onDeleteTrade={handleDeleteTrade} />

      <AddTradeDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
}


    