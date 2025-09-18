
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MousePointer,
  Pen,
  Eraser,
  Type,
  StickyNote,
  Square,
  Circle,
  Move,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Expand,
  Save,
  Download,
  Settings,
  Grid3x3,
  List,
  Baseline,
  ArrowLeft,
  Palette,
  Minus,
  Maximize,
  Minimize
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Whiteboard, WhiteboardNode } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '../ui/input';
import { WhiteboardNodeComponent } from './whiteboard-node';
import { Label } from '../ui/label';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Slider } from '../ui/slider';
import { Separator } from '../ui/separator';

type Tool = 'select' | 'pan' | 'pen' | 'eraser' | 'text' | 'sticky' | 'shape';
type ShapeType = 'rectangle' | 'circle';

const backgroundColors = ['#FFFFFF', '#F8F9FA', '#E9ECEF', '#FFF9C4', '#F1F3F5'];
const toolColors = ['#000000', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6'];


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
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [currentShape, setCurrentShape] = useState<ShapeType>('rectangle');
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  const isPanning = useRef(false);
  const isDrawing = useRef(false);
  const drawingNodeId = useRef<string | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const whiteboardContainerRef = useRef<HTMLDivElement>(null);
  
  // Firestore Integration
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
      const dataToSave: Partial<Whiteboard> & { updatedAt: Date } = { updatedAt: new Date() };
      if (updatedNodes) dataToSave.nodes = updatedNodes;
      if (updatedSettings) Object.assign(dataToSave, updatedSettings);
      
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
    setWhiteboard(prev => ({ ...(prev || {name:'', createdAt: new Date(), updatedAt: new Date(), ownerId: ''}), ...setting }));
    saveBoard(nodes, setting);
  };
  
   const handleNodeChange = (nodeId: string, updates: Partial<WhiteboardNode>) => {
    setNodes(prevNodes => {
        const newNodes = prevNodes.map(n => n.id === nodeId ? { ...n, ...updates } : n);
        saveBoard(newNodes);
        return newNodes;
    });
  };
  
   const addNode = (type: WhiteboardNode['type'], options?: Partial<WhiteboardNode>) => {
    const canvasContainer = whiteboardContainerRef.current;
    if (!canvasContainer) return;
    
    const viewCenterX = (canvasContainer.clientWidth / 2 - offset.x) / scale;
    const viewCenterY = (canvasContainer.clientHeight / 2 - offset.y) / scale;

    const newNode: WhiteboardNode = {
      id: uuidv4(),
      type,
      x: viewCenterX,
      y: viewCenterY,
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 50 : 100,
      rotation: 0,
      color: type === 'sticky' ? '#ffd166' : type === 'pen' ? currentColor : '#ffffff',
      strokeColor: type === 'shape' ? currentColor : undefined,
      strokeWidth: type === 'shape' ? brushSize : undefined,
      text: type === 'sticky' || type === 'text' ? 'Text' : undefined,
      shape: type === 'shape' ? currentShape : undefined,
      points: type === 'pen' ? [] : undefined,
      ...options,
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    saveBoard(newNodes);
    setSelectedNodeId(newNode.id);
  };
  
  const deleteNode = (nodeId: string) => {
    const newNodes = nodes.filter(n => n.id !== nodeId);
    setNodes(newNodes);
    saveBoard(newNodes);
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };
  
  const getCanvasCoordinates = (e: React.MouseEvent) => {
    const rect = whiteboardContainerRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / scale;
    const y = (e.clientY - rect.top - offset.y) / scale;
    return { x, y };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.react-rnd')) return; // Ignore clicks on nodes

    if (e.button === 1 || currentTool === 'pan') {
      isPanning.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    
    setSelectedNodeId(null);

    const { x, y } = getCanvasCoordinates(e);

    if (currentTool === 'pen') {
        isDrawing.current = true;
        const newDrawingNode: WhiteboardNode = {
            id: uuidv4(),
            type: 'pen',
            points: [[x, y]],
            x, y, width: 0, height: 0,
            color: currentColor,
            strokeWidth: brushSize,
        };
        setNodes(prev => [...prev, newDrawingNode]);
        drawingNodeId.current = newDrawingNode.id;
    }
     else if (currentTool === 'text' || currentTool === 'sticky' || currentTool === 'shape') {
        addNode(currentTool, { x, y });
        setCurrentTool('select');
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
    
    if (isDrawing.current && currentTool === 'pen' && drawingNodeId.current) {
        const {x, y} = getCanvasCoordinates(e);
        setNodes(prevNodes => prevNodes.map(n => {
            if (n.id === drawingNodeId.current) {
                const newPoints = [...(n.points || []), [x,y]];
                const minX = Math.min(...newPoints.map(p => p[0]));
                const minY = Math.min(...newPoints.map(p => p[1]));
                const maxX = Math.max(...newPoints.map(p => p[0]));
                const maxY = Math.max(...newPoints.map(p => p[1]));

                return {
                    ...n,
                    points: newPoints,
                    x: minX, y: minY,
                    width: maxX - minX, height: maxY - minY,
                };
            }
            return n;
        }));
    }
  };

  const handleCanvasMouseUp = () => {
    isPanning.current = false;
    if (isDrawing.current) {
      isDrawing.current = false;
      drawingNodeId.current = null;
      saveBoard(nodes);
    }
  };
  
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const newScale = e.deltaY > 0 ? scale * (1 - zoomSpeed) : scale * (1 + zoomSpeed);
    const clampedScale = Math.min(Math.max(newScale, 0.1), 5);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const pointX = (mouseX - offset.x) / scale;
    const pointY = (mouseY - offset.y) / scale;

    const newOffsetX = mouseX - pointX * clampedScale;
    const newOffsetY = mouseY - pointY * clampedScale;

    setScale(clampedScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };
  
  if (!whiteboard) return <div>Loading whiteboard...</div>;
  
  return (
    <div className="flex flex-col h-full gap-4">
        <div className="flex items-center justify-between gap-4">
           <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => router.push('/whiteboard')}><ArrowLeft /></Button>
              <Input 
                  value={boardName}
                  onChange={(e) => {
                      setBoardName(e.target.value);
                      handleNameChange(e.target.value);
                  }}
                  className="text-lg font-bold font-headline h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
           </div>
        </div>

         <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex gap-1 bg-card p-2 rounded-lg shadow-lg border">
            <ToggleGroup type="single" value={currentTool} onValueChange={(v) => v && setCurrentTool(v as Tool)} className="flex-row gap-1">
                <ToggleGroupItem value="select" aria-label="Select"><MousePointer/></ToggleGroupItem>
                <ToggleGroupItem value="pan" aria-label="Pan"><Move/></ToggleGroupItem>
                <ToggleGroupItem value="pen" aria-label="Pen"><Pen/></ToggleGroupItem>
                <ToggleGroupItem value="eraser" aria-label="Eraser"><Eraser/></ToggleGroupItem>
                <ToggleGroupItem value="text" aria-label="Text"><Type/></ToggleGroupItem>
                <ToggleGroupItem value="sticky" aria-label="Sticky Note"><StickyNote/></ToggleGroupItem>
                <ToggleGroupItem value="shape" aria-label="Shape"><Square/></ToggleGroupItem>
            </ToggleGroup>
            
            <Separator orientation="vertical" className="h-auto mx-2" />

            <Popover>
                <PopoverTrigger asChild><Button variant="ghost" size="icon" style={{color: currentColor}}><Palette/></Button></PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                    <div className="flex gap-1">
                        {toolColors.map(c => <button key={c} onClick={() => setCurrentColor(c)} className="h-6 w-6 rounded-full border" style={{backgroundColor: c}}/>)}
                    </div>
                </PopoverContent>
            </Popover>
            <Popover>
                <PopoverTrigger asChild><Button variant="ghost" size="sm" className="w-24">{brushSize}px</Button></PopoverTrigger>
                <PopoverContent className="w-40 p-2"><Slider value={[brushSize]} onValueChange={([v]) => setBrushSize(v)} max={50} step={1} /></PopoverContent>
            </Popover>
        </div>

        <div
            ref={whiteboardContainerRef}
            className={cn('flex-1 border rounded-lg overflow-hidden relative',
                currentTool === 'pan' && 'cursor-grab', isPanning.current && 'cursor-grabbing',
                currentTool === 'pen' ? 'cursor-crosshair' : 'cursor-auto',
                {'whiteboard-bg-dotted': whiteboard.backgroundGrid === 'dotted' || !whiteboard.backgroundGrid},
                {'whiteboard-bg-lined': whiteboard.backgroundGrid === 'lined'},
                {'whiteboard-bg-plain': whiteboard.backgroundGrid === 'plain'}
            )}
            style={{ backgroundColor: whiteboard.backgroundColor }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onWheel={handleWheel}
        >
            <div
                className="absolute top-0 left-0 w-full h-full"
                style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0' }}
            >
                {nodes.map(node => (
                    <WhiteboardNodeComponent
                        key={node.id}
                        node={node}
                        onNodeChange={handleNodeChange}
                        onDelete={deleteNode}
                        scale={scale}
                        isSelected={selectedNodeId === node.id}
                        onSelect={setSelectedNodeId}
                    />
                ))}
            </div>
        </div>
    </div>
  );
}

    