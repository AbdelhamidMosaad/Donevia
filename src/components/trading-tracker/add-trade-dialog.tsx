
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
import type { Trade, TradingStrategy } from '@/lib/types';
import { addTrade, updateTrade } from '@/lib/trading-tracker';
import { Timestamp, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import moment from 'moment';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface AddTradeDialogProps {
  trade?: Trade | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTradeDialog({
  trade,
  isOpen,
  onOpenChange,
}: AddTradeDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);

  const isEditMode = !!trade;

  const [symbol, setSymbol] = useState('');
  const [entryPrice, setEntryPrice] = useState(0);
  const [exitPrice, setExitPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [entryDate, setEntryDate] = useState(new Date());
  const [exitDate, setExitDate] = useState(new Date());
  const [fees, setFees] = useState(0);
  const [notes, setNotes] = useState('');
  const [chartUrl, setChartUrl] = useState('');
  const [strategyId, setStrategyId] = useState<string | undefined>();
  
  useEffect(() => {
    if(user) {
      const q = query(collection(db, 'users', user.uid, 'tradingStrategies'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setStrategies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TradingStrategy)));
      });
      return () => unsubscribe();
    }
  }, [user]);

  const resetForm = () => {
    setSymbol('');
    setEntryPrice(0);
    setExitPrice(0);
    setQuantity(0);
    setEntryDate(new Date());
    setExitDate(new Date());
    setFees(0);
    setNotes('');
    setChartUrl('');
    setStrategyId(undefined);
  };

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && trade) {
        setSymbol(trade.symbol);
        setEntryPrice(trade.entryPrice);
        setExitPrice(trade.exitPrice);
        setQuantity(trade.quantity);
        setEntryDate(trade.entryDate.toDate());
        setExitDate(trade.exitDate.toDate());
        setFees(trade.fees);
        setNotes(trade.notes || '');
        setChartUrl(trade.chartUrl || '');
        setStrategyId(trade.strategyId);
      } else {
        resetForm();
      }
    }
  }, [isOpen, trade, isEditMode]);

  const handleSave = async () => {
    if (!user || !symbol) {
      toast({ variant: 'destructive', title: 'Symbol is required.' });
      return;
    }
    
    setIsSaving(true);
    
    const pnl = (exitPrice - entryPrice) * quantity - fees;
    
    const tradeData = {
        symbol,
        entryPrice,
        exitPrice,
        quantity,
        entryDate: Timestamp.fromDate(entryDate),
        exitDate: Timestamp.fromDate(exitDate),
        fees,
        notes,
        chartUrl,
        profitOrLoss: pnl,
        strategyId,
    };

    try {
      if (isEditMode && trade) {
        await updateTrade(user.uid, trade.id, tradeData);
        toast({ title: 'Trade updated successfully!' });
      } else {
        await addTrade(user.uid, tradeData);
        toast({ title: 'Trade added successfully!' });
      }
      onOpenChange(false);
    } catch (e) {
      console.error("Error saving trade: ", e);
      toast({ variant: 'destructive', title: 'Error saving trade.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Trade' : 'Record New Trade'}</DialogTitle>
          <DialogDescription>
            Enter the details of your trade.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input id="symbol" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} placeholder="e.g., AAPL" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)} />
              </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="entry-date">Entry Date & Time</Label>
                <Input id="entry-date" type="datetime-local" value={moment(entryDate).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setEntryDate(new Date(e.target.value))} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="entry-price">Entry Price</Label>
                <Input id="entry-price" type="number" value={entryPrice} onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="exit-date">Exit Date & Time</Label>
                <Input id="exit-date" type="datetime-local" value={moment(exitDate).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setExitDate(new Date(e.target.value))} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="exit-price">Exit Price</Label>
                <Input id="exit-price" type="number" value={exitPrice} onChange={(e) => setExitPrice(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="fees">Fees</Label>
                <Input id="fees" type="number" value={fees} onChange={(e) => setFees(parseFloat(e.target.value) || 0)} />
            </div>
             <div className="space-y-2">
                <Label htmlFor="strategy">Strategy</Label>
                <Select value={strategyId} onValueChange={setStrategyId}>
                    <SelectTrigger><SelectValue placeholder="Select a strategy"/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {strategies.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="chartUrl">Chart URL</Label>
            <Input id="chartUrl" value={chartUrl} onChange={(e) => setChartUrl(e.target.value)} placeholder="https://www.tradingview.com/chart/..."/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes & Rationale</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why did you take this trade? How did it go?"/>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Trade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    