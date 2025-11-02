
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Whiteboard as WhiteboardType, WhiteboardNode, WhiteboardConnection } from '@/lib/types';
import { WhiteboardNodeComponent } from './whiteboard-node';

type Presence = {
    userId: string;
    name: string;
    photoURL?: string;
    color: string;
    x: number;
    y: number;
    lastSeen: any;
};

interface WhiteboardCanvasProps {
  boardData: WhiteboardType;
  nodes: WhiteboardNode[];
  tool: 'select' | 'pen' | 'text' | 'sticky' | 'shape' | 'arrow' | 'connect' | 'image' | 'mindmap';
  shapeType: string;
  currentColor: string;
  strokeWidth: number;
  fontSize: number;
  selectedNodeIds: string[];
  editingNodeId: string | null;
  presence: Record<string, Presence>;
  onNodeCreate: (node: Omit<WhiteboardNode, 'id'|'userId'|'createdAt'|'updatedAt'|'zIndex'>) => Promise<WhiteboardNode>;
  onNodeChange: (id: string, newAttrs: Partial<WhiteboardNode>) => void;
  onNodeChangeComplete: () => void;
  onNodeDelete: (id: string) => void;
  onSelectNode: (id: string | null | ((prev: string[]) => string[])) => void;
  onEditNode: (id: string | null) => void;
  onUpdatePresence: (pos: {x:number, y:number}) => void;
  isMinimap?: boolean;
  connections: WhiteboardConnection[];
  onConnectionCreate: (from: string, to: string) => void;
  onConnectionDelete: (from: string, to: string) => void;
}

export function WhiteboardCanvas({
  boardData,
  nodes,
  tool,
  shapeType,
  currentColor,
  strokeWidth,
  fontSize,
  selectedNodeIds,
  editingNodeId,
  presence,
  onNodeCreate,
  onNodeChange,
  onNodeChangeComplete,
  onNodeDelete,
  onSelectNode,
  onEditNode,
  onUpdatePresence,
  isMinimap = false,
  connections,
  onConnectionCreate,
  onConnectionDelete,
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPathData = useRef<string>("");
  const [selectionRect, setSelectionRect] = useState({ x: 0, y: 0, width: 0, height: 0, visible: false });
  
  const getPointerPosition = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top,
    };
  }

  const handleMouseDown = async (e: React.MouseEvent) => {
    if (isMinimap) return;
    const pos = getPointerPosition(e);
    if (!pos) return;
    
    if (tool === 'pen' || tool === 'arrow') {
        setIsDrawing(true);
        currentPathData.current = `M ${pos.x} ${pos.y}`;
        onNodeCreate({
            type: 'pen',
            x: pos.x, y: pos.y, points: [pos.x, pos.y],
            color: currentColor,
            strokeWidth: strokeWidth,
            isArrow: tool === 'arrow',
        });
    } else if (tool === 'select') {
        setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0, visible: true });
        if(!e.shiftKey) {
          onSelectNode(null);
        }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if(isMinimap) return;
    const pos = getPointerPosition(e);
    if(!pos) return;
    onUpdatePresence(pos);

    if (isDrawing && (tool === 'pen' || tool === 'arrow')) {
        currentPathData.current += ` L ${pos.x} ${pos.y}`;
        const lastNode = nodes[nodes.length - 1]; // Assume last created node is the one being drawn
        if (lastNode && lastNode.type === 'pen' && lastNode.points) {
            onNodeChange(lastNode.id, { points: [...lastNode.points, pos.x, pos.y] });
        }
    } else if (selectionRect.visible) {
        setSelectionRect(prev => ({
            ...prev,
            width: pos.x - prev.x,
            height: pos.y - prev.y,
        }));
    }
  };

  const handleMouseUp = () => {
    if (isMinimap) return;
    if (isDrawing) {
        setIsDrawing(false);
        onNodeChangeComplete();
        currentPathData.current = "";
    }
    if (selectionRect.visible) {
        const selBox = {
            x1: Math.min(selectionRect.x, selectionRect.x + selectionRect.width),
            y1: Math.min(selectionRect.y, selectionRect.y + selectionRect.height),
            x2: Math.max(selectionRect.x, selectionRect.x + selectionRect.width),
            y2: Math.max(selectionRect.y, selectionRect.y + selectionRect.height),
        };
         const selected = nodes.filter(node => {
            const nodeBox = {
                x1: node.x - (node.width ?? 0) / 2,
                y1: node.y - (node.height ?? 0) / 2,
                x2: node.x + (node.width ?? 0) / 2,
                y2: node.y + (node.height ?? 0) / 2,
            };
            return (
                selBox.x1 < nodeBox.x2 && selBox.x2 > nodeBox.x1 &&
                selBox.y1 < nodeBox.y2 && selBox.y2 > nodeBox.y1
            );
        }).map(node => node.id);
        
        onSelectNode((prev) => [...new Set([...prev, ...selected])]);
        setSelectionRect({ x: 0, y: 0, width: 0, height: 0, visible: false });
    }
  };
  
   const sortedNodes = React.useMemo(() => nodes.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)), [nodes]);

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full"
      style={{ 
          backgroundColor: boardData.backgroundColor || '#FFFFFF',
          cursor: tool === 'pen' ? 'crosshair' : tool === 'connect' ? 'crosshair' : 'default' 
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg className="absolute top-0 left-0 w-full h-full" pointerEvents="none">
        {/* Render Connections */}
        {connections.map(conn => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if(!fromNode || !toNode) return null;
            return (
                 <line 
                    key={`${conn.from}-${conn.to}`} 
                    x1={fromNode.x} y1={fromNode.y} 
                    x2={toNode.x} y2={toNode.y} 
                    stroke={conn.color || '#333'} 
                    strokeWidth={conn.strokeWidth || 2} 
                />
            )
        })}
      </svg>
      {/* Render Nodes */}
      {sortedNodes.map(node => (
        <WhiteboardNodeComponent
          key={node.id}
          node={node}
          isSelected={selectedNodeIds.includes(node.id)}
          isEditing={node.id === editingNodeId}
          tool={tool}
          onSelect={() => onSelectNode(node.id)}
          onDoubleClick={() => onEditNode(node.id)}
          onChange={(newAttrs) => onNodeChange(node.id, newAttrs)}
          onDragEnd={onNodeChangeComplete}
        />
      ))}
      {/* Render Selection Rectangle */}
      {selectionRect.visible && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none"
          style={{
            left: Math.min(selectionRect.x, selectionRect.x + selectionRect.width),
            top: Math.min(selectionRect.y, selectionRect.y + selectionRect.height),
            width: Math.abs(selectionRect.width),
            height: Math.abs(selectionRect.height),
          }}
        />
      )}
    </div>
  );
}
