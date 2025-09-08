
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MousePointer,
  PlusCircle,
  Link as LinkIcon,
  StickyNote,
  Eye,
  Undo,
  Redo,
  Download,
  Users,
  Plus,
  Trash2,
  Edit,
  MoreVertical,
  Palette,
  Bold,
  Italic,
  Underline,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { MindMapNode, MindMapConnection } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const colorPalette = ['#4361ee', '#ef476f', '#06d6a0', '#ffd166', '#9d4edd', '#000000'];

// A simplified simulation of Firebase for demonstration purposes within the component
const FirebaseSimulator = {
  log: (message: string) => {
    console.log(`[FirebaseSim] ${new Date().toLocaleTimeString()}: ${message}`);
  },
};

export function MindMapTool() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [connections, setConnections] = useState<MindMapConnection[]>([]);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ nodes: MindMapNode[]; connections: MindMapConnection[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { toast } = useToast();

  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: JSON.parse(JSON.stringify(nodes)), connections: JSON.parse(JSON.stringify(connections)) });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, nodes, connections]);

  useEffect(() => {
    const centralNode: MindMapNode = {
      id: 'central',
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      width: 180,
      height: 60,
      title: 'Central Idea',
      style: 'default',
      backgroundColor: '#4361ee',
      color: 'white',
      isBold: true,
      isItalic: false,
      isUnderline: false,
    };
    setNodes([centralNode]);
    setSelectedNodeId(centralNode.id);
    setHistory([{ nodes: [centralNode], connections: [] }]);
    setHistoryIndex(0);
  }, []);

  const addNode = (parentId?: string) => {
    const parentNode = parentId ? nodes.find(n => n.id === parentId) : nodes.find(n => n.id === selectedNodeId);
    if (!parentNode) return;

    const angle = Math.random() * Math.PI * 2;
    const distance = 200;
    const newNode: MindMapNode = {
      id: uuidv4(),
      x: parentNode.x + Math.cos(angle) * distance,
      y: parentNode.y + Math.sin(angle) * distance,
      width: 150,
      height: 50,
      title: 'New Idea',
      style: 'default',
      backgroundColor: '#f8f9fa',
      color: '#212529',
      isBold: false,
      isItalic: false,
      isUnderline: false,
    };
    const newConnection: MindMapConnection = { from: parentNode.id, to: newNode.id };
    
    setNodes(prev => [...prev, newNode]);
    setConnections(prev => [...prev, newConnection]);
    setSelectedNodeId(newNode.id);
    saveToHistory();
    FirebaseSimulator.log('Node added');
  };
  
  const deleteNode = (nodeId: string) => {
    if (nodeId === 'central') {
        toast({ variant: 'destructive', title: "Cannot delete the central node." });
        return;
    }
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
    setSelectedNodeId(null);
    saveToHistory();
    FirebaseSimulator.log('Node deleted');
  };
  
  const handleNodeUpdate = (nodeId: string, updates: Partial<MindMapNode>) => {
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  };
  
  const handleNodeBlur = () => {
    saveToHistory();
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const nodeEl = target.closest('.mindmap-node');

    if (nodeEl) {
      const nodeId = nodeEl.id.replace('node-', '');
      setSelectedNodeId(nodeId);
      if(connectingNodeId) {
        // Complete connection
        if (connectingNodeId !== nodeId) {
            setConnections(prev => [...prev, {from: connectingNodeId, to: nodeId}]);
            saveToHistory();
        }
        setConnectingNodeId(null);
        return;
      }
      setDraggingNode(nodeId);
      setDragStart({ x: e.clientX / scale - nodes.find(n => n.id === nodeId)!.x, y: e.clientY / scale - nodes.find(n => n.id === nodeId)!.y });
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX / scale - offset.x, y: e.clientY / scale - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingNode) {
      const node = nodes.find(n => n.id === draggingNode)!;
      const newX = e.clientX / scale - dragStart.x;
      const newY = e.clientY / scale - dragStart.y;
      handleNodeUpdate(draggingNode, { x: newX, y: newY });
    } else if (isDragging) {
      setOffset({ x: e.clientX / scale - dragStart.x, y: e.clientY / scale - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    if (draggingNode) saveToHistory();
    setIsDragging(false);
    setDraggingNode(null);
  };
  
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      const newScale = Math.max(0.3, Math.min(2, scale + delta));
      setScale(newScale);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setNodes(history[newIndex].nodes);
      setConnections(history[newIndex].connections);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setNodes(history[newIndex].nodes);
      setConnections(history[newIndex].connections);
    }
  };
  
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex flex-col h-full gap-4">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                <GitBranch className="h-8 w-8 text-primary"/>
                Mind Map
            </h1>
             <div className="flex gap-2">
                <Button variant="outline"><Users className="mr-2"/> Invite</Button>
                <Button><Download className="mr-2"/> Export</Button>
            </div>
        </div>

        <Card className="flex-1 relative overflow-hidden" ref={canvasRef}>
            {/* Toolbar */}
            <div className="absolute top-4 left-4 z-10 bg-card p-2 rounded-lg shadow-md flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => addNode()}><PlusCircle/></Button>
                <Button variant={connectingNodeId ? 'secondary' : 'ghost'} size="icon" onClick={() => setConnectingNodeId(selectedNodeId)}><LinkIcon/></Button>
                <Button variant="ghost" size="icon"><StickyNote/></Button>
                 <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex <= 0}><Undo/></Button>
                <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}><Redo/></Button>
            </div>
            
             {/* Node Style Toolbar */}
            {selectedNode && (
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-card p-2 rounded-lg shadow-md flex gap-1 items-center">
                    <Button variant={selectedNode.isBold ? 'secondary' : 'ghost'} size="icon" onClick={() => handleNodeUpdate(selectedNodeId!, { isBold: !selectedNode.isBold })}><Bold/></Button>
                    <Button variant={selectedNode.isItalic ? 'secondary' : 'ghost'} size="icon" onClick={() => handleNodeUpdate(selectedNodeId!, { isItalic: !selectedNode.isItalic })}><Italic/></Button>
                    <Button variant={selectedNode.isUnderline ? 'secondary' : 'ghost'} size="icon" onClick={() => handleNodeUpdate(selectedNodeId!, { isUnderline: !selectedNode.isUnderline })}><Underline/></Button>
                    <Popover>
                        <PopoverTrigger asChild><Button variant="ghost" size="icon"><Palette/></Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                            <div className="flex gap-2">
                                {colorPalette.map(color => (
                                    <button key={color} style={{backgroundColor: color}} className="h-6 w-6 rounded-full border" onClick={() => handleNodeUpdate(selectedNodeId!, {backgroundColor: color, color: color === '#000000' ? 'white' : 'black'})} />
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                 </div>
            )}

            <div 
                className="w-full h-full cursor-grab active:cursor-grabbing bg-muted/50"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
            >
                <div 
                    className="absolute top-0 left-0"
                    style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0' }}
                >
                    {/* Connections */}
                    <svg className="absolute top-0 left-0 w-full h-full" style={{ width: 5000, height: 5000, pointerEvents: 'none'}}>
                        {connections.map(conn => {
                            const from = nodes.find(n => n.id === conn.from);
                            const to = nodes.find(n => n.id === conn.to);
                            if (!from || !to) return null;
                            return (
                                <path
                                    key={`${from.id}-${to.id}`}
                                    d={`M ${from.x} ${from.y} C ${from.x + 100} ${from.y}, ${to.x - 100} ${to.y}, ${to.x} ${to.y}`}
                                    stroke="#9ca3af"
                                    strokeWidth="2"
                                    fill="none"
                                />
                            )
                        })}
                    </svg>

                    {/* Nodes */}
                    {nodes.map(node => (
                        <div
                            key={node.id}
                            id={`node-${node.id}`}
                            className={cn('mindmap-node absolute p-3 rounded-lg shadow-lg cursor-pointer flex flex-col items-center justify-center', selectedNodeId === node.id && 'ring-2 ring-primary')}
                            style={{
                                left: node.x,
                                top: node.y,
                                width: node.width,
                                minHeight: node.height,
                                backgroundColor: node.backgroundColor,
                                color: node.color,
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            <input 
                                value={node.title}
                                onChange={(e) => handleNodeUpdate(node.id, { title: e.target.value })}
                                onBlur={handleNodeBlur}
                                className={cn(
                                    "bg-transparent text-center focus:outline-none w-full",
                                    node.isBold && 'font-bold',
                                    node.isItalic && 'italic',
                                    node.isUnderline && 'underline',
                                )}
                                style={{color: node.color}}
                            />
                             <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-20">
                                <Button size="icon" className="h-6 w-6 rounded-full" onClick={(e) => { e.stopPropagation(); addNode(node.id); }}><Plus className="h-4 w-4"/></Button>
                            </div>
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-20">
                                <Button size="icon" variant="destructive" className="h-6 w-6 rounded-full" onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    </div>
  );
}
