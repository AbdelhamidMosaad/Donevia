
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Textarea } from '../ui/textarea';

export function MindMapCustomNode({ data, id, isConnectable }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);
  
  const handleDoubleClick = () => {
      setIsEditing(true);
  }

  const handleBlur = () => {
    setIsEditing(false);
    data.label = label; // This mutates the data object reactflow uses
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleBlur();
      } else if (e.key === 'Escape') {
          handleBlur();
      }
  }

  return (
    <div 
        className="react-flow__node-default" 
        style={{
            background: data.isCentral ? '#6366f1' : '#fff',
            color: data.isCentral ? 'white' : '#333',
            border: data.isCentral ? '2px solid #4f46e5' : '1px solid #9ca3af',
            borderRadius: '12px',
            padding: '10px 20px',
            minWidth: '150px',
            textAlign: 'center',
        }}
        onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
       {isEditing ? (
        <Textarea
          ref={textareaRef}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="nodrag bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-center"
        />
      ) : (
        <div className="font-medium nodrag">{data.label}</div>
      )}
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
}
