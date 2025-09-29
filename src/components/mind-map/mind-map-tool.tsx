
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Upload,
  Plus,
  Trash2,
  Type,
  Palette,
  Circle,
  Square,
  Diamond,
  Star,
  Cloud,
  Undo,
  Redo
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from 'use-debounce';
import type { MindMapType, MindMapNode } from '@/lib/types';


const MindMapTool = () => {
  const { user } = useAuth();
  const params = useParams();
  const { toast } = useToast();
  const mindMapId = params.mindMapId as string;

  const [nodes, setNodes] = useState<Record<string, MindMapNode>>({
    '1': {
      id: '1',
      text: 'Central Idea',
      x: 600,
      y: 400,
      parentId: null,
      children: [],
      collapsed: false,
      color: '#8b5cf6',
      shape: 'rounded',
      fontSize: 18,
      bold: true,
      width: 200,
    },
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('1');
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nextId, setNextId] = useState(2);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  
  const [history, setHistory] = useState<{ nodes: Record<string, MindMapNode> }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushToHistory = (newNodes: Record<string, MindMapNode>) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: newNodes });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setNodes(history[historyIndex - 1].nodes);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setNodes(history[historyIndex + 1].nodes);
    }
  };
  
  const debouncedSave = useDebouncedCallback(async (dataToSave: Partial<MindMapType>) => {
    if (!user || !mindMapId) return;
    const mapRef = doc(db, 'users', user.uid, 'mindMaps', mindMapId);
    try {
        await updateDoc(mapRef, {...dataToSave, updatedAt: serverTimestamp()});
    } catch (error) {
        console.error("Error saving mind map: ", error);
        toast({ variant: 'destructive', title: 'Failed to save mind map.' });
    }
  }, 1000);


  useEffect(() => {
    if (editingNodeId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingNodeId]);
  
  const calculateChildPosition = useCallback((parent: MindMapNode, childIndex: number, totalChildren: number) => {
    const isRoot = !parent.parentId;
    const baseDistance = 200;
    
    if (isRoot) {
      const angle = (childIndex / totalChildren) * 360;
      const rad = (angle * Math.PI) / 180;
      return {
        x: parent.x + baseDistance * 1.5 * Math.cos(rad),
        y: parent.y + baseDistance * Math.sin(rad)
      };
    } else {
      const parentNode = nodes[parent.parentId!];
      const isRight = parent.x > parentNode.x;
      const angle = ((childIndex / Math.max(totalChildren - 1, 1)) - 0.5) * 90;
      const rad = (angle * Math.PI) / 180;
      const distance = baseDistance * 0.9;
      
      return {
        x: parent.x + (isRight ? 1 : -1) * distance * Math.cos(rad),
        y: parent.y + distance * Math.sin(rad)
      };
    }
  }, [nodes]);

  const addNode = useCallback((parentId: string | null, isSibling = false) => {
    if (!parentId && !isSibling) parentId = '1';
    if(isSibling) {
        const selected = nodes[selectedNodeId!];
        if(selected && selected.parentId) {
            parentId = selected.parentId;
        } else {
            parentId = '1';
        }
    }
    
    if(!parentId) return;

    const parent = nodes[parentId];
    const childIndex = parent.children.length;
    const position = calculateChildPosition(parent, childIndex, parent.children.length + 1);
    
    const newNode: MindMapNode = {
      id: String(nextId),
      text: 'New Idea',
      x: position.x,
      y: position.y,
      parentId,
      children: [],
      collapsed: false,
      color: parent.color,
      shape: 'rounded',
      fontSize: Math.max(14, (parent.fontSize || 16) - 2),
      bold: false,
      width: 150
    };

    const newNodes = {
        ...nodes,
        [newNode.id]: newNode,
        [parentId]: {
            ...nodes[parentId],
            children: [...nodes[parentId].children, newNode.id]
        }
    };
    setNodes(newNodes);
    setNextId(nextId + 1);
    setSelectedNodeId(newNode.id);
    setEditingNodeId(newNode.id);
    pushToHistory(newNodes);
  }, [nodes, nextId, selectedNodeId, calculateChildPosition]);

  const deleteNode = useCallback((nodeId: string) => {
    if (nodeId === '1') return;
    
    let newNodes = { ...nodes };
    const node = newNodes[nodeId];
    if (!node) return;

    const parentId = node.parentId;
    
    const deleteRecursive = (id: string) => {
      const n = newNodes[id];
      if (n) {
        n.children.forEach(childId => deleteRecursive(childId));
        delete newNodes[id];
      }
    };
    
    deleteRecursive(nodeId);
    
    if (parentId && newNodes[parentId]) {
      newNodes[parentId] = {
        ...newNodes[parentId],
        children: newNodes[parentId].children.filter(id => id !== nodeId)
      };
    }
    
    setNodes(newNodes);
    setSelectedNodeId(parentId);
    setEditingNodeId(null);
    pushToHistory(newNodes);
  }, [nodes]);

  const updateNode = (nodeId: string, updates: Partial<MindMapNode>) => {
    const newNodes = {
        ...nodes,
        [nodeId]: { ...nodes[nodeId], ...updates }
    };
    setNodes(newNodes);
  };
  
  const finishEditing = (nodeId: string, newText: string) => {
    if(newText.trim()) {
        const newNodes = {
            ...nodes,
            [nodeId]: { ...nodes[nodeId], text: newText.trim() }
        };
        setNodes(newNodes);
        pushToHistory(newNodes);
    }
    setEditingNodeId(null);
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isEditing = !!editingNodeId;

    if (isEditing) {
        if(e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            finishEditing(editingNodeId!, (e.target as HTMLInputElement).value);
        } else if (e.key === 'Escape') {
            setEditingNodeId(null);
        }
        return;
    }
    
    if (!selectedNodeId) return;
    
    if (e.key === 'Tab' || e.key === 'Insert') {
      e.preventDefault();
      addNode(selectedNodeId);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      addNode(selectedNodeId, true);
    } else if (e.key === 'F2') {
        e.preventDefault();
        setEditingNodeId(selectedNodeId);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      deleteNode(selectedNodeId);
    } else if (e.key === ' ') {
      e.preventDefault();
      const node = nodes[selectedNodeId];
      if (node && node.children.length > 0) {
        updateNode(selectedNodeId, { collapsed: !node.collapsed });
      }
    }
  }, [selectedNodeId, editingNodeId, nodes, addNode, deleteNode]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  const drawConnections = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    const drawCurve = (x1: number, y1: number, x2: number, y2: number, color: string) => {
      const dx = x2 - x1;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(x1 + dx * 0.5, y1, x2 - dx * 0.5, y2, x2, y2);
      ctx.stroke();
    };

    Object.values(nodes).forEach(node => {
      if (node.parentId && isNodeVisible(node.id)) {
        const parent = nodes[node.parentId];
        if (parent) {
          drawCurve(parent.x, parent.y, node.x, node.y, node.color + 'CC');
        }
      }
    });

    ctx.restore();
  }, [nodes, zoom, pan]);

  useEffect(() => {
    drawConnections();
  }, [drawConnections]);

  const isNodeVisible = (nodeId: string): boolean => {
    let current = nodes[nodeId];
    if (!current) return false;
    while (current.parentId) {
      const parent = nodes[current.parentId];
      if (!parent || parent.collapsed) return false;
      current = parent;
    }
    return true;
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  
  return (
    <div ref={containerRef} className="w-full h-full bg-background flex flex-col overflow-hidden">
      {/* Toolbar etc. will be added later */}
       <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={resetView}><Maximize2/></Button>
            <Button variant="outline" size="icon" onClick={() => setZoom(z => z + 0.1)}><ZoomIn/></Button>
            <Button variant="outline" size="icon" onClick={() => setZoom(z => z - 0.1)}><ZoomOut/></Button>
        </div>
         <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={undo} disabled={historyIndex <= 0}><Undo/></Button>
            <Button variant="outline" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}><Redo/></Button>
        </div>
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
        <div className="absolute inset-0 pointer-events-none">
          {Object.values(nodes).filter(node => isNodeVisible(node.id)).map(node => (
            <div key={node.id}
                className="absolute"
                style={{
                    left: node.x * zoom + pan.x,
                    top: node.y * zoom + pan.y,
                    transform: 'translate(-50%, -50%)',
                    zIndex: node.id === selectedNodeId ? 10 : 1,
                }}
            >
              {editingNodeId === node.id ? (
                <input
                    ref={editInputRef}
                    defaultValue={node.text}
                    onBlur={(e) => finishEditing(node.id, e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') finishEditing(node.id, e.currentTarget.value)}}
                    className="p-2 border rounded-md pointer-events-auto"
                    style={{fontSize: node.fontSize}}
                />
              ) : (
                <div 
                    onClick={() => setSelectedNodeId(node.id)}
                    onDoubleClick={() => setEditingNodeId(node.id)}
                    className={`p-2 cursor-pointer border-2 pointer-events-auto ${selectedNodeId === node.id ? 'border-blue-500' : 'border-transparent'}`}
                    style={{
                        backgroundColor: node.color,
                        color: 'white',
                        borderRadius: '8px',
                        width: node.width,
                        fontWeight: node.bold ? 'bold' : 'normal',
                        fontSize: node.fontSize,
                    }}
                >
                    {node.text}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MindMapTool;
