
'use client';

import { useState } from 'react';
import type { Client, Quotation, Invoice, CrmAttachment } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { updateClient } from '@/lib/crm';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, PlusCircle, FileText, UploadCloud, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAuth } from 'firebase/auth';

interface QuoteInvoiceManagerProps {
  client: Client;
  type: 'quotations' | 'invoices';
}

type Item = Quotation | Invoice;

async function uploadCrmAttachmentClient(clientId: string, file: File, onProgress: (progress: number) => void) {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('User is not authenticated.');
  
  const token = await user.getIdToken();
  const formData = new FormData();
  formData.append('clientId', clientId);
  formData.append('idToken', token);
  formData.append('file', file, file.name);

  return new Promise<CrmAttachment>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/crm/upload', true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.response);
        resolve({
            id: uuidv4(),
            url: response.url,
            filename: response.filename,
            mimeType: response.mimeType,
            size: response.size,
            uploadedAt: new Date() as any // will be converted to timestamp on save
        });
      } else {
        try {
            const errorData = JSON.parse(xhr.response);
            reject(new Error(errorData.error || 'Failed to upload file.'));
        } catch (e) {
            reject(new Error(`Server error: ${xhr.statusText}`));
        }
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload.'));
    xhr.send(formData);
  });
}


export function QuoteInvoiceManager({ client, type }: QuoteInvoiceManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>(client[type] || []);
  const [uploadingFileId, setUploadingFileId] = useState<string | null>(null);

  const title = type === 'quotations' ? 'Quotations' : 'Invoices';
  const itemTitle = type === 'quotations' ? 'Quotation' : 'Invoice';

  const handleItemChange = (id: string, key: string, value: any) => {
    const newItems = items.map(item =>
      item.id === id ? { ...item, [key]: value } : item
    );
    setItems(newItems);
  };

  const addItem = () => {
    const newItem: Item = {
      id: uuidv4(),
      clientId: client.id,
      quotationNumber: type === 'quotations' ? '' : undefined,
      invoiceNumber: type === 'invoices' ? '' : undefined,
      status: 'draft',
      attachments: [],
      createdAt: new Date() as any, // Temporary
      updatedAt: new Date() as any, // Temporary
    } as Item;
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    // Note: This doesn't delete files from storage. A real implementation would need a backend call.
    setItems(items.filter(item => item.id !== id));
  };
  
  const handleFileUpload = async (itemId: string, file: File) => {
      if(!user) return;
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
         toast({ variant: 'destructive', title: 'File too large', description: `${file.name} exceeds the 10MB limit.`});
         return;
      }
      setUploadingFileId(itemId);
      try {
        const newAttachment = await uploadCrmAttachmentClient(client.id, file, (progress) => {
          // You can use progress for a progress bar if needed
        });
        const newItems = items.map(item =>
            item.id === itemId ? { ...item, attachments: [...item.attachments, newAttachment] } : item
        );
        setItems(newItems);
        toast({ title: 'File uploaded' });
      } catch (error) {
        console.error("Upload failed: ", error);
        toast({ variant: 'destructive', title: 'Upload failed', description: (error as Error).message });
      } finally {
          setUploadingFileId(null);
      }
  };

  const saveItems = async () => {
    if (!user) return;
    try {
      await updateClient(user.uid, client.id, { [type]: items });
      toast({ title: `${title} saved successfully!` });
    } catch (e) {
      console.error(`Error saving ${type}: `, e);
      toast({ variant: 'destructive', title: `Error saving ${title}.` });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Manage {type} for this client.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder={`${itemTitle} Number`}
                  value={(item as any).quotationNumber || (item as any).invoiceNumber || ''}
                  onChange={e => handleItemChange(item.id, type === 'quotations' ? 'quotationNumber' : 'invoiceNumber', e.target.value)}
                  className="font-semibold"
                />
                <Select value={item.status} onValueChange={v => handleItemChange(item.id, 'status', v)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        {type === 'quotations' && <>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </>}
                        {type === 'invoices' && <>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                        </>}
                    </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Attachments</h4>
                <div className="space-y-2">
                    {item.attachments.map(att => (
                        <div key={att.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                            <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                                <FileText className="h-4 w-4 text-primary" />
                                {att.filename}
                            </a>
                             <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Trash2 className="h-3 w-3 text-destructive" />
                             </Button>
                        </div>
                    ))}
                </div>
                <div className="mt-2">
                    <label htmlFor={`file-upload-${item.id}`} className="cursor-pointer inline-flex items-center gap-2 text-sm text-primary hover:underline">
                       {uploadingFileId === item.id ? 
                            <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                            : <><UploadCloud className="h-4 w-4" /> Upload File</>
                       }
                    </label>
                    <input id={`file-upload-${item.id}`} type="file" className="hidden" onChange={(e) => e.target.files && handleFileUpload(item.id, e.target.files[0])}/>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between">
          <Button variant="outline" onClick={addItem}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add {itemTitle}
          </Button>
          <Button onClick={saveItems}>Save {title}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
