
'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  MousePointer,
  PlusCircle,
  Link as LinkIcon,
  Undo,
  Redo,
  Download,
  Plus,
  Trash2,
  Palette,
  Settings,
  Grid3x3,
  List,
  Baseline,
  Minus,
  Expand,
  Maximize,
  Minimize,
  ArrowLeft,
  ArrowUpRight,
  PanelLeftClose,
  PanelLeftOpen,
  Circle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Layers,
  FlipVertical,
  Copy,
  Map,
  ImageIcon,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  LayoutTemplate,
  Save,
  Triangle,
  Diamond,
  Pen,
  Type,
  StickyNote,
  RectangleHorizontal,
  Move,
  Bold,
  Italic,
  Underline,
  GripVertical
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
import { Label } from '../ui/label';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { jsPDF } from 'jspdf';


const colorPalette = ['#4361ee', '#ef476f', '#06d6a0', '#ffd166', '#9d4edd', '#000000'];
type Tool = 'select' | 'node' | 'connect' | 'pan';
const backgroundColors = [
    '#FFFFFF', '#F8F9FA', '#E9ECEF', '#FFF9C4', '#F1F3F5'
];


// Helper function to measure text dimensions
const getTextDimensions = (text: string, font: string): { width: number, height: number } => {
    if (typeof document === 'undefined') {
        return { width: text.length * 8, height: 16 }; // Fallback for SSR
    }
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (context) {
        context.font = font;
        const lines = text.split('\n');
        const width = Math.max(...lines.map(line => context.measureText(line).width));
        const height = lines.length * 20; // Approximate line height
        return { width, height };
    }
    return { width: text.length * 8, height: 20 * text.split('\n').length };
};


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
  
  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const previousToolRef = useRef<Tool>('select');

  const [history, setHistory] = useState<{ nodes: MindMapNode[]; connections: MindMapConnection[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mindMapContainerRef = useRef<HTMLDivElement>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');


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
  }, [user, mindMapId, toast, router, getMindMapDocRef, history.length]);
  
  const saveMindMap = useDebouncedCallback(async (updatedNodes, updatedConnections) => {
    const mapRef = getMindMapDocRef();
    if (mapRef) {
      setSaveStatus('saving');
      await updateDoc(mapRef, { nodes: updatedNodes, connections: updatedConnections, updatedAt: new Date() });
      setSaveStatus('saved');
       setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, 2000);

  const saveToHistory = useCallback((newNodes: MindMapNode[], newConnections: MindMapConnection[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: JSON.parse(JSON.stringify(newNodes)), connections: JSON.parse(JSON.stringify(newConnections)) });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    saveMindMap(newNodes, newConnections);
  }, [history, historyIndex, saveMindMap]);

  const addNode = useCallback((parentId?: string) => {
    const parentNode = parentId ? nodes.find(n => n.id === parentId) : nodes.find(n => n.id === selectedNodeId);
    if (!parentNode && nodes.length > 0) {
        toast({variant: 'destructive', title: "Select a node first", description: "You must select a parent node to add a new idea."});
        return;
    }

    const newNode: MindMapNode = {
        id: uuidv4(),
        x: parentNode ? parentNode.x + 200 : 300,
        y: parentNode ? parentNode.y + (nodes.filter(n => connections.some(c => c.from === parentNode.id && c.to === n.id)).length * 80) : 300,
        width: 150, height: 50, title: 'New Idea', style: 'default',
        backgroundColor: '#f8f9fa', color: '#212529',
        isBold: false, isItalic: false, isUnderline: false,
    };
    
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    
    let newConnections = [...connections];
    if (parentNode) {
      newConnections.push({ from: parentNode.id, to: newNode.id });
      setConnections(newConnections);
    }
    
    saveToHistory(newNodes, newConnections);
    setSelectedNodeId(newNode.id);
  }, [nodes, connections, selectedNodeId, toast, saveToHistory]);
  
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
  
  const autoSizeNode = (node: MindMapNode, text: string): Partial<MindMapNode> => {
    const font = `${node.isBold ? 'bold ' : ''}${node.isItalic ? 'italic ' : ''}14px sans-serif`;
    const { width, height } = getTextDimensions(text, font);
    const newWidth = Math.max(150, width + 40); // Add padding
    const newHeight = Math.max(50, height + 20); // Add padding
    return { width: newWidth, height: newHeight };
  };

  const handleNodeUpdate = (nodeId: string, updates: Partial<MindMapNode>) => {
      setNodes(prevNodes => prevNodes.map(n => {
          if (n.id === nodeId) {
              const updatedNode = { ...n, ...updates };
              if (updates.title !== undefined) {
                  const sizeUpdates = autoSizeNode(updatedNode, updates.title);
                  return { ...updatedNode, ...sizeUpdates };
              }
              return updatedNode;
          }
          return n;
      }));
  };

  useEffect(() => {
    if (draggingNode) return;
    saveMindMap(nodes, connections);
  }, [nodes, connections, draggingNode, saveMindMap]);
  
  const handleNodeBlur = () => {
    saveToHistory(nodes, connections);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const nodeEl = target.closest('.mindmap-node');
    const dragHandle = target.closest('.drag-handle');
    
    if (currentTool === 'pan' || (e.button === 1 && !nodeEl)) { // Middle mouse button pan
      isPanning.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }

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
      if(currentTool === 'select' && dragHandle) {
        setDraggingNode(nodeId);
        const node = nodes.find(n => n.id === nodeId)!
        const transformedX = node.x * scale + offset.x;
        const transformedY = node.y * scale + offset.y;
        setDragStart({ x: e.clientX - transformedX, y: e.clientY - transformedY });
      }
    } else {
        // Prevent deselecting if clicking on toolbar
        if (!target.closest('[data-toolbar]')) {
             setSelectedNodeId(null);
        }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning.current) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        return;
    }
    if (draggingNode) {
        const newX = (e.clientX - dragStart.x - offset.x) / scale;
        const newY = (e.clientY - dragStart.y - offset.y) / scale;
        handleNodeUpdate(draggingNode, { x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    if (draggingNode) saveToHistory(nodes, connections);
    isPanning.current = false;
    setDraggingNode(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const newScale = e.deltaY > 0 ? scale * (1 - zoomSpeed) : scale * (1 + zoomSpeed);
    const clampedScale = Math.min(Math.max(newScale, 0.1), 5);
    
    const canvasContainer = mindMapContainerRef.current;
    if (!canvasContainer) return;
    const rect = canvasContainer.getBoundingClientRect();

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const pointX = (mouseX - offset.x) / scale;
    const pointY = (mouseY - offset.y) / scale;

    const newOffsetX = mouseX - pointX * clampedScale;
    const newOffsetY = mouseY - pointY * clampedScale;

    setScale(clampedScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };
  
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setNodes(history[newIndex].nodes);
      setConnections(history[newIndex].connections);
      saveMindMap(history[newIndex].nodes, history[newIndex].connections);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setNodes(history[newIndex].nodes);
      setConnections(history[newIndex].connections);
      saveMindMap(history[newIndex].nodes, history[newIndex].connections);
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
    const padding = 50;
    const minX = Math.min(...nodes.map(n => n.x - n.width/2));
    const minY = Math.min(...nodes.map(n => n.y - n.height/2));
    const maxX = Math.max(...nodes.map(n => n.x + n.width/2));
    const maxY = Math.max(...nodes.map(n => n.y + n.height/2));

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    if(contentWidth <= 0 || contentHeight <= 0) return;

    const canvasContainer = mindMapContainerRef.current;
    if (!canvasContainer) return;
    
    const { clientWidth, clientHeight } = canvasContainer;
    
    const scaleX = (clientWidth - padding * 2) / contentWidth;
    const scaleY = (clientHeight - padding * 2) / contentHeight;
    const newScale = Math.min(scaleX, scaleY, 1);

    const newOffsetX = (clientWidth / 2) - (minX + contentWidth / 2) * newScale;
    const newOffsetY = (clientHeight / 2) - (minY + contentHeight / 2) * newScale;

    setScale(newScale);
    setOffset({x: newOffsetX, y: newOffsetY});
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        const activeElement = document.activeElement;
        const isEditingText = activeElement?.tagName === 'TEXTAREA' || (activeElement instanceof HTMLInputElement && activeElement.type === 'text');


        if (isEditingText) return;

        if (e.key === ' ') { // Spacebar for panning
            e.preventDefault();
            if (currentTool !== 'pan') {
                previousToolRef.current = currentTool;
                setCurrentTool('pan');
            }
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
        }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.key === ' ') {
            setCurrentTool(previousToolRef.current);
        }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    }
  }, [selectedNodeId, addNode, deleteNode, currentTool]);

  const toggleFullscreen = () => {
    const elem = mindMapContainerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
        elem.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  const createExportCanvas = (padding = 100): HTMLCanvasElement | null => {
    if (!nodes.length) {
      toast({ variant: "destructive", title: "Cannot export an empty mind map." });
      return null;
    }

    const minX = Math.min(...nodes.map(n => n.x - n.width / 2));
    const minY = Math.min(...nodes.map(n => n.y - n.height / 2));
    const maxX = Math.max(...nodes.map(n => n.x + n.width / 2));
    const maxY = Math.max(...nodes.map(n => n.y + n.height / 2));

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = contentWidth + padding * 2;
    exportCanvas.height = contentHeight + padding * 2;
    const exportCtx = exportCanvas.getContext('2d');

    if (!exportCtx) {
      toast({ variant: "destructive", title: "Failed to create export canvas." });
      return null;
    }

    exportCtx.fillStyle = mindMap?.backgroundColor || '#FFFFFF';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    const drawOffsetX = -minX + padding;
    const drawOffsetY = -minY + padding;

    exportCtx.strokeStyle = '#9ca3af';
    exportCtx.lineWidth = 2;
    connections.forEach(conn => {
      const from = nodes.find(n => n.id === conn.from);
      const to = nodes.find(n => n.id === conn.to);
      if (!from || !to) return;
      const path = `M ${from.x + drawOffsetX} ${from.y + drawOffsetY} C ${from.x + 100 + drawOffsetX} ${from.y + drawOffsetY}, ${to.x - 100 + drawOffsetX} ${to.y + drawOffsetY}, ${to.x + drawOffsetX} ${to.y + drawOffsetY}`;
      exportCtx.stroke(new Path2D(path));
    });

    nodes.forEach(node => {
      const x = node.x + drawOffsetX;
      const y = node.y + drawOffsetY;
      exportCtx.fillStyle = node.backgroundColor;
      exportCtx.fillRect(x - node.width / 2, y - node.height / 2, node.width, node.height);
      exportCtx.strokeStyle = '#e5e7eb';
      exportCtx.strokeRect(x - node.width / 2, y - node.height / 2, node.width, node.height);

      exportCtx.fillStyle = node.color;
      let fontStyle = '';
      if (node.isBold) fontStyle += 'bold ';
      if (node.isItalic) fontStyle += 'italic ';
      exportCtx.font = `${fontStyle} 14px sans-serif`;
      exportCtx.textAlign = 'center';
      exportCtx.textBaseline = 'middle';
      exportCtx.fillText(node.title, x, y);
    });

    return exportCanvas;
  };
  
  const handleExportPNG = () => {
    const exportCanvas = createExportCanvas();
    if (!exportCanvas) return;

    const dataURL = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${mapName || 'mind-map'}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Your mind map is being downloaded as a PNG." });
  };
  
  const handleExportPDF = () => {
    toast({ variant: 'destructive', title: 'PDF Export is currently unavailable.'});
  };

   const handleSettingChange = async (setting: Partial<MindMapType>) => {
      const mapRef = getMindMapDocRef();
      if(mapRef && mindMap) {
          await updateDoc(mapRef, setting);
      }
  }

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  if (!mindMap) return <div>Loading...</div>;

  return (
    <div ref={mindMapContainerRef} className={cn("flex flex-col h-full gap-4", isFullscreen && "bg-background")}>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push('/mind-map')}><ArrowLeft /></Button>
                <Input 
                    value={mapName}
                    onChange={(e) => {
                        setMapName(e.target.value);
                        handleMapNameChange(e.target.value);
                    }}
                    className="text-3xl font-bold font-headline h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
            </div>
             <div className="flex items-center gap-2">
                 <Popover>
                    <PopoverTrigger asChild><Button variant="outline"><Settings /> Settings</Button></PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="grid gap-4">
                            <div className="space-y-2"><h4 className="font-medium leading-none">Settings</h4></div>
                            <div className="grid gap-2">
                                <Label>Background Color</Label>
                                <div className="flex flex-wrap gap-2">
                                    {backgroundColors.map(color => (
                                        <button key={color} onClick={() => handleSettingChange({ backgroundColor: color })}
                                            className={cn("w-8 h-8 rounded-full border", mindMap.backgroundColor === color && "ring-2 ring-primary ring-offset-2")}
                                            style={{ backgroundColor: color }} />
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Grid Style</Label>
                                <ToggleGroup type="single" value={mindMap.backgroundGrid || 'dotted'} onValueChange={(value) => value && handleSettingChange({ backgroundGrid: value as any })}>
                                    <ToggleGroupItem value="dotted" aria-label="Dotted grid"><Grid3x3 /></ToggleGroupItem>
                                    <ToggleGroupItem value="lined" aria-label="Lined"><List /></ToggleGroupItem>
                                    <ToggleGroupItem value="plain" aria-label="Plain"><Baseline /></ToggleGroupItem>
                                </ToggleGroup>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
                <Button variant="outline" onClick={handleExportPNG}><Download /> Export PNG</Button>
                <Button variant="outline" onClick={handleExportPDF}><Download /> Export PDF</Button>
            </div>
        </div>

        <Card 
          className={cn("flex-1 relative overflow-hidden canvas-container", {
              'whiteboard-bg-dotted': mindMap.backgroundGrid === 'dotted' || !mindMap.backgroundGrid,
              'whiteboard-bg-lined': mindMap.backgroundGrid === 'lined',
              'whiteboard-bg-plain': mindMap.backgroundGrid === 'plain',
          })}
          style={{ backgroundColor: mindMap.backgroundColor }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
            <div className="absolute top-2 right-2 z-10 text-xs font-mono text-muted-foreground p-1 bg-card/50 rounded">
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'saved' && 'Saved!'}
            </div>
            <div data-toolbar="true" className="absolute top-4 left-4 z-10 bg-card/60 backdrop-blur-md p-2 rounded-lg shadow-lg flex gap-1 border">
                <Button variant={currentTool === 'select' ? 'secondary' : 'ghost'} size="icon" onClick={() => setCurrentTool('select')}><MousePointer/></Button>
                <Button variant={currentTool === 'pan' ? 'secondary' : 'ghost'} size="icon" onClick={() => setCurrentTool('pan')}><Move/></Button>
                <Button variant="ghost" size="icon" onClick={() => addNode()}><PlusCircle/></Button>
                <Button variant={connectingNodeId ? 'secondary' : 'ghost'} size="icon" onClick={() => setConnectingNodeId(selectedNodeId)}><LinkIcon/></Button>
                 <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex <= 0}><Undo/></Button>
                <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}><Redo/></Button>
            </div>
            
            {selectedNode && (
                 <div data-toolbar="true" className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-card/60 backdrop-blur-md p-2 rounded-lg shadow-lg flex gap-1 items-center border">
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
            
             <div className="absolute bottom-4 right-4 z-10 bg-card/60 backdrop-blur-md p-2 rounded-lg shadow-lg flex flex-col gap-1 border">
                <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.min(s * 1.2, 5))}><Plus/></Button>
                <Button variant="ghost" size="icon" onClick={() => setScale(s => Math.max(s * 0.8, 0.1))}><Minus/></Button>
                <Button variant="ghost" size="icon" onClick={fitToScreen}><Expand/></Button>
                <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize/> : <Maximize/>}
                </Button>
            </div>


            <div className="w-full h-full relative" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0' }}>
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ transform: `translate(${-offset.x/scale}px, ${-offset.y/scale}px)`}}>
                    <g style={{ transform: `translate(${offset.x/scale}px, ${offset.y/scale}px)`}}>
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
                    </g>
                </svg>

                <div>
                    {nodes.map(node => (
                        <div
                            key={node.id}
                            id={`node-${node.id}`}
                            className={cn('mindmap-node absolute rounded-lg shadow-lg flex items-center justify-center group', 
                            {'cursor-pointer': currentTool === 'select' || currentTool === 'connect'},
                            selectedNodeId === node.id && 'ring-2 ring-primary')}
                            style={{
                                left: node.x,
                                top: node.y,
                                width: node.width,
                                height: node.height,
                                backgroundColor: node.backgroundColor,
                                color: node.color,
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                             <div 
                                className="drag-handle absolute top-1/2 -left-3 -translate-y-1/2 p-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
                                onMouseDown={(e) => e.stopPropagation()}
                             >
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <textarea 
                                value={node.title}
                                onChange={(e) => handleNodeUpdate(node.id, { title: e.target.value })}
                                onBlur={handleNodeBlur}
                                className={cn(
                                    "bg-transparent text-center focus:outline-none w-full h-full resize-none p-2",
                                    node.isBold && 'font-bold',
                                    node.isItalic && 'italic',
                                    node.isUnderline && 'underline',
                                )}
                                style={{color: node.color}}
                                rows={node.title.split('\n').length || 1}
                                onFocus={(e) => e.target.select()}
                            />
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 z-20">
                                <Button size="icon" className="h-6 w-6 rounded-full" onClick={(e) => { e.stopPropagation(); addNode(node.id); }}><Plus /></Button>
                            </div>
                             <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-20">
                                <Button size="icon" variant="destructive" className="h-6 w-6 rounded-full" onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }}><Trash2 /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    </div>
  );
}
