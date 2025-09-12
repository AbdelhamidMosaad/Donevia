
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, LineChart, FileDown, StickyNote } from 'lucide-react';
import type { Trade, TradingStrategy } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel
} from '../ui/alert-dialog';
import moment from 'moment';
import { cn } from '@/lib/utils';
import { AddTradeDialog } from './add-trade-dialog';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Input } from '../ui/input';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '../ui/tooltip';


interface TradeHistoryTableProps {
  trades: Trade[];
  strategies: TradingStrategy[];
  onDeleteTrade: (tradeId: string) => void;
}

const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    EGP: 'E£',
};

export function TradeHistoryTable({ trades, strategies, onDeleteTrade }: TradeHistoryTableProps) {
  const { user, settings } = useAuth();
  const { toast } = useToast();
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  
  // Filter states
  const [dateFilterType, setDateFilterType] = useState<'all' | 'month' | 'period'>('all');
  const [filterMonth, setFilterMonth] = useState<string>(moment().format('M'));
  const [filterYear, setFilterYear] = useState<string>(moment().format('YYYY'));
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterStrategy, setFilterStrategy] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterSymbol, setFilterSymbol] = useState('');
  
  const currencySymbol = currencySymbols[settings.currency || 'USD'] || '$';

  const strategyMap = useMemo(() => {
    return new Map(strategies.map(s => [s.id, s.name]));
  }, [strategies]);
  
  const filteredTrades = useMemo(() => {
    return trades.filter(trade => {
        const tradeDate = moment(trade.entryDate.toDate());
        
        if (dateFilterType === 'month') {
            if(!filterYear || !filterMonth) return true;
            if (tradeDate.year() !== parseInt(filterYear) || (tradeDate.month() + 1) !== parseInt(filterMonth)) {
                return false;
            }
        } else if (dateFilterType === 'period') {
            const start = filterStartDate ? moment(filterStartDate).startOf('day') : null;
            const end = filterEndDate ? moment(filterEndDate).endOf('day') : null;
            if (start && tradeDate.isBefore(start)) return false;
            if (end && tradeDate.isAfter(end)) return false;
        }

        if (filterStrategy !== 'all' && trade.strategyId !== filterStrategy) return false;
        if (filterOutcome === 'win' && trade.profitOrLoss <= 0) return false;
        if (filterOutcome === 'loss' && trade.profitOrLoss > 0) return false;
        if (filterSymbol && !trade.symbol.toUpperCase().includes(filterSymbol.toUpperCase())) return false;


        return true;
    });
  }, [trades, dateFilterType, filterMonth, filterYear, filterStartDate, filterEndDate, filterStrategy, filterOutcome, filterSymbol]);

  const resetFilters = () => {
      setDateFilterType('all');
      setFilterMonth(moment().format('M'));
      setFilterYear(moment().format('YYYY'));
      setFilterStartDate('');
      setFilterEndDate('');
      setFilterStrategy('all');
      setFilterOutcome('all');
      setFilterSymbol('');
  };
  
   const availableYears = useMemo(() => {
        if (trades.length === 0) return [moment().year().toString()];
        const years = new Set(trades.map(t => moment(t.entryDate.toDate()).year()));
        return Array.from(years).sort((a,b) => b-a).map(String);
    }, [trades]);

   const handleExport = () => {
    const dataToExport = filteredTrades.map(t => ({
        Symbol: t.symbol,
        Strategy: t.strategyId ? strategyMap.get(t.strategyId) : 'N/A',
        'Entry Date': moment(t.entryDate.toDate()).format('YYYY-MM-DD HH:mm'),
        'Entry Price': t.entryPrice,
        'Exit Price': t.exitPrice,
        Quantity: t.quantity,
        'P/L': t.profitOrLoss.toFixed(2),
        Notes: t.notes?.map(n => `${moment(n.date.toDate()).format('YYYY-MM-DD')}: ${n.text}`).join(' | ') || ''
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Trades');
    XLSX.writeFile(workbook, 'trade_history.xlsx');
    toast({ title: 'Exporting data...' });
  };


  return (
    <>
      <div className="space-y-4">
        <Card>
            <CardHeader><CardTitle>Filters & Export</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col space-y-1.5">
                    <Label>Date Filter</Label>
                    <Select value={dateFilterType} onValueChange={(v: 'all' | 'month' | 'period') => setDateFilterType(v)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="month">By Month</SelectItem>
                            <SelectItem value="period">By Period</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {dateFilterType === 'month' && (
                    <>
                        <div className="flex flex-col space-y-1.5">
                            <Label>Month</Label>
                            <Select value={filterMonth} onValueChange={setFilterMonth}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {moment.months().map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label>Year</Label>
                            <Select value={filterYear} onValueChange={setFilterYear}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}

                 {dateFilterType === 'period' && (
                    <>
                        <div className="flex flex-col space-y-1.5">
                            <Label>Start Date</Label>
                            <Input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                        </div>
                        <div className="flex flex-col space-y-1.5">
                            <Label>End Date</Label>
                            <Input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
                        </div>
                    </>
                )}
                 <div className="flex flex-col space-y-1.5">
                    <Label>Symbol</Label>
                    <Input 
                        placeholder="e.g. AAPL"
                        value={filterSymbol}
                        onChange={(e) => setFilterSymbol(e.target.value)}
                    />
                </div>
                 <div className="flex flex-col space-y-1.5">
                    <Label>Strategy</Label>
                    <Select value={filterStrategy} onValueChange={setFilterStrategy}>
                        <SelectTrigger><SelectValue placeholder="All Strategies" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Strategies</SelectItem>
                            {strategies.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex flex-col space-y-1.5">
                    <Label>Outcome</Label>
                    <Select value={filterOutcome} onValueChange={setFilterOutcome}>
                        <SelectTrigger><SelectValue placeholder="All Outcomes" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Outcomes</SelectItem>
                            <SelectItem value="win">Wins</SelectItem>
                            <SelectItem value="loss">Losses</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="flex gap-2">
                    <Button onClick={resetFilters} variant="outline" className="w-full">Reset</Button>
                    <Button onClick={handleExport} className="w-full"><FileDown className="mr-2 h-4 w-4" /> Export</Button>
                </div>
            </CardContent>
        </Card>
      
        <div className="border rounded-lg">
            <TooltipProvider>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead>Strategy</TableHead>
                <TableHead>Entry Date</TableHead>
                <TableHead>Entry Price</TableHead>
                <TableHead>Exit Price</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>P/L</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Chart</TableHead>
                <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {filteredTrades.map((trade) => (
                <TableRow key={trade.id}>
                    <TableCell className="font-medium">{trade.symbol}</TableCell>
                    <TableCell>{trade.strategyId ? strategyMap.get(trade.strategyId) : '-'}</TableCell>
                    <TableCell>{moment(trade.entryDate.toDate()).format('YYYY-MM-DD HH:mm')}</TableCell>
                    <TableCell>{currencySymbol}{trade.entryPrice.toFixed(2)}</TableCell>
                    <TableCell>{currencySymbol}{trade.exitPrice.toFixed(2)}</TableCell>
                    <TableCell>{trade.quantity}</TableCell>
                    <TableCell className={cn(trade.profitOrLoss >= 0 ? 'text-green-600' : 'text-destructive')}>
                        {currencySymbol}{trade.profitOrLoss.toFixed(2)}
                    </TableCell>
                    <TableCell>
                        {trade.notes && trade.notes.length > 0 && (
                             <Tooltip>
                                <TooltipTrigger>
                                    <StickyNote className="h-4 w-4 cursor-pointer"/>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-bold">{moment(trade.notes[trade.notes.length - 1].date.toDate()).format('YYYY-MM-DD')}</p>
                                    <p>{trade.notes[trade.notes.length - 1].text}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </TableCell>
                    <TableCell>
                    {trade.chartUrl && (
                        <a href={trade.chartUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon">
                            <LineChart className="h-4 w-4 text-blue-500" />
                        </Button>
                        </a>
                    )}
                    </TableCell>
                    <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={() => setEditingTrade(trade)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4"/> Delete
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This will permanently delete the trade for {trade.symbol}.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onDeleteTrade(trade.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
            </TooltipProvider>
            {filteredTrades.length === 0 && <p className="text-center text-muted-foreground p-8">No trades recorded for the selected filters.</p>}
        </div>
      </div>
      {editingTrade && (
          <AddTradeDialog
            isOpen={!!editingTrade}
            onOpenChange={(open) => !open && setEditingTrade(null)}
            trade={editingTrade}
            strategies={strategies}
        />
      )}
    </>
  );
}
