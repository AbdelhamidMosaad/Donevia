
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Bold,
  Italic,
  Underline,
  GitBranch,
  Save,
  Expand,
  Minus,
  Move,
  Maximize,
  Minimize,
  PanelLeftOpen,
  PanelLeftClose,
  Square,
  Circle,
  Settings,
  Grid3x3,
  List,
  Baseline,
  ArrowLeft,
  Pen,
  Eraser,
  Type,
  StickyNote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Whiteboard, WhiteboardNode } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { WhiteboardNodeComponent } from './whiteboard-node';

type Tool = 'select' | 'pen' | 'text' | 'sticky' | 'shape';
type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow' | 'triangle' | 'star' | 'heart';

const backgroundColors = ['#FFFFFF', '#F8F9FA', '#E9ECEF', '#FFF9C4', '#F1F3F5'];

export function DigitalWhiteboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const whiteboardId = params.whiteboardId as string;

  const [whiteboard, setWhiteboard] = useState<Whiteboard | null>(null);
  const [nodes, setNodes] = useState<WhiteboardNode[]>([]);
  const [boardName, setBoardName] = useState('');

  const [currentTool, setCurrentTool] = useState<Tool>('select');
  const [currentShape, setCurrentShape] = useState<ShapeType>('rectangle');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const [isToolbarCollapsed, setIsToolbarCollapsed] = useState(false);
  const whiteboardContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- Firestore Integration ---
  const getWhiteboardDocRef = useCallback(() => {
    if (!user || !whiteboardId) return null;
    return doc(db, 'users', user.uid, 'whiteboards', whiteboardId);
  }, [user, whiteboardId]);

  useEffect(() => {
    const boardRef = getWhiteboardDocRef();
    if (boardRef) {
      const unsub = onSnapshot(boardRef, (doc) => {
        if(doc.exists()) {
          const boardData = { id: doc.id, ...doc.data() } as Whiteboard;
          setWhiteboard(boardData);
          setNodes(boardData.nodes || []);
          setBoardName(boardData.name);
        } else {
          toast({ variant: 'destructive', title: 'Whiteboard not found.' });
          router.push('/whiteboard');
        }
      });
      return () => unsub();
    }
  }, [user, whiteboardId, getWhiteboardDocRef, router, toast]);

  const saveBoard = useDebouncedCallback(async (updatedNodes?: WhiteboardNode[], updatedSettings?: Partial<Whiteboard>) => {
    const boardRef = getWhiteboardDocRef();
    if (boardRef) {
      const dataToSave: Partial<Whiteboard> = { ...updatedSettings };
      if (updatedNodes) {
        dataToSave.nodes = updatedNodes;
      }
      await updateDoc(boardRef, dataToSave);
      toast({ title: "✓ Saved", description: "Your whiteboard has been saved."});
    }
  }, 1000);

  const handleNameChange = useDebouncedCallback(async (newName: string) => {
    const boardRef = getWhiteboardDocRef();
    if (boardRef && whiteboard && newName.trim() !== whiteboard.name) {
      await updateDoc(boardRef, { name: newName.trim(), updatedAt: new Date() });
      toast({ title: "Whiteboard renamed!" });
    }
  }, 1000);
  
  const handleSettingChange = (setting: Partial<Whiteboard>) => {
    setWhiteboard(prev => ({ ...(prev || {name:''}), ...setting }));
    saveBoard(nodes, setting);
  };
  
   const handleNodeChange = (nodeId: string, updates: Partial<WhiteboardNode>) => {
    const newNodes = nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n);
    setNodes(newNodes);
    saveBoard(newNodes);
  };
  
   const addNode = (type: WhiteboardNode['type'], options?: Partial<WhiteboardNode>) => {
    const canvasContainer = whiteboardContainerRef.current;
    if (!canvasContainer) return;
    
    const viewCenterX = (canvasContainer.clientWidth / 2 - offset.x) / scale;
    const viewCenterY = (canvasContainer.clientHeight / 2 - offset.y) / scale;

    const newNode: WhiteboardNode = {
      id: uuidv4(),
      type,
      x: viewCenterX - 75,
      y: viewCenterY - 50,
      width: 150,
      height: 100,
      rotation: 0,
      color: type === 'sticky' ? '#ffd166' : '#000000',
      text: type === 'sticky' || type === 'text' ? 'Text' : '',
      shape: type === 'shape' ? currentShape : undefined,
      ...options,
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    saveBoard(newNodes);
  };
  
  const deleteNode = (nodeId: string) => {
    const newNodes = nodes.filter(n => n.id !== nodeId);
    setNodes(newNodes);
    saveBoard(newNodes);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || (e.button === 0 && currentTool === 'pan')) { // Middle mouse or pan tool
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

   const toggleFullscreen = useCallback(() => {
    const elem = whiteboardContainerRef.current?.parentElement;
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        toast({ variant: 'destructive', title: 'Error entering fullscreen.', description: err.message });
      });
    } else {
      document.exitFullscreen();
    }
  }, [toast]);
  
  if (!whiteboard) {
    return <div>Loading whiteboard...</div>;
  }
  
  return (
    <div ref={whiteboardContainerRef} className={cn("flex flex-col h-full gap-4", isFullscreen && "bg-background")}>
        <div className="flex items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => router.push('/whiteboard')}><ArrowLeft /></Button>
              <Input 
                  value={boardName}
                  onChange={(e) => {
                      setBoardName(e.target.value);
                      handleNameChange(e.target.value);
                  }}
                  className="text-3xl font-bold font-headline h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
           </div>
           <div className="flex items-center gap-2">
              <Popover>
                  <PopoverTrigger asChild><Button variant="outline" size="icon"><Settings/></Button></PopoverTrigger>
                  <PopoverContent className="w-80">
                      <div className="grid gap-4">
                          <h4 className="font-medium leading-none">Settings</h4>
                          <div className="grid gap-2">
                              <Label>Background Color</Label>
                              <div className="flex flex-wrap gap-2">
                                  {backgroundColors.map(color => (
                                      <button key={color} onClick={() => handleSettingChange({ backgroundColor: color })}
                                          className={cn("w-8 h-8 rounded-full border", whiteboard.backgroundColor === color && "ring-2 ring-primary ring-offset-2")}
                                          style={{ backgroundColor: color }} />
                                  ))}
                              </div>
                          </div>
                           <div className="grid gap-2">
                             <Label>Grid Style</Label>
                             <ToggleGroup type="single" value={whiteboard.backgroundGrid || 'dotted'} onValueChange={(value) => value && handleSettingChange({ backgroundGrid: value as any })}>
                                <ToggleGroupItem value="dotted" aria-label="Dotted grid"><Grid3x3 /></ToggleGroupItem>
                                <ToggleGroupItem value="lined" aria-label="Lined"><List /></ToggleGroupItem>
                                <ToggleGroupItem value="plain" aria-label="Plain"><Baseline /></ToggleGroupItem>
                             </ToggleGroup>
                          </div>
                      </div>
                  </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize/> : <Maximize/>}
              </Button>
           </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
             <div className={cn("flex flex-col gap-4 p-2 border rounded-lg bg-card transition-all duration-300", isToolbarCollapsed ? 'md:w-16 items-center' : 'md:w-64')}>
                <div className="flex flex-col gap-2 w-full">
                     <Button variant="ghost" size="sm" onClick={() => setIsToolbarCollapsed(!isToolbarCollapsed)} className="w-full justify-start">
                        {isToolbarCollapsed ? <PanelLeftOpen/> : <PanelLeftClose />}
                        {!isToolbarCollapsed && 'Collapse'}
                    </Button>
                    <h3 className={cn("font-semibold px-2", isToolbarCollapsed && "hidden")}>Tools</h3>
                    <ToggleGroup type="single" value={currentTool} onValueChange={(v) => v && setCurrentTool(v as Tool)} className="flex-col gap-1 items-start">
                        <ToggleGroupItem value="select" className="w-full justify-start gap-2"><MousePointer/> {!isToolbarCollapsed && 'Select'}</ToggleGroupItem>
                        <ToggleGroupItem value="pan" className="w-full justify-start gap-2"><Move/> {!isToolbarCollapsed && 'Pan'}</ToggleGroupItem>
                        <ToggleGroupItem value="pen" className="w-full justify-start gap-2"><Pen/> {!isToolbarCollapsed && 'Pen'}</ToggleGroupItem>
                        <ToggleGroupItem value="text" className="w-full justify-start gap-2"><Type/> {!isToolbarCollapsed && 'Text'}</ToggleGroupItem>
                        <ToggleGroupItem value="sticky" className="w-full justify-start gap-2"><StickyNote/> {!isToolbarCollapsed && 'Sticky Note'}</ToggleGroupItem>
                        <ToggleGroupItem value="shape" className="w-full justify-start gap-2"><Square/> {!isToolbarCollapsed && 'Shape'}</ToggleGroupItem>
                    </ToggleGroup>
                     <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => currentTool === 'sticky' ? addNode('sticky') : currentTool === 'text' ? addNode('text') : addNode('shape')}><PlusCircle/> Add {currentTool}</Button>
                </div>
                 <div className="flex flex-col gap-2 mt-auto w-full">
                    <Button variant="outline" size="sm" onClick={() => {}} disabled><Undo/> {!isToolbarCollapsed && 'Undo'}</Button>
                    <Button variant="outline" size="sm" onClick={() => {}} disabled><Redo/> {!isToolbarCollapsed && 'Redo'}</Button>
                 </div>
            </div>
             <div
                className={cn('flex-1 border rounded-lg overflow-hidden relative cursor-auto',
                    {
                        'whiteboard-bg-dotted': whiteboard.backgroundGrid === 'dotted' || !whiteboard.backgroundGrid,
                        'whiteboard-bg-lined': whiteboard.backgroundGrid === 'lined',
                        'whiteboard-bg-plain': whiteboard.backgroundGrid === 'plain',
                    }
                )}
                style={{ backgroundColor: whiteboard.backgroundColor }}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
            >
                <div
                    className="absolute top-0 left-0"
                    style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0' }}
                >
                    {nodes.map(node => (
                        <WhiteboardNodeComponent
                            key={node.id}
                            node={node}
                            onNodeChange={handleNodeChange}
                            onDelete={deleteNode}
                            scale={scale}
                            isSelected={false} // Add selection logic later
                        />
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}

```