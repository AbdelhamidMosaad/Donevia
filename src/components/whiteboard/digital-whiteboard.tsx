
'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { jsPDF } from 'jspdf';
import {
  MousePointer,
  Pen,
  Circle as CircleIcon,
  RectangleHorizontal,
  Type,
  StickyNote,
  Move,
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
  Settings,
  Grid3x3,
  List,
  Baseline,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Minus,
  Expand,
  Maximize,
  Minimize,
} from 'lucide-react';

import type { Whiteboard as WhiteboardType, WhiteboardNode, WhiteboardConnection } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { Label } from '../ui/label';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Separator } from '../ui/separator';
import { WhiteboardCanvas } from './whiteboard-canvas';

type Tool = 'select' | 'pen' | 'text' | 'sticky' | 'shape';
type ShapeType = 'rectangle' | 'circle';

const colorPalette = ['#4361ee', '#ef476f', '#06d6a0', '#ffd166', '#9d4edd', '#000000', '#FFFFFF'];
const backgroundColors = ['#FFFFFF', '#F8F9FA', '#E9ECEF', '#FFF9C4', '#F1F3F5'];

export default function DigitalWhiteboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const whiteboardId = params.whiteboardId as string;

  const [boardData, setBoardData] = useState<WhiteboardType | null>(null);
  const [nodes, setNodes] = useState<WhiteboardNode[]>([]);
  
  const [boardName, setBoardName] = useState('');
  
  const [tool, setTool] = useState<Tool>('select');
  const [shapeType, setShapeType] = useState<ShapeType>('rectangle');
  const [currentColor, setCurrentColor] = useState('#333333');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [fontSize, setFontSize] = useState(16);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  
  const [history, setHistory] = useState<{ nodes: WhiteboardNode[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isApplyingHistory = useRef(false);

  const getBoardDocRef = useCallback(() => {
    if (!user || !whiteboardId) return null;
    return doc(db, 'users', user.uid, 'whiteboards', whiteboardId);
  }, [user, whiteboardId]);
  
  // Load initial data
  useEffect(() => {
    const boardRef = getBoardDocRef();
    if (boardRef) {
      const unsub = onSnapshot(boardRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data() as WhiteboardType;
          setBoardData(data);
          const currentNodes = data.nodes || [];
          setNodes(currentNodes);
          setBoardName(data.name);

          if (history.length === 0 && currentNodes.length > 0) {
            setHistory([{ nodes: currentNodes }]);
            setHistoryIndex(0);
          }
        } else {
          toast({ variant: 'destructive', title: 'Whiteboard not found.' });
          router.push('/whiteboard');
        }
      });
      return () => unsub();
    }
  }, [user, whiteboardId, toast, router, getBoardDocRef]);
  
  const saveBoard = useDebouncedCallback(async (updatedNodes) => {
    const boardRef = getBoardDocRef();
    if (boardRef) {
      const cleanedNodes = updatedNodes.map(node => JSON.parse(JSON.stringify(node, (key, value) => value === undefined ? null : value))));
      await updateDoc(boardRef, { nodes: cleanedNodes, updatedAt: serverTimestamp() });
    }
  }, 1000);

  const saveToHistory = useCallback((newNodes: WhiteboardNode[]) => {
    if (isApplyingHistory.current) return;
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push({ nodes: newNodes });
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    saveBoard(newNodes);
  }, [history, historyIndex, saveBoard]);

  const undo = () => {
    if (historyIndex > 0) {
      isApplyingHistory.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setNodes(history[newIndex].nodes);
      saveBoard(history[newIndex].nodes);
      setTimeout(() => isApplyingHistory.current = false, 100);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      isApplyingHistory.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setNodes(history[newIndex].nodes);
      saveBoard(history[newIndex].nodes);
       setTimeout(() => isApplyingHistory.current = false, 100);
    }
  };
  
  const handleMapNameChange = useDebouncedCallback(async (newName: string) => {
    const boardRef = getBoardDocRef();
    if (boardRef && boardData && newName.trim() !== boardData.name) {
      await updateDoc(boardRef, { name: newName.trim(), updatedAt: serverTimestamp() });
      toast({ title: "Whiteboard renamed!" });
    }
  }, 1000);

  if (!boardData) {
      return (
          <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }
  
  return (
    <div className="flex flex-col h-full gap-4">
        <div className="flex justify-between items-center">
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
        </div>

        <div className="flex-1 relative">
            <WhiteboardCanvas 
                boardData={boardData}
                nodes={nodes}
                setNodes={setNodes}
                tool={tool}
                setTool={setTool}
                shapeType={shapeType}
                currentColor={currentColor}
                strokeWidth={strokeWidth}
                fontSize={fontSize}
                selectedNodeId={selectedNodeId}
                setSelectedNodeId={setSelectedNodeId}
                editingNodeId={editingNodeId}
                setEditingNodeId={setEditingNodeId}
                saveToHistory={saveToHistory}
            />
        </div>
    </div>
  );
}

const Loader2 = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("lucide lucide-loader-2", className)}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
)
