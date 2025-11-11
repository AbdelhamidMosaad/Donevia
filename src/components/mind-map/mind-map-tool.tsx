
'use client';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Plus, Trash2, ZoomIn, ZoomOut, Download, Upload, Palette, Type, Save, GitBranch, Maximize, Minimize, Undo, Redo, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from 'use-debounce';
import type { WhiteboardNode as MindMapNode, WhiteboardConnection as MindMapConnection, MindMapType as MindMapData } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

type Node = {
    id: string;
    text: string;
    x: number;
    y: number;
    color: string;
    parent: string | null;
    collapsed: boolean;
    fontSize: number;
    shape: 'rounded' | 'rectangle' | 'ellipse';
};

type Connection = {
    from: string;
    to: string;
};

const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const shapes = ['rounded', 'rectangle', 'ellipse'];

function AdvancedMindMap() {
    const { user } = useAuth();
    const { toast } = useToast();
    const params = useParams();
    const router = useRouter();
    const mindMapId = params.mindMapId as string;

    const [nodes, setNodes] = useState<Node[]>([
        { id: '1', text: 'Central Idea', x: 400, y: 300, color: '#3b82f6', parent: null, collapsed: false, fontSize: 18, shape: 'rounded' }
    ]);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [boardName, setBoardName] = useState('Loading...');

    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [draggingNode, setDraggingNode] = useState<string | null>(null);
    const [panning, setPanning] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [editingNode, setEditingNode] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [colorPickerNode, setColorPickerNode] = useState<string | null>(null);

    const canvasRef = useRef<SVGSVGElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [history, setHistory] = useState<{ nodes: Node[], connections: Connection[] }[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // --- Data Persistence ---
    const getBoardDocRef = useCallback(() => {
        if (!user || !mindMapId) return null;
        return doc(db, 'users', user.uid, 'mindMaps', mindMapId);
    }, [user, mindMapId]);
    
    const debouncedSave = useDebouncedCallback(() => {
        const boardRef = getBoardDocRef();
        if (!boardRef) return;

        const dataToSave = {
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
    }, [nodes, connections, offset, zoom, boardName]);
    
    useEffect(() => {
        const boardRef = getBoardDocRef();
        if (boardRef) {
            const unsub = onSnapshot(boardRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data() as MindMapData;
                    setBoardName(data.name);
                    
                    const loadedNodes = (data as any).nodes || [{ id: '1', text: 'Central Idea', x: 400, y: 300, color: '#3b82f6', parent: null, collapsed: false, fontSize: 18, shape: 'rounded' }];
                    const loadedConnections = (data as any).connections || [];
                    
                    setNodes(loadedNodes);
                    setConnections(loadedConnections);
                    setOffset(data.pan || { x: 0, y: 0 });
                    setZoom(data.zoom || 1);

                    if (history.length === 0) {
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
    }, [user, mindMapId]);


    // --- History Management ---
    const pushHistory = (currentNodes: Node[], currentConnections: Connection[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        setHistory([...newHistory, { nodes: currentNodes, connections: currentConnections }]);
        setHistoryIndex(newHistory.length);
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

    // --- Node & Connection Logic ---
    const addNode = () => {
        if (!selectedNode) {
            toast({ variant: 'destructive', title: 'Please select a parent node first.'});
            return;
        }

        const parent = nodes.find(n => n.id === selectedNode);
        if (!parent) return;

        const angle = Math.random() * Math.PI * 2;
        const distance = 150;

        const newNode: Node = {
            id: Date.now().toString(),
            text: 'New Node',
            x: parent.x + Math.cos(angle) * distance,
            y: parent.y + Math.sin(angle) * distance,
            color: parent.color,
            parent: selectedNode,
            collapsed: false,
            fontSize: 14,
            shape: 'rounded'
        };
        
        const newNodes = [...nodes, newNode];
        const newConnections = [...connections, { from: selectedNode, to: newNode.id }];
        pushHistory(newNodes, newConnections);
        setNodes(newNodes);
        setConnections(newConnections);
    };

    const deleteNode = (id: string) => {
        if (id === '1') return;

        let toDelete: string[] = [id];
        const findChildren = (parentId: string) => {
            nodes.forEach(node => {
                if (node.parent === parentId) {
                    toDelete.push(node.id);
                    findChildren(node.id);
                }
            });
        };
        findChildren(id);

        const newNodes = nodes.filter(n => !toDelete.includes(n.id));
        const newConnections = connections.filter(c => !toDelete.includes(c.from) && !toDelete.includes(c.to));
        pushHistory(newNodes, newConnections);
        setNodes(newNodes);
        setConnections(newConnections);
        if (selectedNode === id) setSelectedNode(null);
    };

    const toggleCollapse = (nodeId: string) => {
        const newNodes = nodes.map(n => n.id === nodeId ? { ...n, collapsed: !n.collapsed } : n);
        pushHistory(newNodes, connections);
        setNodes(newNodes);
    };
    
    // --- Interaction Handlers ---
    const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        setDraggingNode(nodeId);
        setSelectedNode(nodeId);
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
            setPanning(true);
            setSelectedNode(null);
            setColorPickerNode(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingNode) {
            setNodes(nodes.map(node =>
                node.id === draggingNode
                    ? { ...node, x: node.x + e.movementX / zoom, y: node.y + e.movementY / zoom }
                    : node
            ));
        } else if (panning) {
            setOffset({ x: offset.x + e.movementX, y: offset.y + e.movementY });
        }
    };

    const handleMouseUp = () => {
        if (draggingNode) {
            pushHistory(nodes, connections); // Push history after dragging is complete
        }
        setDraggingNode(null);
        setPanning(false);
    };

    const handleDoubleClick = (e: React.MouseEvent, nodeId?: string) => {
        if (nodeId) {
            const node = nodes.find(n => n.id === nodeId);
            if (node) {
                setEditingNode(node.id);
                setEditText(node.text);
            }
        } else {
             // Logic to add a node on canvas double click if needed
        }
    }

    const finishEdit = () => {
        if (editingNode && editText.trim()) {
            const newNodes = nodes.map(n => n.id === editingNode ? { ...n, text: editText } : n);
            pushHistory(newNodes, connections);
            setNodes(newNodes);
        }
        setEditingNode(null);
        setEditText('');
    };

    // --- Style Changers ---
    const changeColor = (nodeId: string, color: string) => {
        const newNodes = nodes.map(n => n.id === nodeId ? { ...n, color } : n);
        pushHistory(newNodes, connections);
        setNodes(newNodes);
        setColorPickerNode(null);
    };
    
    const changeShape = (nodeId: string, shape: Node['shape']) => {
        const newNodes = nodes.map(n => n.id === nodeId ? { ...n, shape } : n);
        pushHistory(newNodes, connections);
        setNodes(newNodes);
    };

    const changeFontSize = (nodeId: string, delta: number) => {
        const newNodes = nodes.map(n => n.id === nodeId ? { ...n, fontSize: Math.max(10, Math.min(32, n.fontSize + delta)) } : n);
        pushHistory(newNodes, connections);
        setNodes(newNodes);
    };
    
     // --- Export/Import ---
    const exportMap = () => {
        const data = { nodes, connections, name: boardName, pan: offset, zoom };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${boardName.replace(/ /g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importMap = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result as string);
                    pushHistory(data.nodes || [], data.connections || []);
                    setNodes(data.nodes || []);
                    setConnections(data.connections || []);
                    setBoardName(data.name || 'Imported Map');
                    setOffset(data.pan || {x:0, y:0});
                    setZoom(data.zoom || 1);
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
            const node = nodes.find(n => n.id === nodeId);
            if (!node) return;
            visible.add(nodeId);
            if (!node.collapsed) {
                connections.filter(c => c.from === nodeId).forEach(c => traverse(c.to));
            }
        };
        const root = nodes.find(n => !n.parent);
        if (root) traverse(root.id);
        return visible;
    }, [nodes, connections]);

    const visibleNodeIds = useMemo(() => getVisibleNodes(), [getVisibleNodes]);

    // --- Render Logic ---
    const renderNode = (node: Node) => {
        if (!visibleNodeIds.has(node.id)) return null;

        const isSelected = selectedNode === node.id;
        const hasChildren = connections.some(c => c.from === node.id);

        const width = Math.max(120, node.text.length * (node.fontSize / 1.5)) + 20;
        const height = node.fontSize * 3;

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
            <g key={node.id} onMouseDown={(e) => handleNodeMouseDown(e, node.id)} onDoubleClick={(e) => handleDoubleClick(e, node.id)}>
                <path
                    d={pathD}
                    fill={node.color}
                    stroke={isSelected ? '#1e40af' : '#1f2937'}
                    strokeWidth={isSelected ? 3 : 1.5}
                    style={{ cursor: 'pointer', filter: isSelected ? 'brightness(1.1)' : 'none' }}
                />
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
        const from = nodes.find(n => n.id === conn.from);
        const to = nodes.find(n => n.id === conn.to);

        if (!from || !to || !visibleNodeIds.has(to.id)) return null;

        const fromHeight = from.fontSize * 3;
        const toHeight = to.fontSize * 3;
        
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
    
    useEffect(() => {
        if (editingNode && editInputRef.current) {
            editInputRef.current.focus();
            editInputRef.current.select();
        }
    }, [editingNode]);

    return (
        <div className="w-full h-full bg-gray-900 flex flex-col overflow-hidden" ref={containerRef}>
            {/* Top Toolbar */}
            <div className="bg-gray-800 p-2 flex items-center gap-2 border-b border-gray-700 flex-wrap">
                 <Button variant="ghost" size="icon" onClick={() => router.push('/mind-map')}><ArrowLeft/></Button>
                 <Input className="text-xl bg-transparent border-0" value={boardName} onChange={(e) => setBoardName(e.target.value)} />
                <Button onClick={addNode} disabled={!selectedNode}><Plus size={18} /> Add Node</Button>
                <Button onClick={() => selectedNode && deleteNode(selectedNode)} disabled={!selectedNode || selectedNode === '1'} variant="destructive"><Trash2 size={18} /> Delete</Button>
                <Button onClick={undo} disabled={historyIndex <= 0}><Undo size={18} /> Undo</Button>
                <Button onClick={redo} disabled={historyIndex >= history.length - 1}><Redo size={18} /> Redo</Button>
                <Button onClick={() => setZoom(Math.min(2, zoom + 0.1))}><ZoomIn size={18} /></Button>
                <Button onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}><ZoomOut size={18} /></Button>
                <Button onClick={() => {setZoom(1); setOffset({x:0, y:0})}}><Maximize size={18} /></Button>
                <Button onClick={exportMap}><Download size={18} /> Export</Button>
                <Button asChild><label htmlFor="import-file" className="cursor-pointer"><Upload size={18} /> Import</label></Button>
                <input type="file" id="import-file" accept=".json" onChange={importMap} className="hidden" />
                 <Button onClick={debouncedSave.flush}><Save size={18}/> Save Now</Button>
            </div>

            {/* Editing Tools */}
            {selectedNode && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-gray-800 p-1 flex items-center gap-1 border border-gray-700 rounded-lg">
                    <Popover open={colorPickerNode === selectedNode} onOpenChange={(open) => setColorPickerNode(open ? selectedNode : null)}>
                        <PopoverTrigger asChild><Button variant="ghost" size="icon"><Palette size={18} /></Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-2 bg-gray-800 border-gray-700">
                             <div className="flex gap-1">
                                {colors.map(color => <button key={color} onClick={() => changeColor(selectedNode, color)} className="w-6 h-6 rounded-full border-2 border-white" style={{ backgroundColor: color }}/>)}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Button variant="ghost" size="icon" onClick={() => changeFontSize(selectedNode, 2)}><Type size={18} />+</Button>
                    <Button variant="ghost" size="icon" onClick={() => changeFontSize(selectedNode, -2)}><Type size={18} />-</Button>
                    <Button variant="ghost" size="icon" onClick={() => { const node = nodes.find(n => n.id === selectedNode)!; const idx = shapes.indexOf(node.shape); changeShape(selectedNode, shapes[(idx + 1) % shapes.length]); }}><Circle size={18} /></Button>
                </div>
            )}
            
            {editingNode && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                     <Input
                        ref={editInputRef}
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') finishEdit(); if (e.key === 'Escape') setEditingNode(null); }}
                        onBlur={finishEdit}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter text..."
                    />
                </div>
            )}

            {/* Canvas */}
            <div className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing" onMouseDown={handleCanvasMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                <svg ref={canvasRef} width="100%" height="100%">
                    <g style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: 'center center' }}>
                        {connections.map(renderConnection)}
                        {nodes.map(renderNode)}
                    </g>
                </svg>
            </div>
            
             <div className="bg-gray-800 px-4 py-1 text-gray-400 text-xs border-t border-gray-700 flex justify-between">
                <span>Zoom: {(zoom * 100).toFixed(0)}% | Nodes: {nodes.length}</span>
                <span>{selectedNode ? `Selected: ${nodes.find(n => n.id === selectedNode)?.text}` : 'No selection'}</span>
            </div>
        </div>
    );
};

export default AdvancedMindMap;
