
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Pen,
  Eraser,
  Type,
  MousePointer,
  Undo,
  Redo,
  Trash2,
  ZoomIn,
  ZoomOut,
  RefreshCcw,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Star,
  Heart,
  GitBranch,
  StickyNote,
  PenSquare,
  Save,
  Settings,
  Palette,
  Grid3x3,
  List,
  Baseline,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useParams, useRouter } from 'next/navigation';
import type { Whiteboard } from '@/lib/types';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Label } from '../ui/label';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { useDebouncedCallback } from 'use-debounce';

type Tool = 'pen' | 'eraser' | 'text' | 'select' | 'shape';
type Shape =
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'triangle'
  | 'star'
  | 'heart';

const backgroundColors = [
    '#FFFFFF', '#F8F9FA', '#E9ECEF', '#FFF9C4', '#F1F3F5'
];

export function DigitalWhiteboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const whiteboardId = params.whiteboardId as string;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [whiteboard, setWhiteboard] = useState<Whiteboard | null>(null);
  const [boardName, setBoardName] = useState('');

  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const lastMousePos = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);

  // --- Initialization and Canvas Setup ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      setCtx(context);
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, []);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        redrawCanvas();
      }
    }
  };

  const redrawCanvas = useCallback(() => {
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (history.length > 0 && historyIndex >= 0) {
      ctx.putImageData(history[historyIndex], 0, 0);
    }
  }, [ctx, history, historyIndex]);

  // --- Firestore Integration ---
  const getDocRef = useCallback(() => {
    if (!user || !whiteboardId) return null;
    return doc(db, 'users', user.uid, 'whiteboards', whiteboardId, 'data', 'main');
  }, [user, whiteboardId]);

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
          setBoardName(boardData.name);
        } else {
          toast({ variant: 'destructive', title: 'Whiteboard not found.' });
          router.push('/whiteboard');
        }
      });
      return () => unsub();
    }
  }, [user, whiteboardId, getWhiteboardDocRef, router, toast]);

  // Save state
  const saveState = useCallback(async () => {
    const docRef = getDocRef();
    const canvas = canvasRef.current;
    if (!docRef || !canvas) return;
    const dataUrl = canvas.toDataURL();
    try {
      await setDoc(docRef, { data: dataUrl, timestamp: new Date() }, { merge: true });
    } catch (e) {
      console.error('Failed to save whiteboard state:', e);
    }
  }, [getDocRef]);

  // Load state
  useEffect(() => {
    const docRef = getDocRef();
    if (!docRef || !ctx || !canvasRef.current) return;

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.data) {
            const img = new Image();
            img.onload = () => {
              ctx.clearRect(0,0,canvasRef.current!.width,canvasRef.current!.height);
              ctx.drawImage(img, 0, 0);
              saveToHistory(true); // save without re-saving to firestore
            };
            img.src = data.data;
          }
        }
      },
      (error) => {
        console.error('Failed to load whiteboard state:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load whiteboard state.',
        });
      }
    );

    return () => unsubscribe();
  }, [user, ctx, whiteboardId, getDocRef, saveState, toast]);

  // --- Drawing Logic ---
  const getCoords = (e: MouseEvent | React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (!ctx) return;
    const { x, y } = getCoords(e);
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !ctx) return;
    const { x, y } = getCoords(e);
    const bgColor = whiteboard?.backgroundColor || '#FFFFFF';
    ctx.strokeStyle = currentTool === 'eraser' ? bgColor : currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing || !ctx) return;
    ctx.closePath();
    setIsDrawing(false);
    saveToHistory();
  };

  const saveToHistory = useCallback((fromLoad = false) => {
    if (!ctx || !canvasRef.current) return;
    const imageData = ctx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    if (!fromLoad) {
      saveState();
    }
  }, [ctx, history, historyIndex, saveState]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      ctx?.putImageData(history[historyIndex - 1], 0, 0);
      saveState();
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      ctx?.putImageData(history[historyIndex + 1], 0, 0);
      saveState();
    }
  };

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    if (window.confirm('Are you sure you want to clear the entire board?')) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      const blankImageData = ctx.createImageData(canvasRef.current.width, canvasRef.current.height);
      setHistory([blankImageData]);
      setHistoryIndex(0);
      saveState();
    }
  };

  const handleNameChange = useDebouncedCallback(async (newName: string) => {
    const boardRef = getWhiteboardDocRef();
    if (boardRef && whiteboard && newName.trim() !== whiteboard.name) {
      await updateDoc(boardRef, { name: newName.trim(), updatedAt: new Date() });
      toast({ title: "Whiteboard renamed!" });
    }
  }, 1000);
  
  const handleSettingChange = async (setting: Partial<Whiteboard>) => {
      const boardRef = getWhiteboardDocRef();
      if(boardRef && whiteboard) {
          await updateDoc(boardRef, setting);
      }
  }


  // --- Tools ---
  const handleToolClick = (tool: Tool) => {
    setCurrentTool(tool);
  };

  const drawShape = (shape: Shape) => {
    if (!ctx || !canvasRef.current) return;
    const centerX = canvasRef.current.width / 2;
    const centerY = canvasRef.current.height / 2;
    const size = 100;
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.beginPath();
    switch (shape) {
      case 'rectangle':
        ctx.strokeRect(centerX - size / 2, centerY - size / 2, size, size);
        break;
      case 'circle':
        ctx.arc(centerX, centerY, size / 2, 0, 2 * Math.PI);
        break;
    }
    ctx.stroke();
    saveToHistory();
  };

  const addStickyNote = (color: string) => {
    if (!ctx || !canvasRef.current) return;
    const noteText = prompt('Enter your note text:');
    if (noteText) {
      const x = 100;
      const y = 100;
      const width = 150;
      const height = 120;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = '#000000';
      ctx.font = '14px sans-serif';
      ctx.fillText(noteText, x + 10, y + 20);
      saveToHistory();
    }
  };

  // --- UI Components ---
  const ToolButton = ({
    tool,
    label,
    icon: Icon,
  }: {
    tool: Tool;
    label: string;
    icon: React.ElementType;
  }) => (
    <Button
      variant={currentTool === tool ? 'default' : 'outline'}
      onClick={() => handleToolClick(tool)}
      size="sm"
    >
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );

  if (!whiteboard) {
    return <div>Loading whiteboard...</div>;
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/whiteboard')}><PenSquare className="h-4 w-4" /></Button>
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
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none">Settings</h4>
                            <p className="text-sm text-muted-foreground">Customize your whiteboard.</p>
                        </div>
                        <div className="grid gap-2">
                            <Label>Background Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {backgroundColors.map(color => (
                                    <button 
                                        key={color} 
                                        onClick={() => handleSettingChange({ backgroundColor: color })}
                                        className={cn("w-8 h-8 rounded-full border", whiteboard.backgroundColor === color && "ring-2 ring-primary ring-offset-2")}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-2">
                             <Label>Background Style</Label>
                             <ToggleGroup
                                type="single"
                                value={whiteboard.backgroundGrid || 'dotted'}
                                onValueChange={(value) => value && handleSettingChange({ backgroundGrid: value as any })}
                            >
                                <ToggleGroupItem value="dotted" aria-label="Dotted grid"><Grid3x3 /></ToggleGroupItem>
                                <ToggleGroupItem value="lined" aria-label="Lined"><List /></ToggleGroupItem>
                                <ToggleGroupItem value="plain" aria-label="Plain"><Baseline /></ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            <Button onClick={saveState}><Save className="mr-2 h-4 w-4" /> Save</Button>
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* Toolbar */}
        <div className="flex md:flex-col gap-4 p-4 border rounded-lg bg-card md:w-64">
          <div className="flex md:flex-col gap-2 flex-wrap">
            <h3 className="font-semibold w-full">Tools</h3>
            <ToolButton tool="pen" label="Pen" icon={Pen} />
            <ToolButton tool="eraser" label="Eraser" icon={Eraser} />
            <ToolButton tool="text" label="Text" icon={Type} />
            <ToolButton tool="select" label="Select" icon={MousePointer} />
          </div>
          <div className="flex md:flex-col gap-2 flex-wrap">
            <h3 className="font-semibold w-full">Color</h3>
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              className="w-full h-10 p-1 bg-card border rounded-md cursor-pointer"
            />
          </div>
           <div className="flex md:flex-col gap-2 flex-wrap">
            <h3 className="font-semibold w-full">Brush Size</h3>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
          </div>
          <div className="flex md:flex-col gap-2 flex-wrap">
             <h3 className="font-semibold w-full">Shapes</h3>
             <Button variant="outline" size="sm" onClick={() => drawShape('rectangle')}><Square className="mr-2 h-4 w-4" /> Rectangle</Button>
             <Button variant="outline" size="sm" onClick={() => drawShape('circle')}><Circle className="mr-2 h-4 w-4" /> Circle</Button>
          </div>
           <div className="flex md:flex-col gap-2 flex-wrap">
             <h3 className="font-semibold w-full">Notes</h3>
             <Button variant="outline" size="sm" onClick={() => addStickyNote('#FFF9C4')}><StickyNote className="mr-2 h-4 w-4" /> Sticky Note</Button>
          </div>
          <div className="flex md:flex-col gap-2 mt-auto">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="mr-2 h-4 w-4" /> Undo
            </Button>
            <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
              <Redo className="mr-2 h-4 w-4" /> Redo
            </Button>
            <Button variant="destructive" size="sm" onClick={clearCanvas}>
              <Trash2 className="mr-2 h-4 w-4" /> Clear All
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 border rounded-lg overflow-hidden relative" style={{ backgroundColor: whiteboard.backgroundColor || '#FFFFFF' }}>
          <canvas
            ref={canvasRef}
            className={cn('absolute inset-0',
             {
                'whiteboard-bg-dotted': whiteboard.backgroundGrid === 'dotted' || !whiteboard.backgroundGrid,
                'whiteboard-bg-lined': whiteboard.backgroundGrid === 'lined',
                'whiteboard-bg-plain': whiteboard.backgroundGrid === 'plain',
                'cursor-crosshair': currentTool === 'pen',
                'cursor-text': currentTool === 'text',
            })}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
      </div>
    </div>
  );
}
