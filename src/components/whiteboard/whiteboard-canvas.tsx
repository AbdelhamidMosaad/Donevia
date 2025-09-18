
'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Whiteboard as WhiteboardType, WhiteboardNode } from '@/lib/types';
import { WhiteboardNodeComponent } from './whiteboard-node';

type Presence = {
    userId: string;
    name: string;
    color: string;
    x: number;
    y: number;
    lastSeen: any;
};

interface WhiteboardCanvasProps {
  boardData: WhiteboardType;
  nodes: WhiteboardNode[];
  tool: 'select' | 'pen' | 'text' | 'sticky' | 'shape' | 'arrow';
  shapeType: string;
  currentColor: string;
  strokeWidth: number;
  fontSize: number;
  selectedNodeId: string | null;
  editingNodeId: string | null;
  presence: Record<string, Presence>;
  onNodeCreate: (node: Omit<WhiteboardNode, 'id'>) => Promise<WhiteboardNode>;
  onNodeChange: (id: string, newAttrs: Partial<WhiteboardNode>) => void;
  onNodeChangeComplete: () => void;
  onNodeDelete: (id: string) => void;
  onSelectNode: (id: string | null) => void;
  onEditNode: (id: string | null) => void;
  onUpdatePresence: (pos: {x:number, y:number}) => void;
}

export function WhiteboardCanvas({
  boardData,
  nodes,
  tool,
  shapeType,
  currentColor,
  strokeWidth,
  fontSize,
  selectedNodeId,
  editingNodeId,
  presence,
  onNodeCreate,
  onNodeChange,
  onNodeChangeComplete,
  onNodeDelete,
  onSelectNode,
  onEditNode,
  onUpdatePresence,
}: WhiteboardCanvasProps) {
  const stageRef = useRef<any>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentLineId = useRef<string | null>(null);

  const handleStageClick = async (e: KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage() || (e.target.attrs.id === 'canvas-bg');
    if (!clickedOnEmpty) return;

    if (['text', 'sticky', 'shape', 'arrow'].includes(tool)) {
        const pos = e.target.getStage()?.getPointerPosition();
        if (!pos) return;
        const x = (pos.x - stagePos.x) / scale;
        const y = (pos.y - stagePos.y) / scale;

        let newNodeData: Omit<WhiteboardNode, 'id' | 'userId'> = {
            type: tool,
            x: x,
            y: y,
            rotation: 0,
            color: tool === 'sticky' ? '#ffd166' : currentColor,
        };

        if(tool === 'text') {
            newNodeData = {...newNodeData, width: 150, height: 50, text: 'New Text', fontSize: fontSize};
        } else if (tool === 'sticky') {
            newNodeData = {...newNodeData, width: 200, height: 120, text: 'New Note', fontSize: fontSize};
        } else if (tool === 'shape') {
            newNodeData = {...newNodeData, width: 100, height: 100, shape: shapeType as any, strokeWidth: strokeWidth};
        } else if (tool === 'arrow') {
            newNodeData = {...newNodeData, type: 'pen', points: [x,y,x+100,y+100], strokeWidth: strokeWidth, isArrow: true}
        }
        
        await onNodeCreate(newNodeData);
        onSelectNode(null);
    } else {
      onSelectNode(null);
      onEditNode(null);
    }
  };

  const handleMouseDown = async (e: KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage() || (e.target.attrs.id === 'canvas-bg');
    if (!clickedOnEmpty) return;

    if (tool === 'pen') {
      setIsDrawing(true);
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;
      const x = (pos.x - stagePos.x) / scale;
      const y = (pos.y - stagePos.y) / scale;

      const newPenNode = await onNodeCreate({
        type: 'pen',
        x:0, y:0, width:0, height:0,
        points: [x, y],
        color: currentColor,
        strokeWidth: strokeWidth,
      });
      currentLineId.current = newPenNode.id;
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    const pos = e.target.getStage()?.getPointerPosition();
    if(pos) onUpdatePresence(pos);

    if (tool === 'pen' && isDrawing && currentLineId.current) {
      if (!pos) return;
      const x = (pos.x - stagePos.x) / scale;
      const y = (pos.y - stagePos.y) / scale;
      
      onNodeChange(currentLineId.current, { points: [...(nodes.find(n => n.id === currentLineId.current)?.points || []), x, y] });
    }
  };

  const handleMouseUp = () => {
    if (tool === 'pen' && isDrawing) {
      setIsDrawing(false);
      onNodeChangeComplete();
      currentLineId.current = null;
    }
  };

  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}
      height={window.innerHeight - 150} 
      draggable={tool === 'select'}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleStageClick}
      onWheel={(e) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        const scaleBy = 1.05;
        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        setScale(newScale);

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };
        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };
        setStagePos(newPos);
      }}
      scaleX={scale}
      scaleY={scale}
      x={stagePos.x}
      y={stagePos.y}
    >
      <Layer>
        <Rect id="canvas-bg" x={-10000} y={-10000} width={20000} height={20000} fill={boardData.backgroundColor || '#FFFFFF'} />
        {nodes.map((node) => (
          <WhiteboardNodeComponent
            key={node.id}
            node={node}
            isSelected={node.id === selectedNodeId}
            isEditing={node.id === editingNodeId}
            onSelect={() => {
              if (tool === 'select') {
                onSelectNode(node.id);
                onEditNode(null);
              }
            }}
            onDoubleClick={() => {
              if (tool === 'select' && (node.type === 'text' || node.type === 'sticky')) {
                onEditNode(node.id);
              }
            }}
            onChange={(newAttrs) => onNodeChange(node.id, newAttrs)}
            onDragEnd={onNodeChangeComplete}
            onDelete={() => onNodeDelete(node.id)}
          />
        ))}
      </Layer>
    </Stage>
  );
}
