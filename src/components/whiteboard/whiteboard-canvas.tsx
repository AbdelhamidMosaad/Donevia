
'use client';

import React, { useRef } from 'react';
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
  onNodeCreate: (node: Omit<WhiteboardNode, 'id'|'userId'|'createdAt'|'updatedAt'|'zIndex'>) => Promise<WhiteboardNode>;
  onNodeChange: (id: string, newAttrs: Partial<WhiteboardNode>) => void;
  onNodeChangeComplete: () => void;
  onNodeDelete: (id: string) => void;
  onSelectNode: (id: string | null) => void;
  onEditNode: (id: string | null) => void;
  onUpdatePresence: (pos: {x:number, y:number}) => void;
  isMinimap?: boolean;
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
  isMinimap = false,
}: WhiteboardCanvasProps) {
  const stageRef = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentLineId = useRef<string | null>(null);

  const handleStageClick = async (e: KonvaEventObject<MouseEvent>) => {
    if (isMinimap) return;
    const clickedOnEmpty = e.target === e.target.getStage() || (e.target.attrs.id === 'canvas-bg');
    if (!clickedOnEmpty) return;

    if (['text', 'sticky', 'shape', 'arrow'].includes(tool)) {
        const pos = e.target.getStage()?.getPointerPosition();
        if (!pos) return;
        const stage = e.target.getStage();
        const x = (pos.x - stage.x()) / stage.scaleX();
        const y = (pos.y - stage.y()) / stage.scaleY();

        let newNodeData: Omit<WhiteboardNode, 'id'|'userId'|'createdAt'|'updatedAt'|'zIndex'> = {
            type: tool as any,
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
            newNodeData = {...newNodeData, type: 'pen', points: [0,0,100,0], strokeWidth: strokeWidth, isArrow: true}
        }
        
        const newNode = await onNodeCreate(newNodeData);
        onSelectNode(newNode.id);
    } else {
      onSelectNode(null);
      onEditNode(null);
    }
  };

  const handleMouseDown = async (e: KonvaEventObject<MouseEvent>) => {
    if (isMinimap) return;
    const clickedOnEmpty = e.target === e.target.getStage() || (e.target.attrs.id === 'canvas-bg');
    if (!clickedOnEmpty) return;

    if (tool === 'pen') {
      setIsDrawing(true);
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;
      const stage = e.target.getStage();
      const x = (pos.x - stage.x()) / stage.scaleX();
      const y = (pos.y - stage.y()) / stage.scaleY();

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
    if (isMinimap) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if(pos) onUpdatePresence(pos);

    if (tool === 'pen' && isDrawing && currentLineId.current) {
      if (!pos) return;
      const stage = e.target.getStage();
      const x = (pos.x - stage.x()) / stage.scaleX();
      const y = (pos.y - stage.y()) / stage.scaleY();
      
      const currentNode = nodes.find(n => n.id === currentLineId.current);
      if (currentNode) {
          onNodeChange(currentLineId.current, { points: [...(currentNode.points || []), x, y] });
      }
    }
  };

  const handleMouseUp = () => {
    if (isMinimap) return;
    if (tool === 'pen' && isDrawing) {
      setIsDrawing(false);
      onNodeChangeComplete();
      currentLineId.current = null;
    }
  };
  
  const sortedNodes = React.useMemo(() => Object.values(nodes).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)), [nodes]);

  const canvasSize = {
    width: isMinimap ? 192 : window.innerWidth,
    height: isMinimap ? 144 : window.innerHeight - 150
  };

  return (
    <Stage
      ref={stageRef}
      width={canvasSize.width}
      height={canvasSize.height}
      draggable={tool === 'select' || tool === 'pan'}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleStageClick}
      onDragEnd={(e) => boardData && onNodeChange(boardData.id, { x: e.target.x(), y: e.target.y() })}
      onWheel={(e) => {
        if(isMinimap) return;
        e.evt.preventDefault();
        const stage = stageRef.current;
        if(!stage) return;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        const scaleBy = 1.05;
        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        
        const newPos = {
            x: pointer.x - ((pointer.x - stage.x()) / oldScale) * newScale,
            y: pointer.y - ((pointer.y - stage.y()) / oldScale) * newScale,
        };
        onNodeChange(boardData.id, { scale: newScale, x: newPos.x, y: newPos.y });
      }}
      scaleX={boardData.scale || 1}
      scaleY={boardData.scale || 1}
      x={boardData.x || 0}
      y={boardData.y || 0}
    >
      <Layer>
        <Rect id="canvas-bg" x={-10000} y={-10000} width={20000} height={20000} fill={boardData.backgroundColor || '#FFFFFF'} />
        {sortedNodes.map((node) => (
          <WhiteboardNodeComponent
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
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
          />
        ))}
      </Layer>
    </Stage>
  );
}
