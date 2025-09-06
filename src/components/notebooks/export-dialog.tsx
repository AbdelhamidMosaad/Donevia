
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Notebook } from '@/lib/types';
import { useNotebookExporter } from './use-notebook-exporter';
import { Loader2 } from 'lucide-react';

interface ExportDialogProps {
  notebook: Notebook;
  isOpen: boolean;
  onClose: () => void;
}

type ExportFormat = 'json' | 'markdown';

export function ExportDialog({ notebook, isOpen, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const { exportNotebook, isExporting } = useNotebookExporter();

  const handleExport = async () => {
    await exportNotebook(notebook, format);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Notebook</DialogTitle>
          <DialogDescription>
            Export "{notebook.title}" to your local machine.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label>Select Export Format</Label>
          <RadioGroup
            value={format}
            onValueChange={(value: ExportFormat) => setFormat(value)}
            className="mt-2 space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="markdown" id="markdown" />
              <Label htmlFor="markdown">Markdown (.md)</Label>
            </div>
             <div className="flex items-center space-x-2">
              <RadioGroupItem value="json" id="json" />
              <Label htmlFor="json">JSON (.json)</Label>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
                <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Exporting...
                </>
            ) : (
                'Export'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
