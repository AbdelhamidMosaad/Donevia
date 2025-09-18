
'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  addDoc,
  writeBatch,
  query,
  getDocs,
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
  Users,
  ArrowLeft,
} from 'lucide-react';
import throttle from 'lodash.throttle';

import type { Whiteboard as WhiteboardType, WhiteboardNode } from '@/lib/types';

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
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

type Tool = 'select' | 'pen' | 'text' | 'sticky' | 'shape';
type ShapeType = 'rectangle' | 'circle';
type Presence = {
    userId: string;
    name: string;
    color: string;
    x: number;
    y: number;
    lastSeen: any;
};

const colorPalette = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#333333'];
const backgroundColors = ['#FFFFFF', '#F8F9FA', '#E9ECEF', '#FFF9C4', '#F1F3F5'];

export default function DigitalWhiteboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const whiteboardId = params.whiteboardId as string;

  const [boardData, setBoardData] = useState<WhiteboardType | null>(null);
  const [nodes, setNodes] = useState<Record<string, WhiteboardNode>>({});
  
  const [boardName, setBoardName] = useState('');
  
  const [tool, setTool] = useState<Tool>('select');
  const [shapeType, setShapeType] = useState<ShapeType>('rectangle');
  const [currentColor, setCurrentColor] = useState('#333333');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [fontSize, setFontSize] = useState(16);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  
  const [history, setHistory] = useState<{ id: string, node: Partial<WhiteboardNode> | null }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const [presence, setPresence] = useState<Record<string, Presence>>({});

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
  }, [user, whiteboardId, toast, router, getBoardDocRef]);
  
  const saveNode = useDebouncedCallback(async (nodeId: string, updatedAttrs: Partial<WhiteboardNode>) => {
    if (!user) return;
    const nodeRef = doc(db, 'users', user.uid, 'whiteboards', whiteboardId, 'nodes', nodeId);
    
    const cleanedAttrs = Object.fromEntries(Object.entries(updatedAttrs).filter(([_, v]) => v !== undefined));

    await updateDoc(nodeRef, { ...cleanedAttrs, updatedAt: serverTimestamp() });
  }, 500);

  const createNode = async (newNode: Omit<WhiteboardNode, 'id'>) => {
    if(!user) throw new Error("User not authenticated");
    const nodeRef = doc(collection(db, 'users', user.uid, 'whiteboards', whiteboardId, 'nodes'));
    const finalNode = { ...newNode, id: nodeRef.id, userId: user.uid };
    await setDoc(nodeRef, finalNode);
    return finalNode;
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
           color: '#4361EE', // example color
           x: pos.x,
           y: pos.y,
           lastSeen: serverTimestamp()
       });
   }, 200), [user, whiteboardId]);


  if (!boardData) {
      return (
          <div className="flex items-center justify-center h-full">
            <p>Loading whiteboard...</p>
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
             <div className="flex items-center gap-2">
                 <div className="flex -space-x-2">
                    {Object.values(presence).map(p => (
                        <Avatar key={p.userId} className="h-8 w-8 border-2 border-background">
                            <AvatarFallback>{p.name?.[0]}</AvatarFallback>
                        </Avatar>
                    ))}
                 </div>
                <Button variant="outline"><Download /> Export</Button>
            </div>
        </div>

        <div className="flex-1 relative">
            <WhiteboardCanvas 
                boardData={boardData}
                nodes={Object.values(nodes)}
                tool={tool}
                shapeType={shapeType}
                currentColor={currentColor}
                strokeWidth={strokeWidth}
                fontSize={fontSize}
                selectedNodeId={selectedNodeId}
                editingNodeId={editingNodeId}
                presence={presence}
                onNodeCreate={createNode}
                onNodeChange={saveNode}
                onNodeDelete={(nodeId) => saveNode(nodeId, { isDeleted: true })}
                onSelectNode={setSelectedNodeId}
                onEditNode={setEditingNodeId}
                onUpdatePresence={updatePresence}
            />
        </div>
    </div>
  );
}
