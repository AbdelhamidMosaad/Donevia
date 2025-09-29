
'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Undo,
  Redo,
  Download,
  Plus,
  Minus,
  Expand,
  Save,
  ArrowLeft,
  GripVertical,
  Bold,
  Italic,
  Underline,
  Palette,
  Settings,
  Grid3x3,
  List,
  Baseline,
  Maximize,
  Minimize,
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
  Triangle,
  Diamond,
  Pen,
  Type,
  StickyNote,
  RectangleHorizontal,
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
  getDocs,
} from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from 'use-debounce';
import type {
  MindMap as MindMapType,
  WhiteboardNode as MindMapNode, // Re-using WhiteboardNode for flexibility
  WhiteboardConnection as MindMapConnection
} from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { Textarea } from '../ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Check } from 'lucide-react';

const colorPalette = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#333333'];

// Recursive component to render nodes and their children
const NodeComponent = ({
  node,
  onUpdateNode,
  onSelectNode,
  onStartEditing,
  onStopEditing,
  selectedNodeId,
  editingNodeId,
  dragHandleProps,
  onAddNode,
}: {
  node: MindMapNode;
  onUpdateNode: (id: string, updates: Partial<MindMapNode>) => void;
  onSelectNode: (id: string, e: React.MouseEvent) => void;
  onStartEditing: (id: string) => void;
  onStopEditing: () => void;
  selectedNodeId: string | null;
  editingNodeId: string | null;
  dragHandleProps?: any;
  onAddNode: (parentId: string) => void;
}) => {
  const isSelected = node.id === selectedNodeId;
  const isEditing = node.id === editingNodeId;
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.select();
    }
  }, [isEditing]);
  
  const autoSizeNode = useCallback((text: string) => {
    const minWidth = 150;
    const maxWidth = 400;
    const minHeight = 40;

    // Create a temporary span to measure text width
    const tempSpan = document.createElement('span');
    tempSpan.style.fontSize = `${node.fontSize || 16}px`;
    tempSpan.style.fontWeight = node.isBold ? 'bold' : 'normal';
    tempSpan.style.fontStyle = node.isItalic ? 'italic' : 'normal';
    tempSpan.style.whiteSpace = 'pre-wrap';
    tempSpan.style.position = 'absolute';
    tempSpan.style.visibility = 'hidden';
    tempSpan.style.padding = '8px';
    document.body.appendChild(tempSpan);

    tempSpan.textContent = text;
    tempSpan.style.width = `${node.width || minWidth}px`; // Constrain width for height calculation

    const textWidth = tempSpan.scrollWidth;
    const textHeight = tempSpan.scrollHeight;
    
    document.body.removeChild(tempSpan);

    const newWidth = Math.max(minWidth, Math.min(maxWidth, textWidth + 40)); 
    const newHeight = Math.max(minHeight, textHeight); 

    if (newWidth !== node.width || newHeight !== node.height) {
      onUpdateNode(node.id, { width: newWidth, height: newHeight });
    }
  }, [node.fontSize, node.isBold, node.isItalic, node.width, node.height, onUpdateNode, node.id]);
  
   useEffect(() => {
    if (node.text) {
      autoSizeNode(node.text);
    }
   }, [node.text, autoSizeNode]);


  return (
    <div
      className={cn(
        'node-item group absolute flex items-center justify-center rounded-lg shadow-md cursor-pointer border-2 transition-all p-4',
        isSelected ? 'border-primary shadow-lg' : 'border-gray-300',
        isEditing && 'border-primary ring-2 ring-primary/50'
      )}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width}px`,
        height: `${node.height}px`,
        transform: 'translate(-50%, -50%)',
        backgroundColor: node.backgroundColor,
      }}
      onClick={(e) => onSelectNode(node.id, e)}
      onDoubleClick={() => onStartEditing(node.id)}
    >
      {isEditing ? (
        <Textarea
          ref={textAreaRef}
          value={node.text || ''}
          onChange={(e) => onUpdateNode(node.id, { text: e.target.value })}
          onBlur={onStopEditing}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onStopEditing();
          }}
          className="w-full h-full bg-transparent border-none text-center resize-none p-0 focus-visible:ring-0"
          style={{
            color: node.color,
            fontSize: `${node.fontSize || 16}px`,
            fontWeight: node.isBold ? 'bold' : 'normal',
            fontStyle: node.isItalic ? 'italic' : 'normal',
            textDecoration: node.isUnderline ? 'underline' : 'none',
          }}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center text-center whitespace-pre-wrap break-words p-2"
          style={{
            color: node.color,
            fontSize: `${node.fontSize || 16}px`,
            fontWeight: node.isBold ? 'bold' : 'normal',
            fontStyle: node.isItalic ? 'italic' : 'normal',
            textDecoration: node.isUnderline ? 'underline' : 'none',
          }}
        >
          {node.text}
        </div>
      )}
      <div {...dragHandleProps} className="absolute top-1/2 -left-3 -translate-y-1/2 p-1 cursor-grab opacity-0 group-hover:opacity-50 transition-opacity">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      {isSelected && (
          <Button size="icon" className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full" onClick={(e) => {e.stopPropagation(); onAddNode(node.id);}}>
            <Plus className="h-4 w-4"/>
          </Button>
      )}
    </div>
  );
};


export function MindMapTool() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const mindMapId = params.mindMapId as string;

  const [boardData, setBoardData] = useState<MindMapType | null>(null);
  const [nodes, setNodes] = useState<Record<string, MindMapNode>>({});
  const [connections, setConnections] = useState<MindMapConnection[]>([]);
  
  const [mapName, setMapName] = useState('');
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  
  const [history, setHistory] = useState<{ nodes: Record<string, MindMapNode>, connections: MindMapConnection[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isInitialLoad = useRef(true);
  
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const getMindMapDocRef = useCallback(() => {
    if (!user || !mindMapId) return null;
    return doc(db, 'users', user.uid, 'mindMaps', mindMapId);
  }, [user, mindMapId]);
  
  useEffect(() => {
    const mapRef = getMindMapDocRef();
    if (mapRef) {
      const unsub = onSnapshot(mapRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data() as MindMapType;
          setBoardData(data);
          const fetchedConnections = data.connections || [];
          const fetchedNodes = (data.nodes || []).reduce((acc, node) => {
              acc[node.id] = node;
              return acc;
          }, {} as Record<string, MindMapNode>);
          setConnections(fetchedConnections);
          setBoardName(data.name);

          if (isInitialLoad.current) {
            if (Object.keys(fetchedNodes).length === 0) {
              const rootNode: MindMapNode = {
                id: 'root',
                x: 0, y: 0,
                width: 180, height: 60,
                text: 'Central Idea',
                type: 'shape',
                shape: 'rectangle',
                backgroundColor: '#4361ee', color: 'white',
                isBold: true, isItalic: false, isUnderline: false,
                fontSize: 18,
                parentId: null,
              };
              setNodes({ root: rootNode });
              pushToHistory({ root: rootNode }, []);
              setSelectedNodeId('root');
            } else {
              setNodes(fetchedNodes);
              setHistory([{ nodes: fetchedNodes, connections: fetchedConnections }]);
              setHistoryIndex(0);
            }
            isInitialLoad.current = false;
          }
        } else {
          toast({ variant: 'destructive', title: 'Mind Map not found.' });
          router.push('/mind-map');
        }
      });
      return () => unsub();
    }
  }, [user, mindMapId, toast, router, getMindMapDocRef]);

  const saveMindMap = useDebouncedCallback(async (updatedNodes: MindMapNode[], updatedConnections: MindMapConnection[]) => {
    const mapRef = getMindMapDocRef();
    if (mapRef) {
        setSaveStatus('saving');
        await updateDoc(mapRef, { 
            nodes: updatedNodes, 
            connections: updatedConnections,
            updatedAt: new Date() 
        });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, 1500);

  const pushToHistory = useCallback((newNodes: Record<string, MindMapNode>, newConnections: MindMapConnection[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: newNodes, connections: newConnections });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    saveMindMap(Object.values(newNodes), newConnections);
  }, [history, historyIndex, saveMindMap]);
  
  const handleUpdateNodeDebounced = useDebouncedCallback((id: string, updates: Partial<MindMapNode>) => {
    const nodeRef = doc(db, 'users', user!.uid, 'mindMaps', mindMapId, 'nodes', id);
    updateDoc(nodeRef, { ...updates, updatedAt: serverTimestamp() });
    pushToHistory({ ...nodes, [id]: { ...nodes[id], ...updates } as MindMapNode }, connections);
  }, 500);
  
  const handleUpdateNode = (id: string, updates: Partial<MindMapNode>) => {
    setNodes(prev => ({
        ...prev,
        [id]: { ...prev[id], ...updates } as MindMapNode,
    }));
    handleUpdateNodeDebounced(id, updates);
  };
  
  const addNode = (parentId: string) => {
    const parentNode = nodes[parentId];
    if (!parentNode) return;

    const children = Object.values(nodes).filter(n => n.parentId === parentId);
    const lastChild = children.sort((a,b) => (a.y || 0) - (b.y || 0))[children.length - 1];
    
    const newNodeId = uuidv4();
    const newNode: MindMapNode = {
      id: newNodeId,
      x: (parentNode.x || 0) + ((parentNode.width || 150) / 2) + 150, 
      y: lastChild ? (lastChild.y || 0) + (lastChild.height || 50) + 20 : (parentNode.y || 0),
      width: 150, height: 50,
      text: 'New Idea',
      type: 'shape',
      shape: 'rectangle',
      backgroundColor: '#f8f9fa', color: '#212529',
      isBold: false, isItalic: false, isUnderline: false,
      fontSize: 16,
      parentId: parentId,
    };
    
    const newNodes = { ...nodes, [newNodeId]: newNode };
    const newConnections = [...connections, { from: parentId, to: newNodeId }];
    
    setNodes(newNodes);
    setConnections(newConnections);
    pushToHistory(newNodes, newConnections);
    setSelectedNodeId(newNodeId);
    setEditingNodeId(newNodeId);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedNodeId || editingNodeId) return;

    if (e.key === 'F2') {
        e.preventDefault();
        setEditingNodeId(selectedNodeId);
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      addNode(selectedNodeId);
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const siblingNode = nodes[selectedNodeId];
      if (siblingNode && siblingNode.parentId) {
        addNode(siblingNode.parentId);
      }
    }
    
    if (e.key === 'Delete' || e.key === 'Backspace') {
        const nodeToDelete = nodes[selectedNodeId];
        if (nodeToDelete && nodeToDelete.parentId) {
            const newNodes = { ...nodes };
            delete newNodes[selectedNodeId];

            const childrenToDelete = Object.values(nodes).filter(n => n.parentId === selectedNodeId);
            childrenToDelete.forEach(child => delete newNodes[child.id]);
            
            const newConnections = connections.filter(c => c.from !== selectedNodeId && c.to !== selectedNodeId && c.from !== nodeToDelete.id && c.to !== nodeToDelete.id);

            setNodes(newNodes);
            setConnections(newConnections);
            pushToHistory(newNodes, newConnections);
            setSelectedNodeId(nodeToDelete.parentId);
        }
    }
  };
  
  const handleMapNameChangeDebounced = useDebouncedCallback(async (newName: string) => {
    const boardRef = getMindMapDocRef();
    if (boardRef && boardData && newName.trim() !== boardData.name) {
      await updateDoc(boardRef, { name: newName.trim(), updatedAt: new Date() });
      toast({ title: "Mind Map renamed!" });
    }
  }, 1000);

  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;

  const undo = () => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const { nodes: prevNodes, connections: prevConnections } = history[newIndex];
        setNodes(prevNodes);
        setConnections(prevConnections);
        saveMindMap(Object.values(prevNodes), prevConnections);
    }
  };

  const redo = () => {
      if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          const { nodes: nextNodes, connections: nextConnections } = history[newIndex];
          setNodes(nextNodes);
          setConnections(nextConnections);
          saveMindMap(Object.values(nextNodes), nextConnections);
      }
  };

  return (
    <div className="flex flex-col h-full gap-4" onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/mind-map')}>
            <ArrowLeft />
          </Button>
          <Input
            value={mapName}
            onChange={(e) => {
              setMapName(e.target.value);
              handleMapNameChangeDebounced(e.target.value);
            }}
            className="text-3xl font-bold font-headline h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="flex items-center gap-2">
             <div className="text-sm text-muted-foreground w-24 text-right">
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'saved' && 'Saved!'}
            </div>
            <Button variant="outline" onClick={() => {}}><Download /> Export PNG</Button>
            <Button variant="outline" onClick={() => {}}><Download /> Export PDF</Button>
        </div>
      </div>
       <div 
        className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-card/80 backdrop-blur-md p-1 rounded-lg shadow-lg flex gap-1 items-center border"
        onMouseDown={(e) => e.stopPropagation()} // Prevent canvas drag
        >
            {selectedNode && (
                 <>
                    <Button variant={selectedNode.isBold ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => handleUpdateNode(selectedNodeId!, { isBold: !selectedNode.isBold })}><Bold/></Button>
                    <Button variant={selectedNode.isItalic ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => handleUpdateNode(selectedNodeId!, { isItalic: !selectedNode.isItalic })}><Italic/></Button>
                    <Button variant={selectedNode.isUnderline ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={() => handleUpdateNode(selectedNodeId!, { isUnderline: !selectedNode.isUnderline })}><Underline/></Button>
                    <Popover>
                        <PopoverTrigger asChild>
                             <Button variant='ghost' size="icon" className="h-8 w-8" style={{color: selectedNode.color}}><Palette/></Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                            <div className="flex gap-1">
                                {colorPalette.map(c => (
                                    <button key={c} style={{backgroundColor: c}} className="h-6 w-6 rounded-full border" onClick={() => handleUpdateNode(selectedNodeId!, { color: c})} />
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                 </>
            )}
       </div>
      <div
        className="flex-1 relative overflow-hidden bg-background/50 border rounded-lg"
      >
        <div
          className="w-full h-full"
        >
            <svg
                className="absolute top-0 left-0 w-full h-full"
                pointerEvents="none"
            >
                {connections.map(conn => {
                    const fromNode = nodes[conn.from];
                    const toNode = nodes[conn.to];
                    if (!fromNode || !toNode) return null;
                    const fromX = (fromNode.x || 0) + ((fromNode.width || 0) / 2);
                    const fromY = (fromNode.y || 0);
                    const toX = (toNode.x || 0) - ((toNode.width || 0) / 2);
                    const toY = (toNode.y || 0);
                    
                    return (
                        <path
                            key={`conn-${conn.from}-${conn.to}`}
                            d={`M ${fromX} ${fromY} C ${fromX + 50} ${fromY}, ${toX - 50} ${toY}, ${toX} ${toY}`}
                            stroke="#ccc"
                            strokeWidth="2"
                            fill="none"
                        />
                    )
                })}
            </svg>
            {Object.values(nodes).map(node => (
                <NodeComponent
                    key={node.id}
                    node={node}
                    onUpdateNode={handleUpdateNode}
                    onSelectNode={(id, e) => {
                        setSelectedNodeId(id);
                    }}
                    onStartEditing={(id) => setEditingNodeId(id)}
                    onStopEditing={() => setEditingNodeId(null)}
                    selectedNodeId={selectedNodeId}
                    editingNodeId={editingNodeId}
                    onAddNode={addNode}
                />
            ))}
        </div>
         <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={undo} disabled={historyIndex <= 0}><Undo/></Button>
            <Button variant="outline" size="icon" onClick={redo} disabled={historyIndex >= history.length - 1}><Redo/></Button>
        </div>
      </div>
    </div>
  );
}
