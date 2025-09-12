
'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { Calculator, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    const [takeProfitPrice, setTakeProfitPrice] = useState(154);

    const currencySymbol = currencySymbols[settings.currency || 'USD'] || '$';

    const { riskPerTrade, positionSize, potentialLoss, potentialProfit, riskRewardRatio } = useMemo(() => {
        const riskAmount = accountSize * (riskPercentage / 100);
        const riskPerShare = entryPrice > 0 && stopLossPrice > 0 ? entryPrice - stopLossPrice : 0;
        
        if (riskPerShare <= 0) {
            return { riskPerTrade: riskAmount, positionSize: 0, potentialLoss: 0, potentialProfit: 0, riskRewardRatio: 0 };
        }

        const size = Math.floor(riskAmount / riskPerShare);
        const totalLoss = size * riskPerShare;
        
        const rewardPerShare = takeProfitPrice > 0 ? takeProfitPrice - entryPrice : 0;
        const totalProfit = size * rewardPerShare;
        
        const ratio = totalLoss > 0 && totalProfit > 0 ? totalProfit / totalLoss : 0;

        return {
            riskPerTrade: riskAmount,
            positionSize: size,
            potentialLoss: totalLoss,
            potentialProfit: totalProfit,
            riskRewardRatio: ratio,
        };
    }, [accountSize, riskPercentage, entryPrice, stopLossPrice, takeProfitPrice]);
    
    const getRatioColor = (ratio: number) => {
        if (ratio >= 2) return 'text-green-600';
        if (ratio >= 1) return 'text-yellow-600';
        return 'text-destructive';
    }


  return (
    <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calculator /> Position Size & Risk Calculator</CardTitle>
                <CardDescription>Calculate your position size and risk/reward based on your account and trade setup.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4 p-6 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold text-lg">Your Parameters</h3>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="account-size">Account Size ({currencySymbol})</Label>
                            <Input id="account-size" type="number" value={accountSize} onChange={e => setAccountSize(Number(e.target.value))} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="risk-percent">Risk per Trade (%)</Label>
                            <Input id="risk-percent" type="number" value={riskPercentage} onChange={e => setRiskPercentage(Number(e.target.value))} />
                        </div>
                    </div>
                     <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="entry-price">Entry Price ({currencySymbol})</Label>
                            <Input id="entry-price" type="number" value={entryPrice} onChange={e => setEntryPrice(Number(e.target.value))} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="stop-loss-price">Stop Loss ({currencySymbol})</Label>
                            <Input id="stop-loss-price" type="number" value={stopLossPrice} onChange={e => setStopLossPrice(Number(e.target.value))} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="take-profit-price">Take Profit ({currencySymbol})</Label>
                            <Input id="take-profit-price" type="number" value={takeProfitPrice} onChange={e => setTakeProfitPrice(Number(e.target.value))} />
                        </div>
                    </div>
                </div>
                <div className="space-y-4 p-6 bg-primary/10 rounded-lg">
                    <h3 className="font-semibold text-lg">Calculated Results</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Max Risk per Trade</p>
                            <p className="text-2xl font-bold">{currencySymbol}{riskPerTrade.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Position Size (Shares)</p>
                            <p className="text-2xl font-bold">{positionSize > 0 ? positionSize : "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Potential Loss</p>
                            <p className="text-2xl font-bold text-destructive">{currencySymbol}{potentialLoss.toFixed(2)}</p>
                        </div>
                         <div>
                            <p className="text-sm text-muted-foreground">Potential Profit</p>
                            <p className="text-2xl font-bold text-green-600">{currencySymbol}{potentialProfit.toFixed(2)}</p>
                        </div>
                    </div>
                     <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground">Risk/Reward Ratio</p>
                        <p className={cn("text-4xl font-bold flex items-center gap-2", getRatioColor(riskRewardRatio))}>
                            <TrendingUp />
                            {riskRewardRatio > 0 ? `1 : ${riskRewardRatio.toFixed(2)}` : "N/A"}
                        </p>
                    </div>
                    {positionSize <= 0 && <p className="text-sm text-destructive mt-2">Stop-loss must be below entry price for a long trade.</p>}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

