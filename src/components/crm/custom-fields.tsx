
'use client';

import { useState } from 'react';
import type { Client, CustomField } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { updateClient } from '@/lib/crm';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, PlusCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

interface CustomFieldsProps {
  client: Client;
}

export function CustomFieldsManager({ client }: CustomFieldsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fields, setFields] = useState<CustomField[]>(client.customFields || []);

  const handleFieldChange = (id: string, key: 'key' | 'value', value: string) => {
    const newFields = fields.map(field =>
      field.id === id ? { ...field, [key]: value } : field
    );
    setFields(newFields);
  };

  const addField = () => {
    setFields([...fields, { id: uuidv4(), key: '', value: '' }]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const saveFields = async () => {
    if (!user) return;
    try {
      await updateClient(user.uid, client.id, { customFields: fields });
      toast({ title: 'Custom fields saved successfully!' });
    } catch (e) {
      console.error("Error saving custom fields: ", e);
      toast({ variant: 'destructive', title: 'Error saving fields.' });
    }
  };

  return (
    <Card>
        <CardHeader>
            <CardTitle>Custom Fields</CardTitle>
            <CardDescription>Add custom data fields for this client.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {fields.map(field => (
                <div key={field.id} className="flex items-center gap-2">
                    <Input
                    placeholder="Key (e.g., Birthday)"
                    value={field.key}
                    onChange={e => handleFieldChange(field.id, 'key', e.target.value)}
                    />
                    <Input
                    placeholder="Value (e.g., 1990-01-01)"
                    value={field.value}
                    onChange={e => handleFieldChange(field.id, 'value', e.target.value)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeField(field.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
                ))}
            </div>
            <div className="mt-4 flex justify-between">
                <Button variant="outline" onClick={addField}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Field
                </Button>
                <Button onClick={saveFields}>Save Fields</Button>
            </div>
        </CardContent>
    </Card>
  );
}
