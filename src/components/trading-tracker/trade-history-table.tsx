'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import type { Trade } from '@/lib/types';
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

interface TradeHistoryTableProps {
  trades: Trade[];
  onDeleteTrade: (tradeId: string) => void;
}

export function TradeHistoryTable({ trades, onDeleteTrade }: TradeHistoryTableProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);


  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Entry Date</TableHead>
              <TableHead>Entry Price</TableHead>
              <TableHead>Exit Price</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>P/L</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => (
              <TableRow key={trade.id}>
                <TableCell className="font-medium">{trade.symbol}</TableCell>
                <TableCell>{moment(trade.entryDate.toDate()).format('YYYY-MM-DD HH:mm')}</TableCell>
                <TableCell>${trade.entryPrice.toFixed(2)}</TableCell>
                <TableCell>${trade.exitPrice.toFixed(2)}</TableCell>
                <TableCell>{trade.quantity}</TableCell>
                <TableCell className={cn(trade.profitOrLoss >= 0 ? 'text-green-600' : 'text-destructive')}>
                    {trade.profitOrLoss.toFixed(2)}
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
        {trades.length === 0 && <p className="text-center text-muted-foreground p-8">No trades recorded yet.</p>}
      </div>
      {editingTrade && (
          <AddTradeDialog
            isOpen={!!editingTrade}
            onOpenChange={(open) => !open && setEditingTrade(null)}
            trade={editingTrade}
        />
      )}
    </>
  );
}
