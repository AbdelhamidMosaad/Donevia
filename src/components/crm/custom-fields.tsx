
'use client';

import { useState } from 'react';
import type { Client, CustomField } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { updateClient } from '@/lib/crm';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';

interface CustomFieldsProps {
  client: Client;
}

export function CustomFields({ client }: CustomFieldsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fields, setFields] = useState<CustomField[]>(client.customFields || []);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  
  const handleSaveFields = async (updatedFields: CustomField[]) => {
    if (!user) return;
    try {
      await updateClient(user.uid, client.id, { customFields: updatedFields });
      setFields(updatedFields); // This might be redundant if parent component state is updated
      toast({ title: 'Custom fields updated.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Error updating fields.' });
    }
  };

  const handleAddField = () => {
    if (!newFieldKey.trim()) return;
    const newField: CustomField = {
      id: uuidv4(),
      key: newFieldKey,
      value: newFieldValue,
    };
    handleSaveFields([...fields, newField]);
    setNewFieldKey('');
    setNewFieldValue('');
  };
  
  const handleDeleteField = (fieldId: string) => {
    const updatedFields = fields.filter(f => f.id !== fieldId);
    handleSaveFields(updatedFields);
  }
  
  const handleFieldValueChange = (fieldId: string, value: string) => {
      const updatedFields = fields.map(f => f.id === fieldId ? { ...f, value } : f);
      setFields(updatedFields);
  }
  
  const handleFieldBlur = (fieldId: string, value: string) => {
      // Only save on blur to avoid excessive writes while typing
      const field = fields.find(f => f.id === fieldId);
      if (field && field.value !== value) {
          handleSaveFields(fields);
      }
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Fields</CardTitle>
        <CardDescription>Add custom data points for this client.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="flex items-center gap-2">
                <Input value={field.key} readOnly className="font-semibold bg-muted/50" />
                <Input 
                    value={field.value} 
                    onChange={(e) => handleFieldValueChange(field.id, e.target.value)} 
                    onBlur={(e) => handleFieldBlur(field.id, e.target.value)}
                />
                <Button variant="ghost" size="icon" onClick={() => handleDeleteField(field.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
          ))}
          <div className="flex items-end gap-2 border-t pt-4">
            <div className="flex-1">
              <label className="text-sm font-medium">New Field Name</label>
              <Input value={newFieldKey} onChange={(e) => setNewFieldKey(e.target.value)} placeholder="e.g., VAT Number" />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium">New Field Value</label>
              <Input value={newFieldValue} onChange={(e) => setNewFieldValue(e.target.value)} placeholder="Value" />
            </div>
            <Button onClick={handleAddField}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Field
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
