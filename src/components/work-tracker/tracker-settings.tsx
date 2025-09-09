
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
import type { WorkTrackerSettingItem, WorkTrackerSettings as WorkTrackerSettingsType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { v4 as uuidv4 } from 'uuid';

const colorPalette = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FED766", "#2AB7CA", "#F0CF65", "#9B59B6", "#3498DB", "#1ABC9C", "#E74C3C"];

interface WorkTrackerSettingsProps {
  settings: WorkTrackerSettingsType;
}

export function WorkTrackerSettings({ settings: initialSettings }: WorkTrackerSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [newValues, setNewValues] = useState({
    appointmentOptions: '',
    categoryOptions: '',
    customerOptions: '',
  });

  useEffect(() => {
    if (isOpen) {
      setSettings(initialSettings);
    }
  }, [initialSettings, isOpen]);

  const handleAddItem = (type: 'appointmentOptions' | 'categoryOptions' | 'customerOptions') => {
    const key = type as keyof typeof newValues;
    const value = newValues[key].trim();
    if (!value) return;
    
    if(settings[type]?.some(item => item.value === value)) {
        toast({ variant: 'destructive', title: "Item already exists" });
        return;
    }

    const newItem: WorkTrackerSettingItem = {
      id: uuidv4(),
      value,
      color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
    };

    const updatedSettings = {
        ...settings,
        [type]: [...(settings[type] || []), newItem]
    };
    setSettings(updatedSettings);
    setNewValues(prev => ({...prev, [key]: ''}));
  };
  
  const handleDeleteItem = (type: 'appointmentOptions' | 'categoryOptions' | 'customerOptions', itemToDeleteId: string) => {
    const updatedSettings = {
        ...settings,
        [type]: settings[type]?.filter(item => item.id !== itemToDeleteId)
    };
    setSettings(updatedSettings);
  };
  
  const handleColorChange = (type: 'appointmentOptions' | 'categoryOptions' | 'customerOptions', itemId: string, newColor: string) => {
    const updatedSettings = {
        ...settings,
        [type]: settings[type]?.map(item => item.id === itemId ? { ...item, color: newColor } : item)
    };
    setSettings(updatedSettings);
  };

  const handleSave = async () => {
    if(!user) return;
    setIsSaving(true);
    try {
        const settingsRef = doc(db, 'users', user.uid, 'profile', 'workTrackerSettings');
        await setDoc(settingsRef, settings, { merge: true });
        toast({ title: "Settings saved successfully!"});
        setIsOpen(false);
    } catch(e) {
        toast({ variant: 'destructive', title: "Error saving settings" });
    } finally {
        setIsSaving(false);
    }
  }
  
  const renderListEditor = (
      type: 'appointmentOptions' | 'categoryOptions' | 'customerOptions',
      label: string
    ) => {
        const key = type as keyof typeof newValues;
        return (
            <div className="space-y-2">
                <Label>{label}</Label>
                 <ScrollArea className="h-40 border rounded-md p-2">
                    <div className="space-y-1">
                        {settings[type]?.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm p-1 rounded-md hover:bg-muted">
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="color" 
                                        value={item.color} 
                                        onChange={(e) => handleColorChange(type, item.id, e.target.value)} 
                                        className="w-6 h-6 p-0 border-none bg-transparent cursor-pointer"
                                    />
                                    <span>{item.value}</span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteItem(type, item.id)}>
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
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
