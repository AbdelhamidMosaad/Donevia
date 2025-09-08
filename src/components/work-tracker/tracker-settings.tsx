
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, PlusCircle, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkTrackerSettings as WorkTrackerSettingsType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';

interface WorkTrackerSettingsProps {
  settings: WorkTrackerSettingsType;
}

export function WorkTrackerSettings({ settings: initialSettings }: WorkTrackerSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [newValues, setNewValues] = useState({
    appointment: '',
    category: '',
    customer: '',
  });

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings, isOpen]);

  const handleAddItem = (type: 'appointmentOptions' | 'categoryOptions' | 'customerOptions') => {
    const key = type.replace('Options', '') as keyof typeof newValues;
    const value = newValues[key].trim();
    if (!value) return;
    
    if(settings[type]?.includes(value)) {
        toast({ variant: 'destructive', title: "Item already exists" });
        return;
    }

    const updatedSettings = {
        ...settings,
        [type]: [...(settings[type] || []), value]
    };
    setSettings(updatedSettings);
    setNewValues(prev => ({...prev, [key]: ''}));
  };
  
  const handleDeleteItem = (type: 'appointmentOptions' | 'categoryOptions' | 'customerOptions', itemToDelete: string) => {
    const updatedSettings = {
        ...settings,
        [type]: settings[type]?.filter(item => item !== itemToDelete)
    };
    setSettings(updatedSettings);
  };
  
  const handleSave = async () => {
    if(!user) return;
    try {
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'workTrackerSettings');
        await setDoc(settingsRef, settings, { merge: true });
        toast({ title: "Settings saved successfully!"});
        setIsOpen(false);
    } catch(e) {
        toast({ variant: 'destructive', title: "Error saving settings" });
    }
  }
  
  const renderListEditor = (
      type: 'appointmentOptions' | 'categoryOptions' | 'customerOptions',
      label: string
    ) => {
        const key = type.replace('Options', '') as keyof typeof newValues;
        return (
            <div className="space-y-2">
                <Label>{label}</Label>
                 <ScrollArea className="h-40 border rounded-md p-2">
                    <div className="space-y-1">
                        {settings[type]?.map((item) => (
                            <div key={item} className="flex items-center justify-between text-sm p-1 rounded-md hover:bg-muted">
                                <span>{item}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteItem(type, item)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="flex gap-2">
                    <Input
                        value={newValues[key]}
                        onChange={(e) => setNewValues(prev => ({...prev, [key]: e.target.value}))}
                        placeholder={`New ${label.slice(0,-1)}...`}
                    />
                    <Button variant="outline" size="icon" onClick={() => handleAddItem(type)}>
                        <PlusCircle className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Work Tracker Settings</DialogTitle>
          <DialogDescription>
            Manage the options for your dropdown menus.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-3 gap-6 py-4">
            {renderListEditor('appointmentOptions', 'Appointments')}
            {renderListEditor('categoryOptions', 'Categories')}
            {renderListEditor('customerOptions', 'Customers')}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
