
'use client';

import React, { useRef, useEffect } from 'react';
import type { WhiteboardNode } from '@/lib/types';
import Rnd from 'react-rnd';

interface WhiteboardNodeComponentProps {
  node: WhiteboardNode;
  isSelected: boolean;
  isEditing: boolean;
  tool: 'select' | 'pen' | 'text' | 'sticky' | 'shape' | 'arrow' | 'connect' | 'image' | 'mindmap';
  onSelect: () => void;
  onDoubleClick: () => void;
  onChange: (newAttrs: Partial<WhiteboardNode>) => void;
  onDragEnd: () => void;
}

export function WhiteboardNodeComponent({
  node,
  isSelected,
  isEditing,
  tool,
  onSelect,
  onDoubleClick,
  onChange,
  onDragEnd,
}: WhiteboardNodeComponentProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    // We use react-rnd for drag and resize, so manual logic is removed.

  }, [node, isSelected, tool]);

  const renderContent = () => {
    switch(node.type) {
        case 'text':
        case 'sticky':
            if (isEditing) {
                return (
                    <textarea 
                        value={node.text || ''} 
                        onChange={(e) => onChange({ text: e.target.value })}
                        onBlur={onDragEnd}
                        className="w-full h-full bg-transparent border-none outline-none resize-none"
                        style={{ color: node.color, fontSize: node.fontSize }}
                        autoFocus
                    />
                );
            }
            return <div style={{ fontSize: node.fontSize, fontWeight: node.isBold ? 'bold' : 'normal' }}>{node.text}</div>
        case 'image':
            return <img src={node.src} alt="whiteboard content" className="w-full h-full object-cover" />;
        case 'pen':
            const pathData = node.points?.reduce((acc, point, i) => {
                const command = i === 0 ? 'M' : 'L';
                return `${acc} ${command} ${point}`;
            }, '');
            return <svg className="w-full h-full overflow-visible"><path d={pathData} stroke={node.color} strokeWidth={node.strokeWidth} fill="none" /></svg>
        default:
            return null;
    }
  }

  return (
    <Rnd
        bounds="parent"
        size={{ width: node.width || 200, height: node.height || 'auto' }}
        position={{ x: node.x, y: node.y }}
        onDragStart={onSelect}
        onDragStop={(e, d) => {
            onChange({ x: d.x, y: d.y });
            onDragEnd();
        }}
        onResizeStart={onSelect}
        onResizeStop={(e, direction, ref, delta, position) => {
          onChange({
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
            ...position,
          });
          onDragEnd();
        }}
        disableDragging={tool !== 'select'}
        enableResizing={isSelected && tool === 'select' ? undefined : {
          bottom: false,
          bottomLeft: false,
          bottomRight: false,
          left: false,
          right: false,
          top: false,
          topLeft: false,
          topRight: false,
        }}
        className={`absolute flex items-center justify-center p-2 rounded-md shadow-lg ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        style={{
            backgroundColor: node.type === 'sticky' ? node.color : 'transparent',
            cursor: tool === 'select' ? 'move' : 'default',
        }}
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
    >
        <div ref={nodeRef} className="w-full h-full">
            {renderContent()}
        </div>
    </Rnd>
  );
}
