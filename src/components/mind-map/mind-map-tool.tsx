
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MousePointer,
  PlusCircle,
  Link as LinkIcon,
  Undo,
  Redo,
  Download,
  Users,
  Plus,
  Trash2,
  Edit,
  Palette,
  Bold,
  Italic,
  Underline,
  GitBranch,
  Save,
  Expand,
  Minus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { MindMap as MindMapType, MindMapNode, MindMapConnection } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '../ui/input';

const colorPalette = ['#4361ee', '#ef476f', '#06d6a0', '#ffd166', '#9d4edd', '#000000'];

export function MindMapTool() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const mindMapId = params.mindMapId as string;

  const [mindMap, setMindMap] = useState<MindMapType | null>(null);
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [connections, setConnections] = useState<MindMapConnection[]>([]);
  const [mapName, setMapName] = useState('');
  
  const [isDragging, setIsDragging] = useState(false);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);

  const [history, setHistory] = useState<{ nodes: MindMapNode[]; connections: MindMapConnection[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Firestore Refs
  const getMindMapDocRef = useCallback(() => {
    if (!user || !mindMapId) return null;
    return doc(db, 'users', user.uid, 'mindMaps', mindMapId);
  }, [user, mindMapId]);
  
  // Load initial data
  useEffect(() => {
    const mapRef = getMindMapDocRef();
    if (mapRef) {
      const unsub = onSnapshot(mapRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data() as MindMapType;
          setMindMap(data);
          setNodes(data.nodes || []);
          setConnections(data.connections || []);
          setMapName(data.name);

          // Initialize history only once
          if (history.length === 0 && (data.nodes || []).length > 0) {
            const initialHistory = { nodes: data.nodes || [], connections: data.connections || [] };
            setHistory([initialHistory]);
            setHistoryIndex(0);
          }
        } else {
          toast({ variant: 'destructive', title: 'Mind Map not found.' });
          router.push('/mind-map');
        }
      });
      return () => unsub();
    }
  }, [user, mindMapId, toast, router, getMindMapDocRef]);
  
  const debouncedSave = useDebouncedCallback(async (updatedNodes, updatedConnections) => {
    const mapRef = getMindMapDocRef();
    if (mapRef) {
      await updateDoc(mapRef, { nodes: updatedNodes, connections: updatedConnections, updatedAt: new Date() });
    }
  }, 2000);

  const saveToHistory = useCallback((newNodes: MindMapNode[], newConnections: MindMapConnection[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: JSON.parse(JSON.stringify(newNodes)), connections: JSON.parse(JSON.stringify(newConnections)) });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    debouncedSave(newNodes, newConnections);
  }, [history, historyIndex, debouncedSave]);

  const addNode = useCallback((parentId?: string) => {
    setNodes(prevNodes => {
        const parentNode = parentId ? prevNodes.find(n => n.id === parentId) : prevNodes.find(n => n.id === selectedNodeId);
        if (!parentNode && prevNodes.length > 0) {
            toast({variant: 'destructive', title: "Select a node first", description: "You must select a parent node to add a new idea."});
            return prevNodes;
        }

        const angle = Math.random() * Math.PI * 2;
        const distance = 200;
        const newNode: MindMapNode = {
            id: uuidv4(),
            x: parentNode ? parentNode.x + Math.cos(angle) * distance : window.innerWidth / 2,
            y: parentNode ? parentNode.y + Math.sin(angle) * distance : window.innerHeight / 2,
            width: 150,
            height: 50,
            title: '',
            style: 'default',
            backgroundColor: '#f8f9fa',
            color: '#212529',
            isBold: false,
            isItalic: false,
            isUnderline: false,
        };
        
        const newNodes = [...prevNodes, newNode];
        
        setConnections(prevConnections => {
            let newConnections = [...prevConnections];
            if (parentNode) {
              newConnections.push({ from: parentNode.id, to: newNode.id });
            }
            saveToHistory(newNodes, newConnections);
            return newConnections;
        });

        setSelectedNodeId(newNode.id);
        return newNodes;
    });
  }, [selectedNodeId, toast, saveToHistory]);
  
  const deleteNode = useCallback((nodeId: string) => {
    if (nodes.length <= 1) {
        toast({ variant: 'destructive', title: "Cannot delete the last node." });
        return;
    }
    const newNodes = nodes.filter(n => n.id !== nodeId);
    const newConnections = connections.filter(c => c.from !== nodeId && c.to !== nodeId);
    setNodes(newNodes);
    setConnections(newConnections);
    setSelectedNodeId(null);
    saveToHistory(newNodes, newConnections);
  }, [nodes, connections, saveToHistory, toast]);
  
  const handleNodeUpdate = (nodeId: string, updates: Partial<MindMapNode>) => {
      setNodes(nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n));
  };
  
  const handleNodeBlur = () => {
    saveToHistory(nodes, connections);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const nodeEl = target.closest('.mindmap-node');

    if (nodeEl) {
      const nodeId = nodeEl.id.replace('node-', '');
      setSelectedNodeId(nodeId);
      if(connectingNodeId) {
        if (connectingNodeId !== nodeId) {
            const newConnections = [...connections, {from: connectingNodeId, to: nodeId}];
            setConnections(newConnections);
            saveToHistory(nodes, newConnections);
        }
        setConnectingNodeId(null);
        return;
      }
      setDraggingNode(nodeId);
      setDragStart({ x: e.clientX - nodes.find(n => n.id === nodeId)!.x, y: e.clientY - nodes.find(n => n.id === nodeId)!.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingNode) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      handleNodeUpdate(draggingNode, { x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    if (draggingNode) saveToHistory(nodes, connections);
    setIsDragging(false);
    setDraggingNode(null);
  };
  
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setNodes(history[newIndex].nodes);
      setConnections(history[newIndex].connections);
      debouncedSave(history[newIndex].nodes, history[newIndex].connections);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setNodes(history[newIndex].nodes);
      setConnections(history[newIndex].connections);
      debouncedSave(history[newIndex].nodes, history[newIndex].connections);
    }
  };

  const handleMapNameChange = useDebouncedCallback(async (newName: string) => {
    const mapRef = getMindMapDocRef();
    if (mapRef && mindMap && newName.trim() !== mindMap.name) {
      await updateDoc(mapRef, { name: newName.trim(), updatedAt: new Date() });
      toast({ title: "Mind Map renamed!" });
    }
  }, 1000);

  const fitToScreen = () => {
    if (!nodes.length) return;
    // Fit to screen logic would be implemented here
    toast({ title: "Fit to screen coming soon!" });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const activeElement = document.activeElement;
        const isEditingText = activeElement instanceof HTMLInputElement && activeElement.type === 'text' || activeElement instanceof HTMLTextAreaElement;

        if (isEditingText) {
            return;
        }

        if (selectedNodeId) {
            if (e.key === 'Tab') {
                e.preventDefault();
                addNode(selectedNodeId);
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                deleteNode(selectedNodeId);
            }
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                navigateNodes(e.key);
            }
        }
    };

    const navigateNodes = (key: string) => {
        const currentNode = nodes.find(n => n.id === selectedNodeId);
        if (!currentNode) return;
    
        const children = connections.filter(c => c.from === currentNode.id).map(c => nodes.find(n => n.id === c.to)).filter(Boolean) as MindMapNode[];
        const parentConnection = connections.find(c => c.to === currentNode.id);
        const parent = parentConnection ? nodes.find(n => n.id === parentConnection.from) : null;
        const siblings = parent ? (connections.filter(c => c.from === parent.id).map(c => nodes.find(n => n.id === c.to)).filter(Boolean) as MindMapNode[]) : [];
        const currentIndex = siblings.findIndex(s => s?.id === currentNode.id);

        switch (key) {
            case 'ArrowDown':
                if (currentIndex !== -1 && currentIndex < siblings.length - 1) {
                    setSelectedNodeId(siblings[currentIndex + 1]!.id);
                } else if (children.length > 0) {
                     setSelectedNodeId(children[0]!.id);
                }
                break;
            case 'ArrowUp':
                if (currentIndex > 0) {
                    setSelectedNodeId(siblings[currentIndex - 1]!.id);
                }
                break;
            case 'ArrowLeft':
                if(parent) {
                    setSelectedNodeId(parent.id);
                }
                break;
            case 'ArrowRight':
                 if (children.length > 0) {
                    setSelectedNodeId(children[0]!.id);
                }
                break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodeId, addNode, deleteNode, nodes, connections]);
  
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  if (!mindMap) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-full gap-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push('/mind-map')}><GitBranch className="h-4 w-4"/></Button>
                <Input 
                    value={mapName}
                    onChange={(e) => {
                        setMapName(e.target.value);
                        handleMapNameChange(e.target.value);
                    }}
                    className="text-3xl font-bold font-headline h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
            </div>
            <div className="flex gap-2">
                <Button variant="outline"><Users className="mr-2"/> Invite</Button>
                <Button><Download className="mr-2"/> Export</Button>
            </div>
        </div>

        <Card className="flex-1 relative overflow-hidden">
            <div className="absolute top-4 left-4 z-10 bg-card p-2 rounded-lg shadow-md flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => addNode()}><PlusCircle/></Button>
                <Button variant={connectingNodeId ? 'secondary' : 'ghost'} size="icon" onClick={() => setConnectingNodeId(selectedNodeId)}><LinkIcon/></Button>
                 <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex <= 0}><Undo/></Button>
                <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}><Redo/></Button>
            </div>
            
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
            
             <div className="absolute bottom-4 right-4 z-10 bg-card p-2 rounded-lg shadow-md flex flex-col gap-1">
                <Button variant="ghost" size="icon" onClick={() => {}}><Plus/></Button>
                <Button variant="ghost" size="icon" onClick={() => {}}><Minus/></Button>
                <Button variant="ghost" size="icon" onClick={fitToScreen}><Expand/></Button>
            </div>


            <div 
                className="w-full h-full cursor-grab active:cursor-grabbing bg-muted/50"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                <div className="absolute top-0 left-0">
                    <svg className="absolute top-0 left-0 w-full h-full" style={{ width: 5000, height: 5000, pointerEvents: 'none'}}>
                        {connections.map(conn => {
                            const from = nodes.find(n => n.id === conn.from);
                            const to = nodes.find(n => n.id === conn.to);
                            if (!from || !to) return null;
                            const path = `M ${from.x} ${from.y} C ${from.x + 100} ${from.y}, ${to.x - 100} ${to.y}, ${to.x} ${to.y}`;
                            return (
                                <path
                                    key={`${from.id}-${to.id}`}
                                    d={path}
                                    stroke="#9ca3af"
                                    strokeWidth="2"
                                    fill="none"
                                />
                            )
                        })}
                    </svg>

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
                                placeholder="Write text here..."
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
