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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '../ui/input';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  doc,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from 'use-debounce';
import type {
  MindMap as MindMapType,
  MindMapNode,
} from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';

interface NodeWithChildren extends MindMapNode {
  children: NodeWithChildren[];
}

// Recursive component to render nodes and their children
const NodeComponent = ({
  node,
  onUpdateNode,
  onSelectNode,
  onStartEditing,
  selectedNodeId,
  editingNodeId,
}: {
  node: NodeWithChildren;
  onUpdateNode: (id: string, updates: Partial<MindMapNode>) => void;
  onSelectNode: (id: string) => void;
  onStartEditing: (id: string) => void;
  selectedNodeId: string | null;
  editingNodeId: string | null;
}) => {
  const isSelected = node.id === selectedNodeId;
  const isEditing = node.id === editingNodeId;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div
      className="flex items-center"
      style={{
        position: 'absolute',
        left: `${node.x}px`,
        top: `${node.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className={cn(
          'node-item p-2 rounded-lg shadow cursor-pointer border-2',
          isSelected ? 'border-primary' : 'border-gray-300'
        )}
        style={{
          backgroundColor: node.backgroundColor,
          color: node.color,
          width: `${node.width}px`,
          height: `${node.height}px`,
        }}
        onClick={() => onSelectNode(node.id)}
        onDoubleClick={() => onStartEditing(node.id)}
      >
        {isEditing ? (
          <Input
            ref={inputRef}
            value={node.title}
            onChange={(e) => onUpdateNode(node.id, { title: e.target.value })}
            onBlur={() => onStartEditing('')}
            className="w-full h-full bg-transparent border-none text-center"
            style={{
              fontWeight: node.isBold ? 'bold' : 'normal',
              fontStyle: node.isItalic ? 'italic' : 'normal',
              textDecoration: node.isUnderline ? 'underline' : 'none',
            }}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-center"
            style={{
              fontWeight: node.isBold ? 'bold' : 'normal',
              fontStyle: node.isItalic ? 'italic' : 'normal',
              textDecoration: node.isUnderline ? 'underline' : 'none',
            }}
          >
            {node.title}
          </div>
        )}
      </div>
    </div>
  );
};


export function MindMapTool() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const mindMapId = params.mindMapId as string;

  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [mapName, setMapName] = useState('');
  
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  
  const [history, setHistory] = useState<{ nodes: MindMapNode[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

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
          setMapName(data.name);

          const fetchedNodes = data.nodes || [];
          if (fetchedNodes.length === 0) {
            // Create a root node if none exist
            const rootNode: MindMapNode = {
              id: 'root',
              x: 0, y: 0,
              width: 180, height: 60,
              title: 'Central Idea',
              style: 'default',
              backgroundColor: '#4361ee', color: 'white',
              isBold: true, isItalic: false, isUnderline: false,
              parentId: null,
            };
            setNodes([rootNode]);
            setHistory([{ nodes: [rootNode] }]);
            setHistoryIndex(0);
            setSelectedNodeId('root');
          } else {
             setNodes(fetchedNodes);
             if(historyIndex === -1) {
                setHistory([{ nodes: fetchedNodes }]);
                setHistoryIndex(0);
             }
          }
        } else {
          toast({ variant: 'destructive', title: 'Mind Map not found.' });
          router.push('/mind-map');
        }
      });
      return () => unsub();
    }
  }, [user, mindMapId, getMindMapDocRef, toast, router, historyIndex]);

  const saveMindMap = useDebouncedCallback(async (updatedNodes: MindMapNode[]) => {
    const mapRef = getMindMapDocRef();
    if (mapRef) {
        await updateDoc(mapRef, { nodes: updatedNodes, updatedAt: new Date() });
        toast({ title: "Saved!" });
    }
  }, 1500);

  const pushToHistory = (newNodes: MindMapNode[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ nodes: JSON.parse(JSON.stringify(newNodes)) });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    saveMindMap(newNodes);
  };

  const handleUpdateNode = (id: string, updates: Partial<MindMapNode>) => {
    const newNodes = nodes.map(n => n.id === id ? {...n, ...updates} : n);
    setNodes(newNodes);
    // Debounced save will be triggered by a different effect
  };
  
  // Debounce saving when nodes change, but not on every minor update during drag
  useEffect(() => {
    if (historyIndex !== -1) {
      saveMindMap(nodes);
    }
  }, [nodes, historyIndex, saveMindMap]);


  const autoLayout = useCallback((nodesToLayout: MindMapNode[]): MindMapNode[] => {
    const root = nodesToLayout.find(n => !n.parentId);
    if (!root) return nodesToLayout;

    const nodeMap = new Map(nodesToLayout.map(n => [n.id, { ...n, children: [] as any[] }]));
    nodesToLayout.forEach(n => {
        if (n.parentId && nodeMap.has(n.parentId)) {
            nodeMap.get(n.parentId)!.children.push(n.id);
        }
    });
    
    const layoutNode = (nodeId: string, x: number, y: number, level: number, dir: number) => {
        const node = nodeMap.get(nodeId);
        if (!node) return;

        node.x = x;
        node.y = y;

        const children = node.children.map(childId => nodeMap.get(childId)).filter(Boolean);
        const totalChildHeight = children.reduce((acc, child) => acc + (child!.height) + 40, 0);
        
        let currentY = y - totalChildHeight / 2;

        children.forEach((child, index) => {
            const childHeight = child!.height;
            const childY = currentY + childHeight / 2;
            const childX = x + (dir * (node.width / 2 + 100 + child!.width / 2));
            layoutNode(child!.id, childX, childY, level + 1, dir);
            currentY += childHeight + 40;
        });
    };

    const rootNode = nodeMap.get(root.id)!;
    rootNode.x = 0;
    rootNode.y = 0;
    
    const midPoint = Math.ceil(rootNode.children.length / 2);
    const leftChildren = rootNode.children.slice(0, midPoint);
    const rightChildren = rootNode.children.slice(midPoint);

    let currentY = -leftChildren.reduce((acc, id) => acc + (nodeMap.get(id)!.height) + 40, 0) / 2;
    leftChildren.forEach(id => {
        const child = nodeMap.get(id)!;
        layoutNode(id, -(root.width/2 + 100 + child.width/2), currentY + child.height/2, 1, -1);
        currentY += child.height + 40;
    });

    currentY = -rightChildren.reduce((acc, id) => acc + (nodeMap.get(id)!.height) + 40, 0) / 2;
    rightChildren.forEach(id => {
        const child = nodeMap.get(id)!;
        layoutNode(id, (root.width/2 + 100 + child.width/2), currentY + child.height/2, 1, 1);
        currentY += child.height + 40;
    });
    
    return Array.from(nodeMap.values());
  }, []);
  
  useEffect(() => {
    if (nodes.length > 0) {
      const laidOutNodes = autoLayout(nodes);
      if (JSON.stringify(laidOutNodes) !== JSON.stringify(nodes)) {
        setNodes(laidOutNodes);
      }
    }
  }, [nodes, autoLayout]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedNodeId) return;

    if (e.key === 'F2') {
        e.preventDefault();
        setEditingNodeId(selectedNodeId);
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const parentNode = nodes.find(n => n.id === selectedNodeId);
      if (parentNode) {
        const newNode: MindMapNode = {
          id: uuidv4(),
          x: 0, y: 0, // Position will be set by autoLayout
          width: 150, height: 50,
          title: 'New Idea',
          style: 'default',
          backgroundColor: '#f8f9fa', color: '#212529',
          isBold: false, isItalic: false, isUnderline: false,
          parentId: parentNode.id,
        };
        const newNodes = autoLayout([...nodes, newNode]);
        setNodes(newNodes);
        pushToHistory(newNodes);
        setSelectedNodeId(newNode.id);
        setEditingNodeId(newNode.id);
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const siblingNode = nodes.find(n => n.id === selectedNodeId);
      if (siblingNode && siblingNode.parentId) {
        const newNode: MindMapNode = {
          id: uuidv4(),
          x: 0, y: 0, width: 150, height: 50,
          title: 'New Sibling',
          style: 'default',
          backgroundColor: '#f8f9fa', color: '#212529',
          isBold: false, isItalic: false, isUnderline: false,
          parentId: siblingNode.parentId,
        };
        const newNodes = autoLayout([...nodes, newNode]);
        setNodes(newNodes);
        pushToHistory(newNodes);
        setSelectedNodeId(newNode.id);
        setEditingNodeId(newNode.id);
      }
    }
    
    if (e.key === 'Delete') {
        const nodeToDelete = nodes.find(n => n.id === selectedNodeId);
        if (nodeToDelete && nodeToDelete.parentId) {
            const newNodes = nodes.filter(n => n.id !== selectedNodeId);
            setNodes(autoLayout(newNodes));
            pushToHistory(autoLayout(newNodes));
            setSelectedNodeId(nodeToDelete.parentId);
        }
    }
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0 && e.target === e.currentTarget) { // Left click on background
        isPanning.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if(isPanning.current) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        setOffset(prev => ({x: prev.x + dx, y: prev.y + dy}));
        lastMousePos.current = {x: e.clientX, y: e.clientY};
    }
  }

  const handleMouseUp = () => {
    isPanning.current = false;
  }
  
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomSpeed = 0.1;
    const newScale = e.deltaY > 0 ? scale * (1 - zoomSpeed) : scale * (1 + zoomSpeed);
    setScale(Math.min(Math.max(newScale, 0.2), 2));
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
            }}
            onBlur={() => {
                const mapRef = getMindMapDocRef();
                if (mapRef) {
                    updateDoc(mapRef, { name: mapName });
                }
            }}
            className="text-3xl font-bold font-headline h-auto p-0 border-none focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => {}}><Save /> Export PNG</Button>
            <Button variant="outline" onClick={() => {}}><Save /> Export PDF</Button>
        </div>
      </div>
      <div
        className="flex-1 relative overflow-hidden bg-background border rounded-lg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="w-full h-full"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: '0 0' }}
        >
            <div className="absolute top-1/2 left-1/2">
                <svg
                    className="absolute overflow-visible"
                >
                    {nodes.map(node => {
                        if (!node.parentId) return null;
                        const parent = nodes.find(p => p.id === node.parentId);
                        if (!parent) return null;
                        return (
                            <path
                                key={`conn-${node.id}`}
                                d={`M ${parent.x} ${parent.y} L ${node.x} ${node.y}`}
                                stroke="#ccc"
                                strokeWidth="2"
                                fill="none"
                            />
                        )
                    })}
                </svg>
                {nodes.map(node => (
                    <NodeComponent
                        key={node.id}
                        node={{...node, children: []}} // children are not used in this flat render
                        onUpdateNode={handleUpdateNode}
                        onSelectNode={setSelectedNodeId}
                        onStartEditing={setEditingNodeId}
                        selectedNodeId={selectedNodeId}
                        editingNodeId={editingNodeId}
                    />
                ))}
            </div>
        </div>
         <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setScale(s => Math.min(s*1.2, 2))}><Plus/></Button>
            <Button variant="outline" size="icon" onClick={() => setScale(s => Math.max(s*0.8, 0.2))}><Minus/></Button>
            <Button variant="outline" size="icon" onClick={() => { setScale(1); setOffset({x:0, y:0})}}><Expand/></Button>
        </div>
      </div>
    </div>
  );
}
