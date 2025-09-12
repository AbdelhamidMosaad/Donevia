
'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { Calculator } from 'lucide-react';

const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    EGP: 'E£',
};

export function RiskManagementDashboard() {
    const { settings } = useAuth();
    const [accountSize, setAccountSize] = useState(10000);
    const [riskPercentage, setRiskPercentage] = useState(1);
    const [entryPrice, setEntryPrice] = useState(150);
    const [stopLossPrice, setStopLossPrice] = useState(148);

    const currencySymbol = currencySymbols[settings.currency || 'USD'] || '$';

    const { riskPerTrade, positionSize, potentialLoss } = useMemo(() => {
        const riskAmount = accountSize * (riskPercentage / 100);
        const riskPerShare = entryPrice - stopLossPrice;
        
        if (riskPerShare <= 0) {
            return { riskPerTrade: riskAmount, positionSize: 0, potentialLoss: 0 };
        }

        const size = Math.floor(riskAmount / riskPerShare);
        const totalLoss = size * riskPerShare;

        return {
            riskPerTrade: riskAmount,
            positionSize: size,
            potentialLoss: totalLoss
        };
    }, [accountSize, riskPercentage, entryPrice, stopLossPrice]);

  return (
    <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calculator /> Position Size & Risk Calculator</CardTitle>
                <CardDescription>Calculate your position size based on your account risk and trade setup.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4 p-6 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold text-lg">Your Parameters</h3>
                    <div className="space-y-2">
                        <Label htmlFor="account-size">Account Size ({currencySymbol})</Label>
                        <Input id="account-size" type="number" value={accountSize} onChange={e => setAccountSize(Number(e.target.value))} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="risk-percent">Risk per Trade (%)</Label>
                        <Input id="risk-percent" type="number" value={riskPercentage} onChange={e => setRiskPercentage(Number(e.target.value))} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="entry-price">Entry Price ({currencySymbol})</Label>
                        <Input id="entry-price" type="number" value={entryPrice} onChange={e => setEntryPrice(Number(e.target.value))} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="stop-loss-price">Stop Loss Price ({currencySymbol})</Label>
                        <Input id="stop-loss-price" type="number" value={stopLossPrice} onChange={e => setStopLossPrice(Number(e.target.value))} />
                    </div>
                </div>
                <div className="space-y-6 p-6 bg-primary/10 rounded-lg">
                    <h3 className="font-semibold text-lg">Calculated Results</h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Maximum Risk per Trade</p>
                            <p className="text-2xl font-bold">{currencySymbol}{riskPerTrade.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Calculated Position Size (Shares)</p>
                            <p className="text-2xl font-bold">{positionSize > 0 ? positionSize : "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Potential Loss on this Trade</p>
                            <p className="text-2xl font-bold text-destructive">{currencySymbol}{potentialLoss.toFixed(2)}</p>
                        </div>
                        {positionSize <= 0 && <p className="text-sm text-destructive">Stop-loss must be below entry price for a long trade.</p>}
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

