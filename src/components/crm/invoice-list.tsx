
'use client';

import { useState, useMemo } from 'react';
import type { Invoice, Client } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileDown, Receipt, PlusCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import moment from 'moment';
import { Badge } from '../ui/badge';
import { AddInvoiceDialog } from './add-invoice-dialog';
import { useAuth } from '@/hooks/use-auth';

interface InvoiceListProps {
  allInvoices: (Invoice & { clientName?: string })[];
  clients: Client[];
}

const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    EGP: 'E£',
};

export function InvoiceList({ allInvoices, clients }: InvoiceListProps) {
  const { settings } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const currencySymbol = currencySymbols[settings.currency || 'USD'] || '$';

  const filteredInvoices = useMemo(() => {
    if (!searchQuery) return allInvoices;
    const lowercasedQuery = searchQuery.toLowerCase();
    return allInvoices.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().includes(lowercasedQuery) ||
        invoice.clientName?.toLowerCase().includes(lowercasedQuery) ||
        invoice.status.toLowerCase().includes(lowercasedQuery)
    );
  }, [allInvoices, searchQuery]);

  const handleExport = () => {
    const dataToExport = filteredInvoices.map(i => ({
        'Invoice #': i.invoiceNumber,
        'Client': i.clientName,
        'Amount': i.amount,
        'Status': i.status,
        'Created Date': moment(i.createdAt.toDate()).format('YYYY-MM-DD'),
        'Due Date': moment(i.dueDate.toDate()).format('YYYY-MM-DD'),
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");
    XLSX.writeFile(workbook, "invoices.xlsx");
  };

  return (
    <>
      <Card>
          <CardHeader>
               <div className="flex items-center justify-between gap-4">
                  <div>
                      <CardTitle className="flex items-center gap-2"><Receipt className="h-6 w-6"/> All Invoices</CardTitle>
                      <CardDescription>A list of all invoices across all clients.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                      <Input
                          placeholder="Search invoices..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="max-w-sm"
                      />
                      <Button variant="outline" onClick={handleExport}><FileDown /> Export</Button>
                      <Button onClick={() => setIsAddDialogOpen(true)}>
                          <PlusCircle/> New Invoice
                      </Button>
                  </div>
              </div>
          </CardHeader>
          <CardContent>
               <div className="border rounded-lg">
                  <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created Date</TableHead>
                          <TableHead>Due Date</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredInvoices.length > 0 ? (
                      filteredInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                              <TableCell>{invoice.clientName || 'N/A'}</TableCell>
                              <TableCell>{currencySymbol}{invoice.amount.toFixed(2)}</TableCell>
                              <TableCell>
                                  <Badge variant={invoice.status === 'Paid' ? 'default' : 'secondary'} className={invoice.status === 'Paid' ? 'bg-green-600' : invoice.status === 'Overdue' ? 'bg-destructive' : ''}>
                                      {invoice.status}
                                  </Badge>
                              </TableCell>
                              <TableCell>{moment(invoice.createdAt.toDate()).format('YYYY-MM-DD')}</TableCell>
                              <TableCell>{moment(invoice.dueDate.toDate()).format('YYYY-MM-DD')}</TableCell>
                          </TableRow>
                      ))
                      ) : (
                      <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                          No invoices found.
                          </TableCell>
                      </TableRow>
                      )}
                  </TableBody>
                  </Table>
              </div>
          </CardContent>
      </Card>
      <AddInvoiceDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} clients={clients} />
    </>
  );
}
