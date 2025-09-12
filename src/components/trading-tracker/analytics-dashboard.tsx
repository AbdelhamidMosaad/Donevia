
'use client';

import { useMemo } from 'react';
import type { Trade } from '@/lib/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { TrendingUp, TrendingDown, Ratio } from 'lucide-react';

interface AnalyticsDashboardProps {
  trades: Trade[];
}

const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    EGP: 'E£',
};

export function AnalyticsDashboard({ trades }: AnalyticsDashboardProps) {
  const { settings } = useAuth();
  const currencySymbol = currencySymbols[settings.currency || 'USD'] || '$';

  const analytics = useMemo(() => {
    if (trades.length === 0) {
      return {
        winRate: 0,
        totalNetProfit: 0,
        profitFactor: 0,
        averageWin: 0,
        averageLoss: 0,
        equityCurveData: [],
      };
    }
    
    // Sort trades by entry date for equity curve calculation
    const sortedTrades = [...trades].sort((a, b) => a.entryDate.toMillis() - b.entryDate.toMillis());

    const winningTrades = sortedTrades.filter(t => t.profitOrLoss > 0);
    const losingTrades = sortedTrades.filter(t => t.profitOrLoss <= 0);

    const winRate = (winningTrades.length / sortedTrades.length) * 100;
    const totalNetProfit = sortedTrades.reduce((acc, t) => acc + t.profitOrLoss, 0);

    const grossProfit = winningTrades.reduce((acc, t) => acc + t.profitOrLoss, 0);
    const grossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + t.profitOrLoss, 0));
    
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : Infinity;

    const averageWin = winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;

    let cumulativePnl = 0;
    const equityCurveData = sortedTrades.map((trade, index) => {
      cumulativePnl += trade.profitOrLoss;
      return {
        name: `Trade ${index + 1}`,
        equity: cumulativePnl,
      };
    });

    return {
      winRate,
      totalNetProfit,
      profitFactor,
      averageWin,
      averageLoss,
      equityCurveData,
    };
  }, [trades]);
  
  if (trades.length === 0) {
      return (
        <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No data to display. Apply filters or record trades.</p>
        </div>
      );
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Win/Loss Ratio</CardTitle>
                <Ratio className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{analytics.winRate.toFixed(2)}%</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Net Profit</CardTitle>
                 <span className="h-4 w-4 text-muted-foreground font-bold">{currencySymbol}</span>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{analytics.totalNetProfit.toFixed(2)}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{isFinite(analytics.profitFactor) ? analytics.profitFactor.toFixed(2) : 'N/A'}</p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Average Win</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground text-green-500" />
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{currencySymbol}{analytics.averageWin.toFixed(2)}</p>
            </CardContent>
        </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Average Loss</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground text-red-500" />
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{currencySymbol}{analytics.averageLoss.toFixed(2)}</p>
            </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Equity Curve</CardTitle>
          <CardDescription>Your account's cumulative profit over time based on the filtered trades.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{}} className="h-[400px] w-full">
            <ResponsiveContainer>
              <LineChart
                data={analytics.equityCurveData}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                    tickFormatter={(value) => `${currencySymbol}${value}`}
                    domain={['auto', 'auto']}
                />
                 <ChartTooltip
                    cursor={{fill: 'hsl(var(--muted))'}}
                    content={<ChartTooltipContent
                        formatter={(value) => `${currencySymbol}${Number(value).toFixed(2)}`}
                        indicator="line"
                    />}
                />
                <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="equity" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
