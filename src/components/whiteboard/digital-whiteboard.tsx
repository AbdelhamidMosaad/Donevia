'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  query,
  where,
  addDoc,
  serverTimestamp,
  deleteDoc,
  writeBatch,
  getDoc,
  setDoc,
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
  Plus,
  Minus,
  Expand,
  Maximize,
  Minimize,
  Save,
  Download,
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

const WhiteboardCanvas = dynamic(() => import('./whiteboard-canvas'), {
  ssr: false,
  loading: () => <p>Loading Canvas...</p>,
});

type Tool = 'select' | 'pen' | 'text' | 'sticky' | 'shape';
type ShapeType = 'rectangle' | 'circle' | 'line' | 'arrow' | 'triangle' | 'star' | 'heart';
type LayoutDirection = 'right' | 'bottom' | 'left' | 'top';

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
  const [connections, setConnections] = useState<WhiteboardConnection[]>([]);
  const [boardName, setBoardName] = useState('');
  
  const [tool, setTool] = useState<Tool>('select');
  const [shapeType, setShapeType] = useState<ShapeType>('rectangle');
  const [currentColor, setCurrentColor] = useState('#333333');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [fontSize, setFontSize] = useState(16);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  
  const [history, setHistory] = useState<{ nodes: WhiteboardNode[]; connections: WhiteboardConnection[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isApplyingHistory = useRef(false);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  
  const getBoardDocRef = useCallback(() => {
    if (!user || !whiteboardId) return null;
    return doc(db, 'users', user.uid, 'whiteboards', whiteboardId);
  }, [user, whiteboardId]);

  const debouncedSave = useDebouncedCallback(async (updatedNodes: WhiteboardNode[], updatedConnections: WhiteboardConnection[]) => {
    const boardRef = getBoardDocRef();
    if (boardRef) {
      const cleanedNodes = updatedNodes.map(node => JSON.parse(JSON.stringify(node, (key, value) => value === undefined ? null : value))));
      await updateDoc(boardRef, { nodes: cleanedNodes, connections: updatedConnections, updatedAt: serverTimestamp() });
    }
  }, 1000);
  
  const saveToHistory = useCallback((newNodes: WhiteboardNode[], newConnections: WhiteboardConnection[]) => {
    if (isApplyingHistory.current) return;
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push({ nodes: newNodes, connections: newConnections });
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
    debouncedSave(newNodes, newConnections);
  }, [history, historyIndex, debouncedSave]);

  const undo = () => {
    if (historyIndex > 0) {
      isApplyingHistory.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setNodes(history[newIndex].nodes);
      setConnections(history[newIndex].connections);
      debouncedSave(history[newIndex].nodes, history[newIndex].connections);
      setTimeout(() => isApplyingHistory.current = false, 100);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      isApplyingHistory.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setNodes(history[newIndex].nodes);
      setConnections(history[newIndex].connections);
      debouncedSave(history[newIndex].nodes, history[newIndex].connections);
       setTimeout(() => isApplyingHistory.current = false, 100);
    }
  };
  
  useEffect(() => {
    const boardRef = getBoardDocRef();
    if (boardRef) {
      const unsub = onSnapshot(boardRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data() as WhiteboardType;
          setBoardData(data);
          const currentNodes = data.nodes || [];
          setNodes(currentNodes);
          setConnections(data.connections || []);
          setBoardName(data.name);

          if (history.length === 0 && currentNodes.length > 0) {
            setHistory([{ nodes: currentNodes, connections: data.connections || [] }]);
            setHistoryIndex(0);
          }
        } else {
          toast({ variant: 'destructive', title: 'Whiteboard not found.' });
          router.push('/whiteboard');
        }
      });
      return () => unsub();
    }
  }, [user, whiteboardId, toast, router, getBoardDocRef, history.length]);


  if (!isClient) {
    return <div>Loading Whiteboard...</div>;
  }
  
  if (!boardData) {
    return <div>Loading board data...</div>;
  }
  
  return (
      <WhiteboardCanvas 
        boardData={boardData}
        nodes={nodes}
        setNodes={setNodes}
        connections={connections}
        setConnections={setConnections}
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
  );
}