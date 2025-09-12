'use client';

import { useState } from 'react';
import type { WatchlistItem } from '@/lib/types';
import { Button } from '../ui/button';
import { PlusCircle, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { deleteWatchlistItem } from '@/lib/trading-tracker';
import { AddWatchlistItemDialog } from './add-watchlist-item-dialog';
import { WatchlistItemCard } from './watchlist-item-card';


interface WatchlistProps {
    items: WatchlistItem[];
}

export function Watchlist({ items }: WatchlistProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    
    const handleDelete = async (itemId: string) => {
        if (!user) return;
        try {
            await deleteWatchlistItem(user.uid, itemId);
            toast({ title: "Removed from watchlist." });
        } catch (e) {
            toast({ variant: 'destructive', title: "Error removing item."});
        }
    }
    
    return (
        <>
            <div className="flex justify-end mb-4">
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Add to Watchlist
                </Button>
            </div>

            {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50">
                    <Eye className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold font-headline">Your Watchlist is Empty</h3>
                    <p className="text-muted-foreground">Add stocks you want to keep an eye on.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map(item => (
                        <WatchlistItemCard 
                            key={item.id}
                            item={item}
                            onDelete={() => handleDelete(item.id)}
                        />
                    ))}
                </div>
            )}
            
            <AddWatchlistItemDialog
                isOpen={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
            />
        </>
    );
}
