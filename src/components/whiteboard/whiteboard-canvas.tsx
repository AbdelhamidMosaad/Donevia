
'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Arrow, Group } from 'react-konva';
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
  tool: 'select' | 'pen' | 'text' | 'sticky' | 'shape';
  shapeType: string;
  currentColor: string;
  strokeWidth: number;
  fontSize: number;
  selectedNodeId: string | null;
  editingNodeId: string | null;
  presence: Record<string, Presence>;
  onNodeCreate: (node: Omit<WhiteboardNode, 'id'>) => Promise<WhiteboardNode>;
  onNodeChange: (id: string, newAttrs: Partial<WhiteboardNode>) => void;
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

    if (tool === 'text' || tool === 'sticky' || tool === 'shape') {
        const pos = e.target.getStage()?.getPointerPosition();
        if (!pos) return;
        const x = (pos.x - stagePos.x) / scale;
        const y = (pos.y - stagePos.y) / scale;

        const newNodeData: Omit<WhiteboardNode, 'id'> = {
            userId: '', // This will be set by the auth context
            type: tool,
            x: x,
            y: y,
            width: tool === 'text' ? 150 : 200,
            height: tool === 'text' ? 50 : 120,
            rotation: 0,
            color: tool === 'sticky' ? '#ffd166' : currentColor,
            text: tool === 'text' ? 'New Text' : 'New Note',
            fontSize: fontSize,
            shape: tool === 'shape' ? shapeType as any : undefined,
        };
        await onNodeCreate(newNodeData);
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
        userId: '',
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
      
      const currentNodes = Object.values(nodes);
      const line = currentNodes.find(n => n.id === currentLineId.current);
      if(line && line.points) {
          const newPoints = line.points.concat([x,y]);
          onNodeChange(currentLineId.current, { points: newPoints });
      }
    }
  };

  const handleMouseUp = () => {
    if (tool === 'pen' && isDrawing) {
      setIsDrawing(false);
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
            onDelete={() => onNodeDelete(node.id)}
            onDragEnd={() => {}} // Placeholder
          />
        ))}
         {Object.values(presence).map(p => (
            <Group key={p.userId} x={p.x} y={p.y}>
                <Arrow points={[0, 0, 0, 15]} fill={p.color} stroke={p.color} strokeWidth={2} />
                <Text text={p.name} y={18} fill={p.color} />
            </Group>
        ))}
      </Layer>
    </Stage>
  );
}
