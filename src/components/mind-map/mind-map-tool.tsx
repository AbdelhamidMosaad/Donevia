
'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, Download, Upload, Palette, Type, Save, GitBranch, Maximize, Minimize, Undo, Redo, ArrowLeft, ArrowUpRight, PanelLeftClose, PanelLeftOpen, Circle, ArrowDown, ArrowRight, ArrowUp, Layers, FlipVertical, Copy, Map, ImageIcon, AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter, AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  collection,
  writeBatch,
  addDoc,
  setDoc,
  getDocs,
} from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from 'use-debounce';
import type { WhiteboardNode as MindMapNode, WhiteboardConnection as MindMapConnection, MindMapType as MindMapData, WhiteboardTemplate } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Label } from '../ui/label';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Separator } from '../ui/separator';
import { Slider } from '../ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { cn } from '@/lib/utils';
import throttle from 'lodash.throttle';
import { jsPDF } from 'jspdf';
import { v4 as uuidv4 } from 'uuid';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { TemplateDialog } from '../whiteboard/template-dialog';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';
import { WhiteboardCanvas } from '../whiteboard/whiteboard-canvas';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';

type Node = MindMapNode;
type Connection = MindMapConnection;

type Presence = {
    userId: string;
    name: string;
    photoURL?: string;
    color: string;
    x: number;
    y: number;
    lastSeen: any;
};
type LayoutDirection = 'right' | 'bottom' | 'left' | 'top';

const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const shapes: Node['shape'][] = ['rounded', 'rectangle', 'ellipse'];

function deepCleanUndefined(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj === undefined ? null : obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(deepCleanUndefined);
  }
  const cleaned: { [key: string]: any } = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = deepCleanUndefined(value);
    }
  }
  return cleaned;
}

