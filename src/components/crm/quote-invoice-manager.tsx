
'use client';

import { useState } from 'react';
import type { Client, Quotation, Invoice, Attachment } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { updateClient } from '@/lib/crm';
import { Button } from '../ui/button';
import { PlusCircle, Paperclip, Trash2, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import moment from 'moment';
import { useDropzone } from 'react-dropzone';
import { getAuth } from 'firebase/auth';

type DocumentType = 'quotation' | 'invoice';

const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    EGP: 'E£',
};

interface QuoteInvoiceManagerProps {
  type: DocumentType;
  client: Client;
}

export function QuoteInvoiceManager({ type, client }: QuoteInvoiceManagerProps) {
  const { user, settings } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<(Quotation | Invoice)[]>(client[type === 'quotation' ? 'quotations' : 'invoices'] || []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Quotation | Invoice | null>(null);
  
  const title = type === 'quotation' ? 'Quotations' : 'Invoices';
  const itemTitle = type === 'quotation' ? 'Quotation' : 'Invoice';
  const currencySymbol = currencySymbols[settings.currency || 'USD'] || '$';

  const handleSave = async (updatedItems: (Quotation | Invoice)[]) => {
    if (!user) return;
    try {
      const key = type === 'quotation' ? 'quotations' : 'invoices';
      await updateClient(user.uid, client.id, { [key]: updatedItems });
      setItems(updatedItems);
      toast({ title: `${itemTitle}s updated.` });
      setIsDialogOpen(false);
      setEditingItem(null);
    } catch (e) {
      toast({ variant: 'destructive', title: `Error updating ${itemTitle}s.` });
    }
  };

  const handleAddNew = () => {
    setEditingItem(type === 'quotation' ? {
      id: uuidv4(),
      quoteNumber: '',
      amount: 0,
      status: 'Draft',
      createdAt: Timestamp.now(),
      attachments: []
    } : {
      id: uuidv4(),
      invoiceNumber: '',
      amount: 0,
      status: 'Draft',
      dueDate: Timestamp.now(),
      createdAt: Timestamp.now(),
      attachments: []
    });
    setIsDialogOpen(true);
  };
  
  const handleEdit = (item: Quotation | Invoice) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    handleSave(updatedItems);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Manage {type}s for this client.</CardDescription>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" /> New {itemTitle}
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{itemTitle} #</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Attachments</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id}>
                <TableCell>{'quoteNumber' in item ? item.quoteNumber : item.invoiceNumber}</TableCell>
                <TableCell>{currencySymbol}{item.amount.toFixed(2)}</TableCell>
                <TableCell>{item.status}</TableCell>
                <TableCell>{'dueDate' in item ? `Due: ${moment(item.dueDate.toDate()).format('YYYY-MM-DD')}`: `Created: ${moment(item.createdAt.toDate()).format('YYYY-MM-DD')}`}</TableCell>
                <TableCell>{item.attachments.length}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>Edit</Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(item.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {items.length === 0 && <p className="text-center text-muted-foreground p-4">No {type}s found.</p>}
      </CardContent>
      
      {isDialogOpen && editingItem && (
        <EditDialog 
          isOpen={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          item={editingItem}
          type={type}
          client={client}
          onSave={(itemToSave) => {
            const existing = items.find(i => i.id === itemToSave.id);
            if (existing) {
              handleSave(items.map(i => i.id === itemToSave.id ? itemToSave : i));
            } else {
              handleSave([...items, itemToSave]);
            }
          }}
        />
      )}
    </Card>
  );
}

function EditDialog({ isOpen, onOpenChange, item, type, client, onSave }: any) {
  const [formData, setFormData] = useState(item);
  const [files, setFiles] = useState<File[]>([]);
  const { toast } = useToast();
  const { settings } = useAuth();
  
  const currencySymbol = currencySymbols[settings.currency || 'USD'] || '$';

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => setFiles(prev => [...prev, ...acceptedFiles]),
  });

  const handleUploadAndSave = async () => {
    const auth = getAuth();
    if (!auth.currentUser) {
        toast({ variant: 'destructive', title: 'Not authenticated!' });
        return;
    }
    
    let updatedItem = { ...formData };
    
    if (files.length > 0) {
        const idToken = await auth.currentUser.getIdToken();
        const uploadPromises = files.map(async file => {
            const body = new FormData();
            body.append('file', file);
            body.append('idToken', idToken);
            body.append('clientId', client.id);

            const res = await fetch('/api/crm/upload', {
              method: 'POST',
              body,
            });
            if (!res.ok) throw new Error('Upload failed');
            const result = await res.json();
            return {
                id: uuidv4(),
                filename: result.filename,
                url: result.url,
                mimeType: result.mimeType,
                size: result.size,
                uploadedAt: Timestamp.now()
            };
        });
        
        try {
            const newAttachments = await Promise.all(uploadPromises);
            updatedItem.attachments = [...(updatedItem.attachments || []), ...newAttachments];
        } catch(e) {
            toast({ variant: 'destructive', title: 'File upload failed', description: (e as Error).message });
            return;
        }
    }
    onSave(updatedItem);
  }
  
  const handleRemoveAttachment = (attachmentId: string) => {
      setFormData((prev: any) => ({
          ...prev,
          attachments: prev.attachments.filter((a: Attachment) => a.id !== attachmentId)
      }));
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item.id ? 'Edit' : 'New'} {type === 'quotation' ? 'Quotation' : 'Invoice'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">{type === 'quotation' ? 'Quote #' : 'Invoice #'}</Label>
            <Input className="col-span-3" value={'quoteNumber' in formData ? formData.quoteNumber : formData.invoiceNumber} onChange={(e) => setFormData({...formData, [type === 'quotation' ? 'quoteNumber' : 'invoiceNumber']: e.target.value})} />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Amount ({currencySymbol})</Label>
            <Input className="col-span-3" type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Status</Label>
             <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
               <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
               <SelectContent>
                 {type === 'quotation' ? 
                  ['Draft', 'Sent', 'Accepted', 'Rejected'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>) :
                  ['Draft', 'Sent', 'Paid', 'Overdue'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)
                 }
               </SelectContent>
             </Select>
          </div>
          {type === 'invoice' && (
             <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Due Date</Label>
              <Input className="col-span-3" type="date" value={moment(formData.dueDate.toDate()).format('YYYY-MM-DD')} onChange={(e) => setFormData({...formData, dueDate: Timestamp.fromDate(new Date(e.target.value))})} />
            </div>
          )}

           <div>
              <Label>Attachments</Label>
              <div {...getRootProps()} className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${isDragActive ? 'border-primary bg-primary/10' : 'border-border'}`}>
                <input {...getInputProps()} />
                <p>Drag 'n' drop some files here, or click to select files</p>
              </div>
              <ul className="mt-2 space-y-1">
                {[...(formData.attachments || []), ...files.map(f => ({id: f.name, filename: f.name, isNew: true}))].map((att: any, index) => (
                    <li key={index} className="text-sm flex items-center justify-between bg-muted/50 p-1 rounded">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        <span>{att.filename}</span>
                        {att.isNew && <span className="text-xs text-blue-500">(new)</span>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveAttachment(att.id)}><Trash2 className="h-4 w-4" /></Button>
                    </li>
                ))}
              </ul>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="secondary">Cancel</Button></DialogClose>
          <Button onClick={handleUploadAndSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
