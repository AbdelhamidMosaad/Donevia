
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { WhiteboardNode } from '@/lib/types';
import { cn } from '@/lib/utils';

interface WhiteboardNodeComponentProps {
  node: WhiteboardNode;
  onNodeChange: (nodeId: string, updates: Partial<WhiteboardNode>) => void;
  onDelete: (nodeId: string) => void;
  isSelected: boolean;
  scale: number;
}

export function WhiteboardNodeComponent({ node, onNodeChange, onDelete, isSelected, scale }: WhiteboardNodeComponentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(node.text);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setText(node.text);
  }, [node.text]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = (e.clientX - dragStart.x) / scale;
      const dy = (e.clientY - dragStart.y) / scale;
      onNodeChange(node.id, { x: node.x + dx, y: node.y + dy });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const renderContent = () => {
    switch (node.type) {
      case 'sticky':
      case 'text':
        if (isEditing) {
          return (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => {
                setIsEditing(false);
                if (text !== node.text) {
                  onNodeChange(node.id, { text });
                }
              }}
              className="w-full h-full bg-transparent border-none focus:outline-none resize-none text-center"
              autoFocus
            />
          );
        }
        return <p onDoubleClick={() => setIsEditing(true)}>{node.text}</p>;
      case 'shape':
        // Shape rendering would go here, for now, just a colored box
        return <div className="w-full h-full" />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={nodeRef}
      className={cn(
        "absolute p-2 rounded-md shadow-lg flex items-center justify-center transition-all duration-100",
        isSelected ? 'ring-2 ring-primary ring-offset-2' : 'ring-1 ring-gray-300',
        isDragging && 'cursor-grabbing shadow-2xl'
      )}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        transform: `translate(-50%, -50%) rotate(${node.rotation || 0}deg)`,
        backgroundColor: node.color,
        color: '#000000', // Assuming black text for now for simplicity
        cursor: 'grab'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {renderContent()}
    </div>
  );
}