export default function AdvancedMindMap() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const mindMapId = params.mindMapId as string;

  const [nodes, setNodes] = useState<Record<string, Node>>({
        '1': { id: '1', text: 'Central Idea', x: 400, y: 300, color: '#3b82f6', parentId: null, children:[], collapsed: false, fontSize: 18, shape: 'rounded', type: 'text', userId: user?.uid || '' }
    });
  const [connections, setConnections] = useState<Connection[]>([]);
  const [boardName, setBoardName] = useState('Loading...');
  
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{x: number, y: number} | null>(null);
  const [panning, setPanning] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [colorPickerNode, setColorPickerNode] = useState<string | null>(null);
  const canvasRef = useRef<SVGSVGElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<{ nodes: Record<string, Node>, connections: Connection[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

    const onEditNode = (nodeId: string | null) => {
        setEditingNode(nodeId);
        if (nodeId && nodes[nodeId]) {
            setEditText(nodes[nodeId].text || '');
        }
    };

  // --- Data Persistence ---
  const getBoardDocRef = useCallback(() => {
    if (!user || !mindMapId) return null;
    return doc(db, 'users', user.uid, 'mindMaps', mindMapId);
  }, [user, mindMapId]);
  
  const debouncedSave = useDebouncedCallback(() => {
    const boardRef = getBoardDocRef();
    if (!boardRef) return;
    
    const dataToSave: Partial<MindMapData> = {
        name: boardName,
        nodes: nodes,
        connections: connections,
        pan: offset,
        zoom: zoom,
        updatedAt: serverTimestamp(),
    };
    updateDoc(boardRef, dataToSave);
  }, 2000);

  useEffect(() => {
    if (historyIndex > -1) { // Don't save on initial load
        debouncedSave();
    }
  }, [nodes, connections, offset, zoom, boardName, debouncedSave, historyIndex]);
  
  useEffect(() => {
    const boardRef = getBoardDocRef();
    if (boardRef) {
        const unsub = onSnapshot(boardRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data() as MindMapData;
                setBoardName(data.name);
                
                const loadedNodes = data.nodes || { '1': { id: '1', text: 'Central Idea', x: 400, y: 300, color: '#3b82f6', parentId: null, children: [], collapsed: false, fontSize: 18, shape: 'rounded', type: 'text', userId: user?.uid || '' }};
                const loadedConnections = data.connections || [];
                
                setNodes(loadedNodes);
                setConnections(loadedConnections);
                setOffset(data.pan || { x: 0, y: 0 });
                setZoom(data.zoom || 1);

                if (history.length === 0 && Object.keys(loadedNodes).length > 0) {
                    setHistory([{ nodes: loadedNodes, connections: loadedConnections }]);
                    setHistoryIndex(0);
                }
            } else {
                 toast({ variant: 'destructive', title: 'Mind map not found.' });
                 router.push('/mind-map');
            }
        });
        return () => unsub();
    }
  }, [user, mindMapId, toast, router, getBoardDocRef]);


  // --- History Management ---
  const pushToHistory = useCallback((newNodes: Record<string, Node>, newConnections: Connection[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: newNodes, connections: newConnections });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            const { nodes: nodesToRestore, connections: connectionsToRestore } = history[newIndex];
            setNodes(nodesToRestore);
            setConnections(connectionsToRestore);
            debouncedSave.flush();
        }
    }, [history, historyIndex, debouncedSave]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            const { nodes: nodesToRedo, connections: connectionsToRedo } = history[newIndex];
            setNodes(nodesToRedo);
            setConnections(connectionsToRedo);
            debouncedSave.flush();
        }
    }, [history, historyIndex, debouncedSave]);


  // --- Node & Connection Logic ---
    const addNode = () => {
        if (!selectedNode) {
            toast({ variant: 'destructive', title: 'Please select a parent node first.'});
            return;
        }

        const parent = nodes[selectedNode];
        if (!parent) return;

        const angle = Math.random() * Math.PI * 2;
        const distance = 150;
        
        const newNodeId = uuidv4();
        const newNode: Node = {
            id: newNodeId,
            text: 'New Node',
            x: parent.x + Math.cos(angle) * distance,
            y: parent.y + Math.sin(angle) * distance,
            color: parent.color,
            parentId: selectedNode,
            children: [],
            collapsed: false,
            fontSize: 14,
            shape: 'rounded',
            type: 'text',
            userId: user!.uid,
            width: 150,
            height: 50,
        };
        
        const newNodes = { ...nodes, [newNodeId]: newNode };
        const newConnections = [...connections, { from: selectedNode, to: newNode.id }];
        pushToHistory(newNodes, newConnections);
        setNodes(newNodes);
        setConnections(newConnections);
    };

    const deleteNode = (id: string) => {
        if (id === '1') return;
        
        const toDeleteIds: string[] = [id];
        const findChildren = (parentId: string) => {
            Object.values(nodes).forEach(node => {
                if (node.parentId === parentId) {
                    toDeleteIds.push(node.id);
                    findChildren(node.id);
                }
            });
        };
        findChildren(id);
        
        const newNodes = { ...nodes };
        toDeleteIds.forEach(deleteId => delete newNodes[deleteId]);

        const newConnections = connections.filter(c => !toDeleteIds.includes(c.from) && !toDeleteIds.includes(c.to));
        
        pushToHistory(newNodes, newConnections);
        setNodes(newNodes);
        setConnections(newConnections);
        if (selectedNode === id) setSelectedNode(null);
    };

    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        setDraggingNode(nodeId);
        setDragStartPos({ x: e.clientX, y: e.clientY });
        setSelectedNode(nodeId);
    };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setPanning(true);
      setSelectedNode(null);
      setEditingNode(null);
      setColorPickerNode(null);
    }
  };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingNode && nodes[draggingNode]) {
            const newNodes = {...nodes};
            const updatedNode = {
                ...newNodes[draggingNode],
                x: newNodes[draggingNode].x + e.movementX / zoom,
                y: newNodes[draggingNode].y + e.movementY / zoom,
            }
            newNodes[draggingNode] = updatedNode;
            setNodes(newNodes);
        } else if (panning) {
            setOffset({ x: offset.x + e.movementX, y: offset.y + e.movementY });
        }
    };

    const handleMouseUp = (e: React.MouseEvent) => {
        if (draggingNode && dragStartPos) {
            const distMoved = Math.sqrt(
                Math.pow(e.clientX - dragStartPos.x, 2) + 
                Math.pow(e.clientY - dragStartPos.y, 2)
            );
            
            if (distMoved < 5) {
                const node = nodes[draggingNode];
                if (node) {
                    setEditingNode(node.id);
                    setEditText(node.text || '');
                }
            } else {
                 pushToHistory(nodes, connections); // Push history after dragging is complete
            }
        }
        
        setDraggingNode(null);
        setDragStartPos(null);
        setPanning(false);
    };

    const finishEdit = () => {
        if (editingNode && editText.trim()) {
             const newNodes = { ...nodes, [editingNode]: { ...nodes[editingNode], text: editText }};
             pushToHistory(newNodes, connections);
             setNodes(newNodes);
        }
        setEditingNode(null);
        setEditText('');
    };

    const toggleCollapse = (nodeId: string) => {
        const newNodes = { ...nodes, [nodeId]: { ...nodes[nodeId], collapsed: !nodes[nodeId].collapsed }};
        pushToHistory(newNodes, connections);
        setNodes(newNodes);
    };

    const changeColor = (nodeId: string, color: string) => {
        const newNodes = { ...nodes, [nodeId]: { ...nodes[nodeId], color }};
        pushToHistory(newNodes, connections);
        setNodes(newNodes);
        setColorPickerNode(null);
    };

    const changeShape = (nodeId: string, shape: Node['shape']) => {
        const newNodes = { ...nodes, [nodeId]: { ...nodes[nodeId], shape }};
        pushToHistory(newNodes, connections);
        setNodes(newNodes);
    };

    const changeFontSize = (nodeId: string, delta: number) => {
        const newNodes = { ...nodes, [nodeId]: { ...nodes[nodeId], fontSize: Math.max(10, Math.min(32, (nodes[nodeId].fontSize || 16) + delta)) }};
        pushToHistory(newNodes, connections);
        setNodes(newNodes);
    };
    
    const exportMap = () => {
        const data = { nodes, connections };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'mindmap.json';
        a.click();
    };

    const importMap = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target!.result as string);
                    pushToHistory(data.nodes || [], data.connections || []);
                    setNodes(data.nodes || {});
                    setConnections(data.connections || []);
                } catch (err) {
                    toast({ variant: 'destructive', title: 'Invalid file format'});
                }
            };
            reader.readAsText(file);
        }
    };
  
    const getVisibleNodes = useCallback(() => {
        const visible = new Set<string>();
        const traverse = (nodeId: string) => {
            const node = nodes[nodeId];
            if (!node) return;
            visible.add(nodeId);
            if (!node.collapsed) {
                connections.filter(c => c.from === nodeId).forEach(c => traverse(c.to));
            }
        };
        const root = Object.values(nodes).find(n => !n.parentId);
        if (root) traverse(root.id);
        return visible;
    }, [nodes, connections]);

    const visibleNodeIds = useMemo(() => getVisibleNodes(), [getVisibleNodes]);

  const renderNode = (node: Node) => {
    if (!visibleNodeIds.has(node.id)) return null;

    const isSelected = selectedNode === node.id;
    const hasChildren = connections.some(c => c.from === node.id);
    
    const width = Math.max(120, (node.text?.length || 0) * (node.fontSize || 16) / 1.5) + 20;
    const height = (node.fontSize || 16) * 3;

    let pathD;
    switch (node.shape) {
        case 'ellipse':
            pathD = `M ${node.x - width/2} ${node.y} a ${width/2} ${height/2} 0 1 1 ${width} 0 a ${width/2} ${height/2} 0 1 1 -${width} 0`;
            break;
        case 'rectangle':
             pathD = `M ${node.x - width/2} ${node.y - height/2} h ${width} v ${height} h -${width} Z`;
            break;
        default: // rounded
            const r = 10;
            pathD = `M ${node.x - width/2 + r} ${node.y - height/2} h ${width-2*r} a ${r} ${r} 0 0 1 ${r} ${r} v ${height-2*r} a ${r} ${r} 0 0 1 -${r} ${r} h -${width-2*r} a ${r} ${r} 0 0 1 -${r} -${r} v -${height-2*r} a ${r} ${r} 0 0 1 ${r} -${r} Z`;
    }

    return (
        <g key={node.id} onMouseDown={(e) => handleNodeMouseDown(e, node.id)} onDoubleClick={() => onEditNode(node.id)}>
            <path
                d={pathD}
                fill={node.color}
                stroke={isSelected ? '#1e40af' : '#1f2937'}
                strokeWidth={isSelected ? 3 : 1.5}
                style={{ cursor: 'pointer', filter: isSelected ? 'brightness(1.1)' : 'none' }}
            />
            {editingNode !== node.id && (
                <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={node.fontSize}
                    fontWeight="600"
                    pointerEvents="none"
                    style={{ userSelect: 'none' }}
                >
                    {node.text}
                </text>
            )}
            {editingNode === node.id && (
                <foreignObject x={node.x - width/2} y={node.y - height/2} width={width} height={height}>
                     <input
                        ref={editInputRef}
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') finishEdit();
                          if (e.key === 'Escape') setEditingNode(null);
                        }}
                        onBlur={finishEdit}
                        className="w-full h-full bg-transparent text-white text-center border-none outline-none"
                        style={{ fontSize: node.fontSize }}
                    />
                </foreignObject>
            )}
            {hasChildren && (
                <circle
                    cx={node.x}
                    cy={node.y + height/2}
                    r={8}
                    fill={node.collapsed ? '#ef4444' : '#10b981'}
                    stroke="white"
                    strokeWidth={2}
                    onClick={(e) => {
                        e.stopPropagation();
                        toggleCollapse(node.id);
                    }}
                    style={{ cursor: 'pointer' }}
                />
            )}
        </g>
    );
  };

  const renderConnection = (conn: Connection) => {
    const from = nodes[conn.from];
    const to = nodes[conn.to];
    
    if (!from || !to || !visibleNodeIds.has(to.id)) return null;

    const fromHeight = (from.fontSize || 16) * 3;
    const toHeight = (to.fontSize || 16) * 3;
    
    const startY = from.y + fromHeight / 2;
    const endY = to.y - toHeight / 2;
    
    const path = `M ${from.x} ${startY} C ${from.x} ${startY + 50}, ${to.x} ${endY - 50}, ${to.x} ${endY}`;
    
    return (
        <path
            key={`${conn.from}-${conn.to}`}
            d={path}
            stroke={from.color}
            strokeWidth={2}
            fill="none"
            opacity={0.6}
        />
    );
  };
  
    if (!boardData) {
        return (
            <div className="flex items-center justify-center h-full">
              <p>Loading whiteboard...</p>
            </div>
        );
    }

  return (
    <div className="w-full h-full bg-gray-900 flex flex-col overflow-hidden" ref={containerRef}>
      <div className="bg-gray-800 p-3 flex items-center gap-2 border-b border-gray-700 flex-wrap">
        <Button onClick={addNode} disabled={!selectedNode}><Plus size={18} /> Add Node</Button>
        <Button 
          onClick={() => selectedNode && deleteNode(selectedNode)} 
          disabled={!selectedNode || selectedNode === '1'}
          variant="destructive"
        >
          <Trash2 size={18} /> Delete
        </Button>
        <Button onClick={undo} disabled={historyIndex <= 0} variant="outline"><Undo size={18} /></Button>
        <Button onClick={redo} disabled={historyIndex >= history.length - 1} variant="outline"><Redo size={18} /></Button>
        <Button onClick={() => setZoom(Math.min(2, zoom + 0.1))} variant="outline"><ZoomIn size={18} /></Button>
        <Button onClick={() => setZoom(Math.max(0.3, zoom - 0.1))} variant="outline"><ZoomOut size={18} /></Button>
        <Button onClick={() => {setZoom(1); setOffset({x:0, y:0})}} variant="outline"><Maximize size={18} /></Button>
        <Button onClick={exportMap} variant="outline"><Download size={18} /> Export</Button>
        <Button asChild variant="outline">
            <label htmlFor="import-file" className="cursor-pointer flex items-center gap-2"><Upload size={18} /> Import</label>
        </Button>
        <input type="file" id="import-file" accept=".json" onChange={importMap} className="hidden" />
        <Button onClick={debouncedSave.flush}><Save size={18}/> Save Now</Button>
        {selectedNode && (
          <>
             <Popover open={colorPickerNode === selectedNode} onOpenChange={(open) => setColorPickerNode(open ? selectedNode : null)}>
                    <PopoverTrigger asChild><Button variant="ghost" size="icon"><Palette size={18} style={{ color: nodes[selectedNode]?.color || '#fff' }}/></Button></PopoverTrigger>
                    <PopoverContent className="w-auto p-2 bg-gray-800 border-gray-700">
                         <div className="flex gap-1">
                            {colors.map(color => <button key={color} onClick={() => changeColor(selectedNode, color)} className="w-6 h-6 rounded-full border-2 border-white" style={{ backgroundColor: color }}/>)}
                        </div>
                    </PopoverContent>
                </Popover>
            <Button variant="ghost" size="icon" onClick={() => changeFontSize(selectedNode, 2)}><Type size={18} />+</Button>
            <Button variant="ghost" size="icon" onClick={() => changeFontSize(selectedNode, -2)}><Type size={18} />-</Button>
            <Button variant="ghost" size="icon" onClick={() => { const node = nodes[selectedNode]; const idx = shapes.indexOf(node.shape || 'rounded'); changeShape(selectedNode, shapes[(idx + 1) % shapes.length]); }}><Circle size={18} /></Button>
          </>
        )}
      </div>

      <div 
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg 
          ref={canvasRef} 
          width="100%" 
          height="100%" 
          style={{ 
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          {connections.map(renderConnection)}
          {Object.values(nodes).map(renderNode)}
        </svg>
      </div>

      <div className="bg-gray-800 px-4 py-2 text-gray-400 text-sm border-t border-gray-700 flex justify-between">
        <span>Zoom: {(zoom * 100).toFixed(0)}% | Nodes: {Object.keys(nodes).length}</span>
        <span>{selectedNode ? ` Selected: ${nodes[selectedNode]?.text}` : ' No selection'}</span>
      </div>
    </div>
  );
};
