
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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { WhiteboardTemplate } from '@/lib/types';
import { collection, onSnapshot, query, getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Save } from 'lucide-react';

interface TemplateDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveTemplate: (name: string) => Promise<void>;
  onUseTemplate: (template: WhiteboardTemplate) => Promise<void>;
}

export function TemplateDialog({
  isOpen,
  onOpenChange,
  onSaveTemplate,
  onUseTemplate,
}: TemplateDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newTemplateName, setNewTemplateName] = useState('');
  const [templates, setTemplates] = useState<WhiteboardTemplate[]>([]);

  useEffect(() => {
    if (user && isOpen) {
      const templatesRef = collection(db, 'users', user.uid, 'whiteboardTemplates');
      const q = query(templatesRef);
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setTemplates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WhiteboardTemplate)));
      });
      return () => unsubscribe();
    }
  }, [user, isOpen]);

  const handleSave = async () => {
    if (!newTemplateName.trim()) {
      toast({ variant: 'destructive', title: 'Template name is required.' });
      return;
    }
    await onSaveTemplate(newTemplateName);
    setNewTemplateName('');
  };

  const handleUse = async (templateId: string) => {
      const template = templates.find(t => t.id === templateId);
      if(template) {
        await onUseTemplate(template);
        onOpenChange(false);
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Whiteboard Templates</DialogTitle>
          <DialogDescription>
            Save the current board as a new template or apply an existing one.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
            <div>
                <h4 className="font-semibold mb-2">My Templates</h4>
                <div className="space-y-2">
                    {templates.length > 0 ? templates.map(t => (
                        <div key={t.id} className="flex justify-between items-center bg-muted/50 p-2 rounded-md">
                            <span>{t.name}</span>
                            <Button size="sm" onClick={() => handleUse(t.id)}>Use</Button>
                        </div>
                    )) : <p className="text-sm text-muted-foreground">No saved templates yet.</p>}
                </div>
            </div>
            <div className="space-y-2 border-t pt-4">
                 <h4 className="font-semibold">Save Current Board as Template</h4>
                 <div className="flex items-center gap-2">
                    <Input
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="New template name..."
                    />
                    <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" /> Save
                    </Button>
                 </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

