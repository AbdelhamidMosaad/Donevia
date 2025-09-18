
'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  MousePointer,
  Pen,
  Type,
  StickyNote,
  RectangleHorizontal,
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
  Image as ImageIcon,
} from 'lucide-react';
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
} from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from 'use-debounce';
import type { Whiteboard as WhiteboardType, WhiteboardNode, WhiteboardConnection } from '@/lib/types';
import { WhiteboardCanvas } from './whiteboard-canvas';
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


type Tool = 'select' | 'pen' | 'text' | 'sticky' | 'shape' | 'arrow' | 'connect' | 'image';
type ShapeType = 'rectangle' | 'circle';
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

const colorPalette = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#333333'];
const backgroundColors = ['#FFFFFF', '#F8F9FA', '#E9ECEF', '#FFF9C4', '#F1F3F5'];

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

export default function DigitalWhiteboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const whiteboardId = params.whiteboardId as string;

  const [boardData, setBoardData] = useState<WhiteboardType | null>(null);
  const [nodes, setNodes] = useState<Record<string, WhiteboardNode>>({});
  const [connections, setConnections] = useState<WhiteboardConnection[]>([]);
  
  const [boardName, setBoardName] = useState('');
  
  const [tool, setTool] = useState<Tool>('select');
  const [shapeType, setShapeType] = useState<ShapeType>('rectangle');
  const [currentColor, setCurrentColor] = useState('#333333');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [fontSize, setFontSize] = useState(16);

  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  
  const [history, setHistory] = useState<{ nodes: Record<string, WhiteboardNode>, connections: WhiteboardConnection[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [presence, setPresence] = useState<Record<string, Presence>>({});

  const [isFullscreen, setIsFullscreen] = useState(false);
  const whiteboardContainerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const [layoutDirection, setLayoutDirection] = useState<LayoutDirection>('right');
  const [showMinimap, setShowMinimap] = useState(true);
  const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);

  // Firestore Refs
  const getBoardDocRef = useCallback(() => {
    if (!user || !whiteboardId) return null;
    return doc(db, 'users', user.uid, 'whiteboards', whiteboardId);
  }, [user, whiteboardId]);
  
  // Load initial data
  useEffect(() => {
    const boardRef = getBoardDocRef();
    if (boardRef) {
      const unsubBoard = onSnapshot(boardRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data() as WhiteboardType;
          setBoardData(data);
          setConnections(data.connections || []);
          setBoardName(data.name);
        } else {
          toast({ variant: 'destructive', title: 'Whiteboard not found.' });
          router.push('/whiteboard');
        }
      });

      const nodesRef = collection(db, 'users', user.uid, 'whiteboards', whiteboardId, 'nodes');
      const unsubNodes = onSnapshot(nodesRef, (snapshot) => {
        const newNodes: Record<string, WhiteboardNode> = {};
        snapshot.forEach(doc => {
            if(!doc.data().isDeleted) {
                newNodes[doc.id] = { id: doc.id, ...doc.data() } as WhiteboardNode;
            }
        });
        setNodes(newNodes);

        if (historyIndex === -1 && Object.keys(newNodes).length > 0) {
            setHistory([{ nodes: newNodes, connections: boardData?.connections || [] }]);
            setHistoryIndex(0);
        }
      });
      
      const presenceRef = collection(db, 'users', user.uid, 'whiteboards', whiteboardId, 'presence');
      const unsubPresence = onSnapshot(presenceRef, (snapshot) => {
        const newPresence: Record<string, Presence> = {};
        snapshot.forEach(doc => {
            if(doc.id !== user?.uid) {
                newPresence[doc.id] = doc.data() as Presence;
            }
        });
        setPresence(newPresence);
      });

      return () => {
        unsubBoard();
        unsubNodes();
        unsubPresence();
      };
    }
  }, [user, whiteboardId, toast, router, getBoardDocRef, historyIndex]);
  
  const pushToHistory = (newNodes: Record<string, WhiteboardNode>, newConnections: WhiteboardConnection[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: newNodes, connections: newConnections });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }

  const createNode = async (newNode: Omit<WhiteboardNode, 'id' | 'userId'| 'createdAt' | 'updatedAt' | 'zIndex'>): Promise<WhiteboardNode> => {
    if(!user) throw new Error("User not authenticated");
    const nodeRef = doc(collection(db, 'users', user.uid, 'whiteboards', whiteboardId, 'nodes'));
    const maxZIndex = Math.max(0, ...Object.values(nodes).map(n => n.zIndex || 0));
    const finalNode = { ...newNode, id: nodeRef.id, userId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), zIndex: maxZIndex + 1 };
    const cleanedNode = deepCleanUndefined(finalNode);
    await setDoc(nodeRef, cleanedNode);

    const updatedNodes = { ...nodes, [nodeRef.id]: cleanedNode as WhiteboardNode };
    pushToHistory(updatedNodes, connections);

    return cleanedNode as WhiteboardNode;
  }
  
  const handleMapNameChange = useDebouncedCallback(async (newName: string) => {
    const boardRef = getBoardDocRef();
    if (boardRef && boardData && newName.trim() !== boardData.name) {
      await updateDoc(boardRef, { name: newName.trim(), updatedAt: serverTimestamp() });
      toast({ title: "Whiteboard renamed!" });
    }
  }, 1000);
  
   const updatePresence = useCallback(throttle(async (pos: {x:number, y:number}) => {
       if(!user) return;
       const presenceRef = doc(db, 'users', user.uid, 'whiteboards', whiteboardId, 'presence', user.uid);
       await setDoc(presenceRef, {
           userId: user.uid,
           name: user.displayName,
           photoURL: user.photoURL,
           color: '#4361EE', 
           x: pos.x,
           y: pos.y,
           lastSeen: serverTimestamp()
       }, { merge: true });
   }, 200), [user, whiteboardId]);

    const handleNodeChange = useDebouncedCallback((id: string, newAttrs: Partial<WhiteboardNode>) => {
        setNodes(prev => ({
            ...prev,
            [id]: { ...prev[id], ...newAttrs } as WhiteboardNode,
        }));
        
        if (!user) return;
        const nodeRef = doc(db, 'users', user.uid, 'whiteboards', whiteboardId, 'nodes', id);
        const cleanedAttrs = deepCleanUndefined({ ...newAttrs, updatedAt: serverTimestamp() });
        updateDoc(nodeRef, cleanedAttrs);
    }, 50);

    const handleNodeChangeComplete = () => {
        pushToHistory(nodes, connections);
    };

    const deleteSelectedNodes = () => {
        if (!user || selectedNodeIds.length === 0) return;
        
        const batch = writeBatch(db);
        selectedNodeIds.forEach(nodeId => {
            const nodeRef = doc(db, 'users', user.uid, 'whiteboards', whiteboardId, 'nodes', nodeId);
            batch.update(nodeRef, { isDeleted: true, updatedAt: serverTimestamp() });
        });

        batch.commit();
        
        const newNodes = { ...nodes };
        selectedNodeIds.forEach(id => delete newNodes[id]);
        
        const newConnections = connections.filter(c => !selectedNodeIds.includes(c.from) && !selectedNodeIds.includes(c.to));

        pushToHistory(newNodes, newConnections);
        if(boardData) {
            updateDoc(getBoardDocRef()!, { connections: newConnections });
        }
        
        setSelectedNodeIds([]);
    };

    const handleLayerAction = (direction: 'front' | 'back') => {
        if (selectedNodeIds.length !== 1) return;
        const nodeId = selectedNodeIds[0];
        const node = nodes[nodeId];
        if (!node) return;

        const sortedNodes = Object.values(nodes).sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0));
        let newZIndex = node.zIndex || 0;

        if (direction === 'front') {
            newZIndex = (sortedNodes[sortedNodes.length - 1]?.zIndex || 0) + 1;
        } else { // back
            newZIndex = (sortedNodes[0]?.zIndex || 0) - 1;
        }

        handleNodeChange(nodeId, { zIndex: newZIndex });
        handleNodeChangeComplete();
    };

    const duplicateSelectedNodes = async () => {
        if (!user || selectedNodeIds.length === 0) return;

        const newNodes: Record<string, WhiteboardNode> = { ...nodes };
        const batch = writeBatch(db);

        for (const nodeId of selectedNodeIds) {
            const originalNode = nodes[nodeId];
            if (originalNode) {
                const newNodeRef = doc(collection(db, 'users', user.uid, 'whiteboards', whiteboardId, 'nodes'));
                const newNodeData: WhiteboardNode = {
                    ...originalNode,
                    id: newNodeRef.id,
                    x: originalNode.x + 20,
                    y: originalNode.y + 20,
                    createdAt: serverTimestamp() as any,
                    updatedAt: serverTimestamp() as any,
                };
                const cleanedNode = deepCleanUndefined(newNodeData);
                batch.set(newNodeRef, cleanedNode);
                newNodes[newNodeRef.id] = cleanedNode as WhiteboardNode;
            }
        }

        await batch.commit();
        pushToHistory(newNodes, connections);
        toast({ title: `${selectedNodeIds.length} object(s) duplicated` });
    };

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            const nodesToRestore = history[newIndex].nodes;
            const connectionsToRestore = history[newIndex].connections;
            setNodes(nodesToRestore);
            setConnections(connectionsToRestore);
            
            const batch = writeBatch(db);
            const currentIds = Object.keys(nodes);
            const restoredIds = Object.keys(nodesToRestore);

            const deletedIds = currentIds.filter(id => !restoredIds.includes(id));
            deletedIds.forEach(id => {
                const nodeRef = doc(db, 'users', user.uid, 'whiteboards', whiteboardId, 'nodes', id);
                batch.update(nodeRef, { isDeleted: true });
            });
            
            Object.values(nodesToRestore).forEach(node => {
                 const nodeRef = doc(db, 'users', user.uid, 'whiteboards', whiteboardId, 'nodes', node.id);
                 batch.set(nodeRef, deepCleanUndefined(node), { merge: true });
            });

            if (boardData) {
                batch.update(getBoardDocRef()!, { connections: connectionsToRestore });
            }

            batch.commit();
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            const nodesToRedo = history[newIndex].nodes;
            const connectionsToRedo = history[newIndex].connections;
            setNodes(nodesToRedo);
            setConnections(connectionsToRedo);

            const batch = writeBatch(db);
            Object.values(nodesToRedo).forEach(node => {
                 const nodeRef = doc(db, 'users', user.uid, 'whiteboards', whiteboardId, 'nodes', node.id);
                 batch.set(nodeRef, deepCleanUndefined(node), { merge: true });
            });
             if (boardData) {
                batch.update(getBoardDocRef()!, { connections: connectionsToRedo });
            }
            batch.commit();
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement;
            const isEditingText = activeElement?.tagName === 'TEXTAREA' || (activeElement instanceof HTMLInputElement && activeElement.type === 'text');

            if (isEditingText) return;
            
            if (e.key === 'v') setTool('select');
            if (e.key === 'p') setTool('pen');
            if (e.key === 't') setTool('text');
            if (e.key === 'r') { setTool('shape'); setShapeType('rectangle'); }
            if (e.key === 'o') { setTool('shape'); setShapeType('circle'); }
            if (e.key === 'c') setTool('connect');

            if (e.key === 'Delete' || e.key === 'Backspace') {
                deleteSelectedNodes();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                setSelectedNodeIds(Object.keys(nodes));
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
            }
             if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                duplicateSelectedNodes();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeIds, undo, redo, nodes]);


  const toggleFullscreen = () => {
    const elem = whiteboardContainerRef.current;
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
    const nodeList = Object.values(nodes);
    if (nodeList.length === 0) {
      toast({ variant: "destructive", title: "Cannot export an empty whiteboard." });
      return null;
    }

    const minX = Math.min(...nodeList.map(n => n.x - (n.width || 0) / 2));
    const minY = Math.min(...nodeList.map(n => n.y - (n.height || 0) / 2));
    const maxX = Math.max(...nodeList.map(n => n.x + (n.width || 0) / 2));
    const maxY = Math.max(...nodeList.map(n => n.y + (n.height || 0) / 2));

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

    exportCtx.fillStyle = boardData?.backgroundColor || '#FFFFFF';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    const drawOffsetX = -minX + padding;
    const drawOffsetY = -minY + padding;

    connections.forEach(conn => {
      const from = nodes[conn.from];
      const to = nodes[conn.to];
      if (!from || !to) return;
      exportCtx.strokeStyle = conn.color || '#333333';
      exportCtx.lineWidth = conn.strokeWidth || 2;
      exportCtx.beginPath();
      exportCtx.moveTo(from.x + drawOffsetX, from.y + drawOffsetY);
      exportCtx.lineTo(to.x + drawOffsetX, to.y + drawOffsetY);
      exportCtx.stroke();
    });

    nodeList.sort((a,b) => (a.zIndex || 0) - (b.zIndex || 0)).forEach(node => {
      const x = node.x + drawOffsetX;
      const y = node.y + drawOffsetY;
      
      if(node.type === 'pen' && node.points) {
          exportCtx.strokeStyle = node.color || '#333';
          exportCtx.lineWidth = node.strokeWidth || 4;
          exportCtx.lineCap = 'round';
          exportCtx.lineJoin = 'round';
          exportCtx.beginPath();
          for(let i = 0; i < node.points.length; i += 2) {
              const pointX = (node.points[i]) + drawOffsetX;
              const pointY = (node.points[i+1]) + drawOffsetY;
              if (i === 0) {
                  exportCtx.moveTo(pointX, pointY);
              } else {
                  exportCtx.lineTo(pointX, pointY);
              }
          }
          exportCtx.stroke();
      } else {
          exportCtx.fillStyle = node.color || '#333';
          exportCtx.fillRect(x - (node.width || 0) / 2, y - (node.height || 0) / 2, node.width || 0, node.height || 0);
          if (node.text) {
              exportCtx.fillStyle = node.type === 'sticky' ? '#333' : '#fff';
              exportCtx.font = `${node.fontSize || 16}px sans-serif`;
              exportCtx.textAlign = 'center';
              exportCtx.textBaseline = 'middle';
              exportCtx.fillText(node.text, x, y);
          }
      }
    });

    return exportCanvas;
  };
  
  const handleExportPNG = () => {
    const exportCanvas = createExportCanvas();
    if (!exportCanvas) return;

    const dataURL = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${boardName || 'whiteboard'}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Your whiteboard is being downloaded as a PNG." });
  };
  
  const handleExportPDF = () => {
    const exportCanvas = createExportCanvas();
    if (!exportCanvas) return;
    
    const imgData = exportCanvas.toDataURL('image/jpeg', 0.8);
    const pdf = new jsPDF({
        orientation: exportCanvas.width > exportCanvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [exportCanvas.width, exportCanvas.height]
    });
    pdf.addImage(imgData, 'JPEG', 0, 0, exportCanvas.width, exportCanvas.height);
    pdf.save(`${boardName || 'whiteboard'}.pdf`);
    toast({ title: "Export Successful", description: "Your whiteboard is being downloaded as a PDF." });
  };
  
  const handleSettingChange = async (setting: Partial<WhiteboardType>) => {
      const boardRef = getBoardDocRef();
      if(boardRef && boardData) {
          await updateDoc(boardRef, setting);
      }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];
    const storage = getStorage();
    const filePath = `users/${user.uid}/whiteboards/${whiteboardId}/images/${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, filePath);

    try {
        await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(fileRef);
        await createNode({
            type: 'image',
            x: 200, y: 200,
            width: 200, height: 200,
            src: downloadURL,
        });
        toast({ title: 'Image uploaded successfully!' });
    } catch(err) {
        toast({ variant: 'destructive', title: 'Image upload failed' });
    }
  }

  const selectedNode = selectedNodeIds.length === 1 ? nodes[selectedNodeIds[0]] : null;

  if (!boardData) {
      return (
          <div className="flex items-center justify-center h-full">
            <p>Loading whiteboard...</p>
          </div>
      );
  }

  return (
    <div ref={whiteboardContainerRef} className={cn("flex flex-col h-full gap-4", isFullscreen && "bg-background")}>
        <div className={cn("flex justify-between items-center", isFullscreen && "hidden")}>
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push('/whiteboard')}><ArrowLeft /></Button>
                <Input 
                    value={boardName}
                    onChange={(e) => {
                        setBoardName(e.target.value);
                        handleMapNameChange(e.target.value);
                    }}
                    className="text-3xl font-bold font-headline h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
            </div>
             <div className="flex items-center gap-2">
                 <div className="flex -space-x-2">
                    {Object.values(presence).map(p => (
                        <Avatar key={p.userId} className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={p.photoURL} alt={p.name} />
                            <AvatarFallback>{p.name?.[0]}</AvatarFallback>
                        </Avatar>
                    ))}
                 </div>
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
                                            className={cn("w-8 h-8 rounded-full border", boardData.backgroundColor === color && "ring-2 ring-primary ring-offset-2")}
                                            style={{ backgroundColor: color }} />
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Grid Style</Label>
                                <ToggleGroup type="single" value={boardData.backgroundGrid || 'dotted'} onValueChange={(value) => value && handleSettingChange({ backgroundGrid: value as any })}>
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

        <div className="flex-1 relative">
            <div className={cn("absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-card/60 backdrop-blur-md p-1 rounded-lg shadow-lg flex gap-1 border", isToolbarCollapsed && 'items-center')}>
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)}>
                    {isToolbarCollapsed ? <PanelLeftOpen/> : <PanelLeftClose />}
                 </Button>
                {!isToolbarCollapsed && (
                    <ToggleGroup type="single" value={tool} onValueChange={(t: Tool) => t && setTool(t)}>
                        <ToggleGroupItem value="select"><MousePointer/></ToggleGroupItem>
                        <ToggleGroupItem value="pen"><Pen/></ToggleGroupItem>
                        <ToggleGroupItem value="text"><Type/></ToggleGroupItem>
                        <ToggleGroupItem value="sticky"><StickyNote/></ToggleGroupItem>
                        <ToggleGroupItem value="shape"><RectangleHorizontal/></ToggleGroupItem>
                        <ToggleGroupItem value="arrow"><ArrowUpRight/></ToggleGroupItem>
                        <ToggleGroupItem value="connect"><LinkIcon/></ToggleGroupItem>
                         <ToggleGroupItem value="image" onClick={() => imageInputRef.current?.click()}><ImageIcon/></ToggleGroupItem>
                         <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </ToggleGroup>
                )}
            </div>
            
            {(tool === 'shape' && !isToolbarCollapsed) && (
                 <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-card/60 backdrop-blur-md p-1 rounded-lg shadow-lg flex gap-1 border">
                    <ToggleGroup type="single" value={shapeType} onValueChange={(s: ShapeType) => s && setShapeType(s)}>
                        <ToggleGroupItem value="rectangle"><RectangleHorizontal/></ToggleGroupItem>
                        <ToggleGroupItem value="circle"><Circle/></ToggleGroupItem>
                    </ToggleGroup>
                </div>
            )}
            
            {selectedNode && (
                 <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-card/60 backdrop-blur-md p-1 rounded-lg shadow-lg flex gap-1 border items-center">
                    <Popover>
                        <PopoverTrigger asChild><Button variant="ghost" size="icon" style={{color: selectedNode.color}}><Palette/></Button></PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                           <div className="flex gap-1">
                            {colorPalette.map(c => (
                                <button key={c} style={{backgroundColor: c}} className="h-6 w-6 rounded-full border" onClick={() => selectedNodeIds.forEach(id => handleNodeChange(id, { color: c}))} />
                            ))}
                           </div>
                        </PopoverContent>
                    </Popover>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    {selectedNode.type !== 'pen' && (
                        <>
                           <Slider
                                value={[selectedNode.fontSize || 16]}
                                onValueChange={(v) => selectedNodeIds.forEach(id => handleNodeChange(id, { fontSize: v[0] }))}
                                onValueCommit={handleNodeChangeComplete}
                                max={64} min={8} step={1} className="w-24"
                            />
                        </>
                    )}
                     {selectedNode.type === 'pen' && (
                        <Slider
                            value={[selectedNode.strokeWidth || 4]}
                            onValueChange={(v) => selectedNodeIds.forEach(id => handleNodeChange(id, { strokeWidth: v[0] }))}
                            onValueCommit={handleNodeChangeComplete}
                            max={20} min={1} step={1} className="w-24"
                        />
                    )}
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" onClick={() => handleLayerAction('front')}><FlipVertical className="transform rotate-180" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleLayerAction('back')}><FlipVertical /></Button>
                     <Button variant="ghost" size="icon" onClick={() => duplicateSelectedNodes()}><Copy /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteSelectedNodes()}><Trash2 /></Button>
                 </div>
            )}


            <div className="absolute bottom-4 left-4 z-20 bg-card/60 backdrop-blur-md p-1 rounded-lg shadow-lg flex flex-col gap-1 border">
                <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex <= 0}><Undo/></Button>
                <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}><Redo/></Button>
            </div>
            
            <div className="absolute bottom-4 right-4 z-20 flex items-end gap-2">
                 {showMinimap && (
                    <div className="w-48 h-36 bg-card/80 border rounded-lg overflow-hidden relative">
                         <WhiteboardCanvas 
                            boardData={boardData} nodes={Object.values(nodes)} tool={'select'} shapeType={shapeType} currentColor={currentColor} strokeWidth={strokeWidth} fontSize={fontSize}
                            selectedNodeId={null} editingNodeId={null} presence={{}} onNodeCreate={async() => ({} as any)} onNodeChange={() => {}} onNodeChangeComplete={() => {}}
                            onNodeDelete={() => {}} onSelectNode={() => {}} onEditNode={() => {}} onUpdatePresence={() => {}}
                            isMinimap={true} connections={connections} onConnectionCreate={() => {}} onConnectionDelete={() => {}}
                        />
                    </div>
                 )}
                 <div className="bg-card/60 backdrop-blur-md p-1 rounded-lg shadow-lg flex flex-col gap-1 border">
                    <Button variant="ghost" size="icon" onClick={() => setShowMinimap(!showMinimap)}><Map/></Button>
                    <Separator />
                    <Button variant="ghost" size="icon" onClick={() => {
                        const newScale = Math.min((boardData.scale || 1) * 1.2, 5);
                        handleSettingChange({scale: newScale});
                    }}><Plus/></Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                        const newScale = Math.max((boardData.scale || 1) * 0.8, 0.1);
                        handleSettingChange({scale: newScale});
                    }}><Minus/></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleSettingChange({scale: 1})}><Expand/></Button>
                    <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                        {isFullscreen ? <Minimize/> : <Maximize/>}
                    </Button>
                </div>
            </div>


            <WhiteboardCanvas 
                boardData={boardData}
                nodes={Object.values(nodes)}
                tool={tool}
                shapeType={shapeType}
                currentColor={currentColor}
                strokeWidth={strokeWidth}
                fontSize={fontSize}
                selectedNodeId={selectedNodeIds.length === 1 ? selectedNodeIds[0] : null}
                editingNodeId={editingNodeId}
                presence={presence}
                onNodeCreate={createNode}
                onNodeChange={handleNodeChange}
                onNodeChangeComplete={handleNodeChangeComplete}
                onNodeDelete={(nodeId) => updateDoc(doc(db, 'users', user!.uid, 'whiteboards', whiteboardId, 'nodes', nodeId), { isDeleted: true })}
                onSelectNode={(id) => {
                    if(tool === 'connect') {
                        if(!connectingNodeId) {
                            setConnectingNodeId(id);
                        } else if(id) {
                            const newConnections = [...connections, { from: connectingNodeId, to: id, color: currentColor, strokeWidth: strokeWidth }];
                            setConnections(newConnections);
                            updateDoc(getBoardDocRef()!, { connections: newConnections });
                            setConnectingNodeId(null);
                        }
                    } else {
                        if(id) {
                            setSelectedNodeIds(prev =>
                                window.event?.shiftKey ?
                                    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                                : [id]
                            );
                        } else {
                            setSelectedNodeIds([]);
                        }
                        setEditingNodeId(null);
                    }
                }}
                onEditNode={setEditingNodeId}
                onUpdatePresence={updatePresence}
                connections={connections}
                onConnectionCreate={(from, to) => {
                    const newConnections = [...connections, { from, to, color: currentColor, strokeWidth: strokeWidth }];
                    setConnections(newConnections);
                    updateDoc(getBoardDocRef()!, { connections: newConnections });
                }}
                 onConnectionDelete={(from, to) => {
                    const newConnections = connections.filter(c => !(c.from === from && c.to === to));
                    setConnections(newConnections);
                    updateDoc(getBoardDocRef()!, { connections: newConnections });
                }}
            />
        </div>
    </div>
  );
}
