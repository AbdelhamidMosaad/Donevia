'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, TrendingUp, Book, BarChart3, List, Eye, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type { Trade, TradingStrategy, WatchlistItem } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TradeHistoryTable } from '@/components/trading-tracker/trade-history-table';
import { AddTradeDialog } from '@/components/trading-tracker/add-trade-dialog';
import { deleteTrade } from '@/lib/trading-tracker';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StrategyList } from '@/components/trading-tracker/strategy-list';
import { AnalyticsDashboard } from '@/components/trading-tracker/analytics-dashboard';
import { Watchlist } from '@/components/trading-tracker/watchlist';
import { RiskManagementDashboard } from '@/components/trading-tracker/risk-management-dashboard';

export default function TradingTrackerPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [trades, setTrades] = useState<Trade[]>([]);
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [isAddTradeDialogOpen, setIsAddTradeDialogOpen] = useState(false);
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const tradesQuery = query(collection(db, 'users', user.uid, 'trades'), orderBy('entryDate', 'desc'));
      const unsubscribeTrades = onSnapshot(tradesQuery, (snapshot) => {
        const tradesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Trade));
        setTrades(tradesData);
      });
      
      const strategiesQuery = query(collection(db, 'users', user.uid, 'tradingStrategies'), orderBy('createdAt', 'desc'));
      const unsubscribeStrategies = onSnapshot(strategiesQuery, (snapshot) => {
        const strategiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradingStrategy));
        setStrategies(strategiesData);
      });

      const watchlistQuery = query(collection(db, 'users', user.uid, 'watchlistItems'), orderBy('createdAt', 'desc'));
      const unsubscribeWatchlist = onSnapshot(watchlistQuery, (snapshot) => {
        const watchlistData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WatchlistItem));
        setWatchlistItems(watchlistData);
      });
      
      return () => {
        unsubscribeTrades();
        unsubscribeStrategies();
        unsubscribeWatchlist();
      };
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
      </div>
      
      <Tabs defaultValue="records" className="flex-1 flex flex-col min-h-0">
            <TabsList>
                <TabsTrigger value="records"><List className="mr-2 h-4 w-4"/> Records</TabsTrigger>
                <TabsTrigger value="watchlist"><Eye className="mr-2 h-4 w-4"/> Watchlist</TabsTrigger>
                <TabsTrigger value="strategies"><Book className="mr-2 h-4 w-4"/> Playbook</TabsTrigger>
                <TabsTrigger value="analytics"><BarChart3 className="mr-2 h-4 w-4"/> Analytics</TabsTrigger>
                <TabsTrigger value="risk"><Shield className="mr-2 h-4 w-4"/> Risk</TabsTrigger>
            </TabsList>
            
            <TabsContent value="records" className="flex-1 mt-4">
                <div className="flex justify-end mb-4">
                    <Button onClick={() => setIsAddTradeDialogOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Trade
                    </Button>
                </div>
                <TradeHistoryTable 
                    trades={trades} 
                    strategies={strategies} 
                    onDeleteTrade={handleDeleteTrade}
                    onFilteredTradesChange={setFilteredTrades}
                />
            </TabsContent>

            <TabsContent value="watchlist" className="flex-1 mt-4">
                <Watchlist items={watchlistItems} />
            </TabsContent>

            <TabsContent value="strategies" className="flex-1 mt-4">
                 <StrategyList strategies={strategies} />
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 mt-4">
               <AnalyticsDashboard trades={filteredTrades} />
            </TabsContent>

            <TabsContent value="risk" className="flex-1 mt-4">
               <RiskManagementDashboard />
            </TabsContent>
        </Tabs>

      <AddTradeDialog
        isOpen={isAddTradeDialogOpen}
        onOpenChange={setIsAddTradeDialogOpen}
        strategies={strategies}
      />
    </div>
  );
}
