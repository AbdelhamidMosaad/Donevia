
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Plus, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Label } from '../ui/label';

interface BrainstormingSidePanelProps {
  onAddIdea: (content: string, color: string) => void;
}

const ideaColors = ['#fff176', '#a0d2ff', '#93f5a7', '#ffb8d9', '#d9acff', '#ffadad', '#ffd6a5'];

export function BrainstormingSidePanel({ onAddIdea }: BrainstormingSidePanelProps) {
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState(ideaColors[0]);
  const { toast } = useToast();

  const handleAddClick = () => {
    if (content.trim()) {
      onAddIdea(content, selectedColor);
      setContent('');
    } else {
      toast({
          variant: 'destructive',
          title: 'Idea content cannot be empty.',
      })
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddClick();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Capture</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="idea-content">Your Idea</Label>
          <Textarea
            id="idea-content"
            placeholder="Type your idea here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
          />
        </div>
        <div className="space-y-2">
            <Label className="flex items-center gap-2"><Palette className="h-4 w-4"/>Color</Label>
            <div className="flex flex-wrap gap-2">
                {ideaColors.map(color => (
                    <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        style={{ backgroundColor: color }}
                        className={cn(
                            "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                            selectedColor === color ? 'border-primary ring-2 ring-primary/50' : 'border-transparent'
                        )}
                        aria-label={`Select color ${color}`}
                    />
                ))}
            </div>
        </div>
        <Button onClick={handleAddClick} className="w-full">
          <Plus />
          Add Idea
        </Button>
      </CardContent>
    </Card>
  );
}
