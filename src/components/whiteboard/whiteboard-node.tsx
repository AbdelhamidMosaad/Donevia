
'use client';

import React, { useRef, useEffect } from 'react';
import type { WhiteboardNode } from '@/lib/types';
import { Rnd } from 'react-rnd';

interface WhiteboardNodeComponentProps {
  node: WhiteboardNode;
  isSelected: boolean;
  isEditing: boolean;
  tool: 'select' | 'pen' | 'text' | 'sticky' | 'shape' | 'arrow' | 'connect' | 'image' | 'mindmap';
  onSelect: () => void;
  onDoubleClick: () => void;
  onChange: (newAttrs: Partial<WhiteboardNode>) => void;
  onDragEnd: () => void;
  onEditNode: (id: string | null) => void;
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
  onEditNode,
}: WhiteboardNodeComponentProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    // We use react-rnd for drag and resize, so manual logic is removed.

  }, [node, isSelected, tool]);

  const renderShape = () => {
    const commonProps = {
        width: node.width || 200,
        height: node.height || 100,
        fill: node.color || '#333',
        stroke: 'black',
        strokeWidth: 0,
    };
    switch (node.shape) {
        case 'circle': return <ellipse cx={commonProps.width / 2} cy={commonProps.height / 2} rx={commonProps.width / 2} ry={commonProps.height / 2} {...commonProps} />;
        case 'diamond': return <polygon points={`${commonProps.width / 2},0 0,${commonProps.height / 2} ${commonProps.width / 2},${commonProps.height} ${commonProps.width},${commonProps.height/2}`} {...commonProps} />;
        case 'triangle': return <polygon points={`${commonProps.width / 2},0 0,${commonProps.height} ${commonProps.width},${commonProps.height}`} {...commonProps} />;
        case 'arrow-right': return <polygon points={`0,${commonProps.height/4} ${commonProps.width - 20},${commonProps.height/4} ${commonProps.width-20},0 ${commonProps.width},${commonProps.height/2} ${commonProps.width-20},${commonProps.height} ${commonProps.width-20},${(commonProps.height*3)/4} 0,${(commonProps.height*3)/4}`} {...commonProps} />;
        case 'arrow-left': return <polygon points={`${commonProps.width},${commonProps.height/4} 20,${commonProps.height/4} 20,0 0,${commonProps.height/2} 20,${commonProps.height} 20,${(commonProps.height*3)/4} ${commonProps.width},${(commonProps.height*3)/4}`} {...commonProps} />;
        case 'rectangle':
        default: return <rect x="0" y="0" {...commonProps} rx="8" />;
    }
  };

  const renderContent = () => {
    switch(node.type) {
        case 'text':
        case 'sticky':
        case 'shape':
            if (isEditing) {
                return (
                    <textarea 
                        defaultValue={node.text || ''} 
                        onBlur={(e) => {
                            onChange({ text: e.target.value });
                            onEditNode(null);
                        }}
                        className="w-full h-full bg-transparent border-none outline-none resize-none p-2"
                        style={{ color: node.type === 'shape' ? 'white' : node.color, fontSize: node.fontSize }}
                        autoFocus
                    />
                );
            }
            return <div style={{ fontSize: node.fontSize, fontWeight: node.bold ? 'bold' : 'normal', color: node.type === 'shape' ? 'white' : node.textColor || '#333' }}>{node.text}</div>
        case 'image':
            return <img src={node.src} alt="whiteboard content" className="w-full h-full object-cover" />;
        case 'pen':
            const pathData = node.points?.reduce((acc, val, i) => {
                const command = i === 0 ? 'M' : 'L';
                return i % 2 === 0 ? `${acc} ${command} ${val}` : `${acc},${val}`;
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
        disableDragging={tool !== 'select' || isEditing}
        enableResizing={isSelected && tool === 'select' && !isEditing ? undefined : {
          bottom: false,
          bottomLeft: false,
          bottomRight: false,
          left: false,
          right: false,
          top: false,
          topLeft: false,
          topRight: false,
        }}
        className={`absolute flex items-center justify-center p-2 shadow-lg ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
        style={{
            backgroundColor: node.type === 'sticky' ? node.color : 'transparent',
            cursor: tool === 'select' ? 'move' : 'default',
            zIndex: node.zIndex,
        }}
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
    >
        <div ref={nodeRef} className="w-full h-full">
            {node.type === 'shape' ? (
                <svg width={node.width || 200} height={node.height || 100} className="overflow-visible">
                    {renderShape()}
                </svg>
            ): null}
            <div className="absolute inset-0 flex items-center justify-center p-2">{renderContent()}</div>
        </div>
    </Rnd>
  );
}
