
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
import { Input } from '@/components/ui/input';
import { MoreHorizontal, Edit, Trash2, FileDown, Users, PlusCircle } from 'lucide-react';
import type { Client } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { deleteClient } from '@/lib/crm';
import { useRouter } from 'next/navigation';
import { ClientDialog } from './client-dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '../ui/alert-dialog';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';


interface ClientListProps {
  clients: Client[];
}

export function ClientList({ clients }: ClientListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const lowercasedQuery = searchQuery.toLowerCase();
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(lowercasedQuery) ||
        client.company?.toLowerCase().includes(lowercasedQuery) ||
        client.email?.toLowerCase().includes(lowercasedQuery)
    );
  }, [clients, searchQuery]);

  const handleEdit = (client: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(client);
  };
  
  const handleDelete = async (clientId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteClient(user.uid, clientId);
      toast({ title: 'Client deleted successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error deleting client' });
    }
  };
  
  const handleExport = () => {
    const dataToExport = filteredClients.map(c => ({
        Company: c.company,
        'Contact Person': c.name,
        Email: c.email,
        Phone: c.phone,
        Created: c.createdAt ? c.createdAt.toDate().toLocaleDateString() : 'N/A'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");
    XLSX.writeFile(workbook, "clients.xlsx");
  };

  return (
    <>
      <Card className="h-full flex flex-col">
          <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6"/> All Contacts</CardTitle>
                    <CardDescription>A list of all your clients.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-xs"
                    />
                    <Button variant="outline" onClick={handleExport}><FileDown /> Export</Button>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                        <PlusCircle/>
                        New Client
                    </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="border rounded-lg">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                        <TableRow
                        key={client.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/crm/clients/${client.id}`)}
                        >
                        <TableCell className="font-medium">{client.company}</TableCell>
                        <TableCell>{client.name}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={(e) => handleEdit(client, e)}>
                            <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete the client "{client.name}".</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={(e) => handleDelete(client.id, e)} variant="destructive">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                        No clients found.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
          </CardContent>
      </Card>
      <ClientDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
      <ClientDialog client={editingClient} open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)} />
    </>
  );
}
