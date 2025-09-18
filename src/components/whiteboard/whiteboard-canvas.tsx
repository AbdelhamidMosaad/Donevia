
'use client';

import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Arrow, Line, Group, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
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
  onSelectNode: (id: string | null) => void;
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
  const stageRef = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentLineId = useRef<string | null>(null);
  const [selectionRect, setSelectionRect] = useState({ x: 0, y: 0, width: 0, height: 0, visible: false });

  const handleStageClick = async (e: KonvaEventObject<MouseEvent>) => {
    if (isMinimap) return;
    const clickedOnEmpty = e.target === e.target.getStage() || (e.target.attrs.id === 'canvas-bg');
    if (!clickedOnEmpty) return;

    if (['text', 'sticky', 'shape'].includes(tool)) {
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
    
    if (tool === 'select' && clickedOnEmpty) {
        const pos = e.target.getStage()?.getPointerPosition();
        if (pos) {
            setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0, visible: true });
        }
        onSelectNode(null);
        return;
    }

    if (!clickedOnEmpty) return;

    if (tool === 'pen' || tool === 'arrow') {
      setIsDrawing(true);
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;
      const stage = e.target.getStage();
      const x = (pos.x - stage.x()) / stage.scaleX();
      const y = (pos.y - stage.y()) / stage.scaleY();

      const newPenNode = await onNodeCreate({
        type: 'pen',
        x:0, y:0, width:0, height:0,
        points: [x, y, x, y],
        color: currentColor,
        strokeWidth: strokeWidth,
        isArrow: tool === 'arrow',
      });
      currentLineId.current = newPenNode.id;
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (isMinimap) return;
    const pos = e.target.getStage()?.getPointerPosition();
    if(pos) onUpdatePresence(pos);

    if (selectionRect.visible) {
        if (!pos) return;
        setSelectionRect(prev => ({
            ...prev,
            width: pos.x - prev.x,
            height: pos.y - prev.y,
        }));
        return;
    }

    if ((tool === 'pen' || tool === 'arrow') && isDrawing && currentLineId.current) {
      if (!pos) return;
      const stage = e.target.getStage();
      const x = (pos.x - stage.x()) / stage.scaleX();
      const y = (pos.y - stage.y()) / stage.scaleY();
      
      const currentNode = nodes.find(n => n.id === currentLineId.current);
      if (currentNode && currentNode.points) {
          const newPoints = [...currentNode.points, x, y];
          onNodeChange(currentLineId.current, { points: newPoints });
      }
    }
  };

  const handleMouseUp = () => {
    if (isMinimap) return;
    
    if (selectionRect.visible) {
        const stage = stageRef.current;
        const scale = stage.scaleX();
        const selBox = {
            x1: (selectionRect.x - stage.x())/scale,
            y1: (selectionRect.y - stage.y())/scale,
            x2: (selectionRect.x + selectionRect.width - stage.x())/scale,
            y2: (selectionRect.y + selectionRect.height - stage.y())/scale,
        };

        const selected = nodes.filter(node => {
            const nodeBox = {
                x1: node.x - (node.width ?? 0) / 2,
                y1: node.y - (node.height ?? 0) / 2,
                x2: node.x + (node.width ?? 0) / 2,
                y2: node.y + (node.height ?? 0) / 2,
            };
            return (
                Math.max(selBox.x1, nodeBox.x1) < Math.min(selBox.x2, nodeBox.x2) &&
                Math.max(selBox.y1, nodeBox.y1) < Math.min(selBox.y2, nodeBox.y2)
            );
        }).map(node => node.id);
        
        setSelectedNodeIds(selected);
        setSelectionRect({ x: 0, y: 0, width: 0, height: 0, visible: false });
        return;
    }

    if ((tool === 'pen' || tool === 'arrow') && isDrawing) {
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

  const handleSettingChange = (newSettings: Partial<WhiteboardType>) => {
    // This function will be provided by the parent component
  };
  
  const getConnectorPoints = (fromNode: WhiteboardNode, toNode: WhiteboardNode) => {
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const angle = Math.atan2(dy, dx);
    const fromRadiusX = (fromNode.width ?? 0) / 2;
    const fromRadiusY = (fromNode.height ?? 0) / 2;
    const toRadiusX = (toNode.width ?? 0) / 2;
    const toRadiusY = (toNode.height ?? 0) / 2;

    const fromX = fromNode.x + fromRadiusX * Math.cos(angle);
    const fromY = fromNode.y + fromRadiusY * Math.sin(angle);
    const toX = toNode.x - toRadiusX * Math.cos(angle);
    const toY = toNode.y - toRadiusY * Math.sin(angle);
    
    return [fromX, fromY, toX, toY];
  };

  return (
    <Stage
      ref={stageRef}
      width={isMinimap ? 192 : window.innerWidth}
      height={isMinimap ? 144 : window.innerHeight - 200}
      draggable={tool === 'select' && !selectionRect.visible}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleStageClick}
      onDragEnd={(e) => isMinimap ? {} : boardData && onNodeChange(boardData.id, { x: e.target.x(), y: e.target.y() })}
      onWheel={(e) => {
        if(isMinimap) return;
        e.evt.preventDefault();
        const stage = stageRef.current;
        if(!stage) return;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const scaleBy = 1.05;
        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        
        const newPos = {
            x: pointer.x - ((pointer.x - stage.x()) / oldScale) * newScale,
            y: pointer.y - ((pointer.y - stage.y()) / oldScale) * newScale,
        };
        handleSettingChange({scale: newScale, x: newPos.x, y: newPos.y});
      }}
      scaleX={boardData.scale || 1}
      scaleY={boardData.scale || 1}
      x={boardData.x || 0}
      y={boardData.y || 0}
    >
      <Layer>
        <Rect id="canvas-bg" x={-10000} y={-10000} width={20000} height={20000} fill={boardData.backgroundColor || '#FFFFFF'} />
        {connections.map(conn => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;
            const points = getConnectorPoints(fromNode, toNode);
            return (
                <Arrow 
                    key={`${conn.from}-${conn.to}`}
                    points={points}
                    stroke={conn.color || '#333333'}
                    strokeWidth={conn.strokeWidth || 2}
                    pointerLength={10}
                    pointerWidth={10}
                />
            )
        })}
        {sortedNodes.map((node) => (
          <WhiteboardNodeComponent
            key={node.id}
            node={node}
            isSelected={selectedNodeIds.includes(node.id)}
            isEditing={node.id === editingNodeId}
            tool={tool}
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
         {selectionRect.visible && (
            <Rect
                x={selectionRect.x}
                y={selectionRect.y}
                width={selectionRect.width}
                height={selectionRect.height}
                fill="rgba(0, 120, 255, 0.1)"
                stroke="rgba(0, 120, 255, 0.5)"
                strokeWidth={1}
            />
        )}
        {!isMinimap && Object.values(presence).map(p => (
            <Group key={p.userId} x={p.x} y={p.y}>
                 <Rect width={8} height={8} fill={p.color} offsetX={4} offsetY={4} cornerRadius={4} />
                 <Text y={12} text={p.name} fontSize={12} />
            </Group>
        ))}
      </Layer>
    </Stage>
  );
}

