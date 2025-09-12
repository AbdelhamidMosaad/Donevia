
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
import type { Trade, TradingStrategy, TradeNote } from '@/lib/types';
import { addTrade, updateTrade } from '@/lib/trading-tracker';
import { Timestamp, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import moment from 'moment';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface AddTradeDialogProps {
  trade?: Trade | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  strategies: TradingStrategy[];
}

const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    EGP: 'E£',
};

export function AddTradeDialog({
  trade,
  isOpen,
  onOpenChange,
  strategies
}: AddTradeDialogProps) {
  const { user, settings } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const currencySymbol = currencySymbols[settings.currency || 'USD'] || '$';

  const isEditMode = !!trade;

  const [symbol, setSymbol] = useState('');
  const [entryPrice, setEntryPrice] = useState(0);
  const [exitPrice, setExitPrice] = useState(0);
  const [stopLoss, setStopLoss] = useState<number | undefined>();
  const [takeProfit, setTakeProfit] = useState<number | undefined>();
  const [quantity, setQuantity] = useState(0);
  const [entryDate, setEntryDate] = useState(new Date());
  const [exitDate, setExitDate] = useState(new Date());
  const [fees, setFees] = useState(0);
  const [notes, setNotes] = useState<TradeNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [chartUrl, setChartUrl] = useState('');
  const [strategyId, setStrategyId] = useState<string | undefined>();

  const resetForm = () => {
    setSymbol('');
    setEntryPrice(0);
    setExitPrice(0);
    setStopLoss(undefined);
    setTakeProfit(undefined);
    setQuantity(0);
    setEntryDate(new Date());
    setExitDate(new Date());
    setFees(0);
    setNotes([]);
    setNewNoteText('');
    setChartUrl('');
    setStrategyId(undefined);
  };

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && trade) {
        setSymbol(trade.symbol);
        setEntryPrice(trade.entryPrice);
        setExitPrice(trade.exitPrice);
        setStopLoss(trade.stopLoss);
        setTakeProfit(trade.takeProfit);
        setQuantity(trade.quantity);
        setEntryDate(trade.entryDate.toDate());
        setExitDate(trade.exitDate.toDate());
        setFees(trade.fees);
        setNotes(trade.notes || []);
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
        stopLoss,
        takeProfit,
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

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const newNote: TradeNote = {
      id: uuidv4(),
      date: Timestamp.now(),
      text: newNoteText.trim(),
    };
    setNotes([...notes, newNote]);
    setNewNoteText('');
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(notes.filter(n => n.id !== noteId));
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
                <Label htmlFor="entry-price">Entry Price ({currencySymbol})</Label>
                <Input id="entry-price" type="number" value={entryPrice} onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label htmlFor="exit-date">Exit Date & Time</Label>
                <Input id="exit-date" type="datetime-local" value={moment(exitDate).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setExitDate(new Date(e.target.value))} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="exit-price">Exit Price ({currencySymbol})</Label>
                <Input id="exit-price" type="number" value={exitPrice} onChange={(e) => setExitPrice(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="stop-loss">Stop Loss ({currencySymbol})</Label>
                <Input id="stop-loss" type="number" value={stopLoss || ''} onChange={(e) => setStopLoss(e.target.value ? parseFloat(e.target.value) : undefined)} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="take-profit">Take Profit ({currencySymbol})</Label>
                <Input id="take-profit" type="number" value={takeProfit || ''} onChange={(e) => setTakeProfit(e.target.value ? parseFloat(e.target.value) : undefined)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="fees">Fees ({currencySymbol})</Label>
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
            <Label>Notes & Rationale</Label>
            <ScrollArea className="h-32 w-full rounded-md border p-2">
                {notes.map(note => (
                    <div key={note.id} className="text-sm p-1.5 rounded-md hover:bg-muted flex justify-between items-start">
                        <div>
                            <p className="font-semibold">{moment(note.date.toDate()).format('YYYY-MM-DD HH:mm')}</p>
                            <p className="whitespace-pre-wrap">{note.text}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleDeleteNote(note.id)}>
                            <Trash2 className="h-4 w-4 text-destructive"/>
                        </Button>
                    </div>
                ))}
            </ScrollArea>
             <div className="flex items-center gap-2">
                <Textarea 
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Add a new note..."
                  className="min-h-[60px]"
                />
                <Button onClick={handleAddNote} size="icon" className="shrink-0">
                    <Plus className="h-4 w-4"/>
                </Button>
             </div>
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
