'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { WhiteboardNode } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Rnd } from 'react-rnd';

interface WhiteboardNodeComponentProps {
  node: WhiteboardNode;
  onNodeChange: (nodeId: string, updates: Partial<WhiteboardNode>) => void;
  onDelete: (nodeId: string) => void;
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
  scale: number;
}

export function WhiteboardNodeComponent({ node, onNodeChange, onDelete, isSelected, onSelect, scale }: WhiteboardNodeComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onNodeChange(node.id, { text: e.target.value });
       if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${e.target.scrollHeight}px`;
    }
  }

  const handleDoubleClick = () => {
    if (node.type === 'text' || node.type === 'sticky') {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    // The parent's debounced save will handle persisting the final state.
  };

  const renderContent = () => {
    switch (node.type) {
        case 'pen':
            const pathData = node.points?.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
            return (
                <svg
                    className="absolute"
                    style={{
                        left: -node.x,
                        top: -node.y,
                        width: '100vw', // Arbitrarily large to not clip
                        height: '100vh',
                    }}
                    pointerEvents="none"
                >
                    <path
                        d={pathData}
                        stroke={node.color}
                        strokeWidth={node.strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            )
      case 'sticky':
      case 'text':
        if (isEditing) {
          return (
            <textarea
              ref={textareaRef}
              value={node.text || ''}
              onChange={handleTextChange}
              onBlur={handleBlur}
              className="w-full h-full bg-transparent border-none focus:outline-none resize-none text-center p-2"
              style={{ color: node.color }}
            />
          );
        }
        return <p className="p-2 whitespace-pre-wrap break-words">{node.text}</p>;
      case 'shape':
        if(node.shape === 'circle') {
            return <div className="w-full h-full rounded-full" style={{backgroundColor: node.color, border: `${node.strokeWidth}px solid ${node.strokeColor}`}}/>;
        }
        return <div className="w-full h-full rounded-md" style={{backgroundColor: node.color, border: `${node.strokeWidth}px solid ${node.strokeColor}`}}/>;
      default:
        return null;
    }
  };
  
  if (node.type === 'pen') {
      return renderContent();
  }

  return (
    <Rnd
      size={{ width: node.width, height: node.height }}
      position={{ x: node.x, y: node.y }}
      onDragStart={() => onSelect(node.id)}
      onDragStop={(e, d) => onNodeChange(node.id, { x: d.x, y: d.y })}
      onResizeStop={(e, direction, ref, delta, position) => {
        onNodeChange(node.id, {
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10),
          ...position,
        });
      }}
      scale={scale}
      className={cn(
        "flex items-center justify-center transition-all duration-100",
        isSelected && 'ring-2 ring-primary ring-offset-2 z-10',
        node.type === 'sticky' && 'shadow-lg',
      )}
      style={{
          backgroundColor: node.type === 'sticky' ? node.color : 'transparent',
          color: node.type === 'sticky' ? '#000000' : node.color,
          borderRadius: node.type === 'sticky' || node.shape === 'rectangle' ? '0.5rem' : node.shape === 'circle' ? '50%' : '0'
      }}
      onDoubleClick={handleDoubleClick}
      onClick={() => onSelect(node.id)}
    >
      {renderContent()}
      {isSelected && (
        <Button
            variant="destructive"
            size="icon"
            className="absolute -top-3 -right-3 h-6 w-6 rounded-full z-20"
            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </Rnd>
  );
}
