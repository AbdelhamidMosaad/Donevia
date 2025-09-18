
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
  ArrowUpRight,
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
import { Slider } from '../ui/slider';

type Tool = 'select' | 'pen' | 'text' | 'sticky' | 'shape' | 'arrow';
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
  
  const [boardName, setBoardName] = useState('');
  
  const [tool, setTool] = useState<Tool>('select');
  const [shapeType, setShapeType] = useState<ShapeType>('rectangle');
  const [currentColor, setCurrentColor] = useState('#333333');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [fontSize, setFontSize] = useState(16);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  
  const [history, setHistory] = useState<{ nodes: Record<string, WhiteboardNode> }[]>([]);
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

        if (historyIndex === -1 && Object.keys(newNodes).length > 0) {
            setHistory([{ nodes: newNodes }]);
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
  
  const saveNode = useDebouncedCallback(async (nodeId: string, updatedAttrs: Partial<WhiteboardNode>) => {
    if (!user) return;
    const nodeRef = doc(db, 'users', user.uid, 'whiteboards', whiteboardId, 'nodes', nodeId);
    const cleanedAttrs = deepCleanUndefined({ ...updatedAttrs, updatedAt: serverTimestamp() });
    await updateDoc(nodeRef, cleanedAttrs);
  }, 300);
  
  const pushToHistory = (newNodes: Record<string, WhiteboardNode>) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newNodes);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }

  const createNode = async (newNode: Omit<WhiteboardNode, 'id' | 'userId'>): Promise<WhiteboardNode> => {
    if(!user) throw new Error("User not authenticated");
    const nodeRef = doc(collection(db, 'users', user.uid, 'whiteboards', whiteboardId, 'nodes'));
    const finalNode = { ...newNode, id: nodeRef.id, userId: user.uid, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    const cleanedNode = deepCleanUndefined(finalNode);
    await setDoc(nodeRef, cleanedNode);

    const updatedNodes = { ...nodes, [nodeRef.id]: cleanedNode as WhiteboardNode };
    pushToHistory({ nodes: updatedNodes });

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
       });
   }, 200), [user, whiteboardId]);

    const handleNodeChange = (id: string, newAttrs: Partial<WhiteboardNode>) => {
        setNodes(prev => ({
            ...prev,
            [id]: { ...prev[id], ...newAttrs } as WhiteboardNode,
        }));
        saveNode(id, newAttrs);
    };

    const handleNodeChangeComplete = () => {
         pushToHistory({ nodes });
    };

    const deleteSelectedNode = () => {
        if (!selectedNodeId) return;
        saveNode(selectedNodeId, { isDeleted: true });

        const newNodes = { ...nodes };
        delete newNodes[selectedNodeId];
        pushToHistory({ nodes: newNodes });

        setSelectedNodeId(null);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setNodes(history[newIndex].nodes);
            
            const batch = writeBatch(db);
            const currentIds = Object.keys(history[newIndex].nodes);
            const nextIds = Object.keys(history[newIndex + 1].nodes);
            
            nextIds.filter(id => !currentIds.includes(id)).forEach(id => {
                const nodeRef = doc(db, 'users', user.uid, 'whiteboards', whiteboardId, 'nodes', id);
                batch.update(nodeRef, { isDeleted: true });
            });
            
            Object.values(history[newIndex].nodes).forEach(node => {
                 const nodeRef = doc(db, 'users', user.uid, 'whiteboards', whiteboardId, 'nodes', node.id);
                 batch.set(nodeRef, deepCleanUndefined(node));
            });

            batch.commit();
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setNodes(history[newIndex].nodes);

            const batch = writeBatch(db);
            Object.values(history[newIndex].nodes).forEach(node => {
                 const nodeRef = doc(db, 'users', user.uid, 'whiteboards', whiteboardId, 'nodes', node.id);
                 batch.set(nodeRef, deepCleanUndefined(node));
            });
            batch.commit();
        }
    };
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement;
            const isEditingText = activeElement?.tagName === 'TEXTAREA' || (activeElement instanceof HTMLInputElement && activeElement.type === 'text');

            if (isEditingText) return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                deleteSelectedNode();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
            }
             if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNodeId, undo, redo]);


  if (!boardData) {
      return (
          <div className="flex items-center justify-center h-full">
            <p>Loading whiteboard...</p>
          </div>
      );
  }
  
  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;

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
                            <AvatarImage src={p.photoURL} alt={p.name} />
                            <AvatarFallback>{p.name?.[0]}</AvatarFallback>
                        </Avatar>
                    ))}
                 </div>
                <Button variant="outline"><Download /> Export</Button>
            </div>
        </div>

        <div className="flex-1 relative">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-card/60 backdrop-blur-md p-1 rounded-lg shadow-lg flex gap-1 border">
                <ToggleGroup type="single" value={tool} onValueChange={(t: Tool) => t && setTool(t)}>
                    <ToggleGroupItem value="select"><MousePointer/></ToggleGroupItem>
                    <ToggleGroupItem value="pen"><Pen/></ToggleGroupItem>
                    <ToggleGroupItem value="text"><Type/></ToggleGroupItem>
                    <ToggleGroupItem value="sticky"><StickyNote/></ToggleGroupItem>
                    <ToggleGroupItem value="shape"><RectangleHorizontal/></ToggleGroupItem>
                    <ToggleGroupItem value="arrow"><ArrowUpRight/></ToggleGroupItem>
                </ToggleGroup>
            </div>
            
            {tool === 'shape' && (
                 <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-card/60 backdrop-blur-md p-1 rounded-lg shadow-lg flex gap-1 border">
                    <ToggleGroup type="single" value={shapeType} onValueChange={(s: ShapeType) => s && setShapeType(s)}>
                        <ToggleGroupItem value="rectangle"><RectangleHorizontal/></ToggleGroupItem>
                        <ToggleGroupItem value="circle"><CircleIcon/></ToggleGroupItem>
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
                                <button key={c} style={{backgroundColor: c}} className="h-6 w-6 rounded-full border" onClick={() => handleNodeChange(selectedNodeId!, { color: c})} />
                            ))}
                           </div>
                        </PopoverContent>
                    </Popover>
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    {selectedNode.type !== 'pen' && (
                        <>
                           <Slider
                                value={[selectedNode.fontSize || 16]}
                                onValueChange={(v) => handleNodeChange(selectedNodeId!, { fontSize: v[0] })}
                                onValueCommit={handleNodeChangeComplete}
                                max={64} min={8} step={1} className="w-24"
                            />
                        </>
                    )}
                     {selectedNode.type === 'pen' && (
                        <Slider
                            value={[selectedNode.strokeWidth || 4]}
                            onValueChange={(v) => handleNodeChange(selectedNodeId!, { strokeWidth: v[0] })}
                            onValueCommit={handleNodeChangeComplete}
                            max={20} min={1} step={1} className="w-24"
                        />
                    )}
                    <Separator orientation="vertical" className="h-6 mx-1" />
                    <Button variant="ghost" size="icon" onClick={() => deleteSelectedNode()}><Trash2 /></Button>
                 </div>
            )}


            <div className="absolute bottom-4 left-4 z-20 bg-card/60 backdrop-blur-md p-1 rounded-lg shadow-lg flex flex-col gap-1 border">
                <Button variant="ghost" size="icon" onClick={undo} disabled={historyIndex <= 0}><Undo/></Button>
                <Button variant="ghost" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}><Redo/></Button>
            </div>

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
                onNodeChange={handleNodeChange}
                onNodeChangeComplete={handleNodeChangeComplete}
                onNodeDelete={(nodeId) => saveNode(nodeId, { isDeleted: true })}
                onSelectNode={setSelectedNodeId}
                onEditNode={setEditingNodeId}
                onUpdatePresence={updatePresence}
            />
        </div>
    </div>
  );
}
