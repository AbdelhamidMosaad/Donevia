
'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Calculator, PlusCircle, Trash2, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';

interface Purchase {
  id: number;
  shares: number;
  price: number;
}

const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    EGP: 'E£',
};

export function StockAverageCalculator() {
    const { settings } = useAuth();
    const currencySymbol = currencySymbols[settings.currency || 'USD'] || '$';

    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [shares, setShares] = useState('');
    const [price, setPrice] = useState('');
    
    const handleAddPurchase = () => {
        const numShares = parseFloat(shares);
        const numPrice = parseFloat(price);

        if (numShares > 0 && numPrice > 0) {
            setPurchases([...purchases, { id: Date.now(), shares: numShares, price: numPrice }]);
            setShares('');
            setPrice('');
        }
    };

    const handleRemovePurchase = (id: number) => {
        setPurchases(purchases.filter(p => p.id !== id));
    };
    
    const handleClearAll = () => {
        setPurchases([]);
        setShares('');
        setPrice('');
    }

    const { totalShares, totalCost, averagePrice } = useMemo(() => {
        const totalShares = purchases.reduce((acc, p) => acc + p.shares, 0);
        const totalCost = purchases.reduce((acc, p) => acc + (p.shares * p.price), 0);
        const averagePrice = totalShares > 0 ? totalCost / totalShares : 0;
        return { totalShares, totalCost, averagePrice };
    }, [purchases]);

  return (
    <div className="grid md:grid-cols-2 gap-6 items-start">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calculator /> Stock Average Calculator</CardTitle>
                <CardDescription>Enter your individual stock purchases to calculate the average cost per share.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="shares">Number of Shares</Label>
                        <Input id="shares" type="number" placeholder="e.g., 10" value={shares} onChange={e => setShares(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="price">Price per Share ({currencySymbol})</Label>
                        <Input id="price" type="number" placeholder="e.g., 150.25" value={price} onChange={e => setPrice(e.target.value)} />
                    </div>
                </div>
                 <Button onClick={handleAddPurchase} className="w-full">
                    <PlusCircle />
                    Add Purchase
                </Button>
            </CardContent>
             <CardFooter>
                <div className="w-full space-y-4 p-6 bg-muted rounded-lg text-center">
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Shares</p>
                            <p className="text-2xl font-bold">{totalShares}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Cost</p>
                            <p className="text-2xl font-bold">{currencySymbol}{totalCost.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Average Price</p>
                            <p className="text-2xl font-bold text-primary">{currencySymbol}{averagePrice.toFixed(4)}</p>
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card>
        <Card>
             <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Purchase History</CardTitle>
                        <CardDescription>A list of all entered purchases.</CardDescription>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={purchases.length === 0}>
                        <XCircle /> Clear All
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Shares</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Cost</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {purchases.length > 0 ? purchases.map(p => (
                             <TableRow key={p.id}>
                                <TableCell>{p.shares}</TableCell>
                                <TableCell>{currencySymbol}{p.price.toFixed(2)}</TableCell>
                                <TableCell>{currencySymbol}{(p.shares * p.price).toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleRemovePurchase(p.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">No purchases added yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
