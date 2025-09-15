
'use client';

import { useState } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';

interface AddSettingItemProps {
  type: 'appointmentOptions' | 'categoryOptions' | 'customerOptions';
  onAdd: (type: 'appointmentOptions' | 'categoryOptions' | 'customerOptions', value: string) => void;
}

export function AddSettingItem({ type, onAdd }: AddSettingItemProps) {
  const [value, setValue] = useState('');

  const handleAdd = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (value.trim()) {
      onAdd(type, value.trim());
      setValue('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
      if(e.key === 'Enter') {
          e.stopPropagation();
          e.preventDefault();
          handleAdd();
      }
  }

  return (
    <div className="flex items-center gap-2 p-2">
      <Input
        placeholder="Add new..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-8"
        onClick={(e) => e.stopPropagation()} // Prevent closing the dropdown
      />
      <Button size="icon" className="h-8 w-8" onClick={handleAdd} disabled={!value.trim()}>
        <Plus />
      </Button>
    </div>
  );
}
