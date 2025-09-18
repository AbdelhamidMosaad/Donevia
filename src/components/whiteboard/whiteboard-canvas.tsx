
'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Whiteboard as WhiteboardType, WhiteboardNode } from '@/lib/types';
import { WhiteboardNodeComponent } from './whiteboard-node';
import { v4 as uuidv4 } from 'uuid';

interface WhiteboardCanvasProps {
  boardData: WhiteboardType;
  nodes: WhiteboardNode[];
  setNodes: React.Dispatch<React.SetStateAction<WhiteboardNode[]>>;
  tool: 'select' | 'pen' | 'text' | 'sticky' | 'shape';
  setTool: (tool: 'select' | 'pen' | 'text' | 'sticky' | 'shape') => void;
  shapeType: string;
  currentColor: string;
  strokeWidth: number;
  fontSize: number;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  editingNodeId: string | null;
  setEditingNodeId: (id: string | null) => void;
  saveToHistory: (nodes: WhiteboardNode[]) => void;
}

export function WhiteboardCanvas({
  boardData,
  nodes,
  setNodes,
  tool,
  setTool,
  shapeType,
  currentColor,
  strokeWidth,
  fontSize,
  selectedNodeId,
  setSelectedNodeId,
  editingNodeId,
  setEditingNodeId,
  saveToHistory,
}: WhiteboardCanvasProps) {
  const stageRef = useRef<any>(null);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastLine = useRef<any>(null);

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage() || (e.target.attrs.id === 'canvas-bg');
    if (clickedOnEmpty) {
      if (tool === 'text' || tool === 'sticky' || tool === 'shape') {
        const pos = e.target.getStage()?.getPointerPosition();
        if (!pos) return;

        const newNode: WhiteboardNode = {
          id: uuidv4(),
          type: tool,
          x: pos.x,
          y: pos.y,
          width: tool === 'text' ? 150 : 200,
          height: tool === 'text' ? 50 : 120,
          rotation: 0,
          color: tool === 'sticky' ? '#ffd166' : currentColor,
          text: tool === 'text' ? 'New Text' : 'New Note',
          fontSize: fontSize,
          shape: tool === 'shape' ? shapeType as any : undefined,
        };

        const newNodes = [...nodes, newNode];
        setNodes(newNodes);
        saveToHistory(newNodes);
        setTool('select');
      } else {
        setSelectedNodeId(null);
        setEditingNodeId(null);
      }
    }
  };

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (tool === 'pen') {
      setIsDrawing(true);
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;
      const newPenNode: WhiteboardNode = {
        id: uuidv4(),
        type: 'pen',
        x:0, y:0, width:0, height:0, // Not used for pen
        points: [pos.x, pos.y],
        color: currentColor,
        strokeWidth: strokeWidth,
      };
      lastLine.current = newPenNode;
      setNodes((prev) => [...prev, newPenNode]);
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (tool === 'pen' && isDrawing && lastLine.current) {
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;
      const newPoints = lastLine.current.points.concat([pos.x, pos.y]);
      lastLine.current.points = newPoints;
      
      setNodes((prev) =>
        prev.map((node) =>
          node.id === lastLine.current.id
            ? { ...node, points: newPoints }
            : node
        )
      );
    }
  };

  const handleMouseUp = () => {
    if (tool === 'pen' && isDrawing) {
      setIsDrawing(false);
      saveToHistory(nodes);
      lastLine.current = null;
    }
  };


  return (
    <Stage
      ref={stageRef}
      width={window.innerWidth}
      height={window.innerHeight - 150} 
      draggable={tool === 'select'}
      onMouseDown={(e) => {
        handleMouseDown(e);
        handleStageClick(e);
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={(e) => {
        // zoom logic here if needed
      }}
      scaleX={scale}
      scaleY={scale}
      x={stagePos.x}
      y={stagePos.y}
    >
      <Layer>
        <Rect id="canvas-bg" x={-5000} y={-5000} width={10000} height={10000} fill={boardData.backgroundColor || '#FFFFFF'} />
        {nodes.map((node) => (
          <WhiteboardNodeComponent
            key={node.id}
            node={node}
            isSelected={node.id === selectedNodeId}
            isEditing={node.id === editingNodeId}
            onSelect={() => {
              if (tool !== 'pen') {
                setSelectedNodeId(node.id);
                setEditingNodeId(null);
              }
            }}
            onDoubleClick={() => {
              if (tool === 'select' && (node.type === 'text' || node.type === 'sticky')) {
                setEditingNodeId(node.id);
              }
            }}
            onChange={(newAttrs) => {
              const newNodes = nodes.map((n) =>
                n.id === node.id ? { ...n, ...newAttrs } : n
              );
              setNodes(newNodes);
            }}
            onDragEnd={() => saveToHistory(nodes)}
            onDelete={() => {
              const newNodes = nodes.filter(n => n.id !== node.id);
              setNodes(newNodes);
              saveToHistory(newNodes);
            }}
          />
        ))}
      </Layer>
    </Stage>
  );
}
