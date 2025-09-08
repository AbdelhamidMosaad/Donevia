
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
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type Tool = 'pen' | 'eraser' | 'text' | 'select' | 'shape';
type Shape =
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'triangle'
  | 'star'
  | 'heart';

export function DigitalWhiteboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

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
    if (!user) return null;
    return doc(db, 'users', user.uid, 'whiteboard', 'main');
  }, [user]);

  // Save state
  const saveState = useCallback(async () => {
    const docRef = getDocRef();
    const canvas = canvasRef.current;
    if (!docRef || !canvas) return;
    const dataUrl = canvas.toDataURL();
    try {
      await setDoc(docRef, { data: dataUrl, timestamp: new Date() });
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
              saveToHistory();
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
  }, [user, ctx]);

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
    ctx.strokeStyle = currentTool === 'eraser' ? '#FFFFFF' : currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
    saveToHistory();
  };

  const saveToHistory = useCallback(() => {
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
    saveState();
  }, [ctx, history, historyIndex, saveState]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      ctx?.putImageData(history[historyIndex - 1], 0, 0);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      ctx?.putImageData(history[historyIndex + 1], 0, 0);
    }
  };

  const clearCanvas = () => {
    if (!ctx || !canvasRef.current) return;
    if (window.confirm('Are you sure you want to clear the entire board?')) {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setHistory([]);
      setHistoryIndex(-1);
      saveToHistory();
    }
  };

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

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-4">
        <PenSquare className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-headline">Digital Whiteboard</h1>
          <p className="text-muted-foreground">
            Your infinite canvas for ideas. Draw, write, and collaborate.
          </p>
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
        <div className="flex-1 border rounded-lg bg-card overflow-hidden relative">
          <canvas
            ref={canvasRef}
            className={cn('absolute inset-0 whiteboard-bg', {
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
