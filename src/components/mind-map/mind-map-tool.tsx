'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Connection,
  applyNodeChanges,
  NodeChange,
  EdgeChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from 'use-debounce';
import type { MindMapType as MindMapData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Undo, Redo, Save, ArrowLeft } from 'lucide-react';
import { Input } from '../ui/input';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Central Idea' },
    position: { x: 250, y: 100 },
    style: {
      background: '#f9fafb',
      border: '2px solid #6366f1',
      borderRadius: '12px',
      padding: '10px 20px',
      fontWeight: '600',
    },
  },
];

const MindMapTool = () => {
  const { user } = useAuth();
  const params = useParams();
  const { toast } = useToast();
  const router = useRouter();
  const mindMapId = params.mindMapId as string;
  const [boardName, setBoardName] = useState('');

  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [nextId, setNextId] = useState(2);
  
  const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushToHistory = useCallback((currentNodes: Node[], currentEdges: Edge[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    const lastState = newHistory[newHistory.length - 1];

    if (
      lastState &&
      JSON.stringify(lastState.nodes) === JSON.stringify(currentNodes) &&
      JSON.stringify(lastState.edges) === JSON.stringify(currentEdges)
    ) {
      return; // Do not push identical states
    }

    newHistory.push({ nodes: currentNodes, edges: currentEdges });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
      const newNodes = applyNodeChanges(changes, nodes);
      setNodes(newNodes);
  }, [nodes, setNodes]);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
      const newEdges = applyEdgeChanges(changes, edges);
      setEdges(newEdges);
  }, [edges, setEdges]);
  
  const handleSave = useCallback(() => {
    if (!user) return;
    const reactFlow = { nodes, edges, nextId };
    const mapRef = doc(db, 'users', user.uid, 'mindMaps', mindMapId);
    updateDoc(mapRef, { name: boardName, reactFlow, updatedAt: serverTimestamp() });
  }, [user, mindMapId, boardName, nodes, edges, nextId]);

  const debouncedSave = useDebouncedCallback(handleSave, 2000);

  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
        pushToHistory(nodes, edges);
        debouncedSave();
    }
  }, [nodes, edges, debouncedSave, pushToHistory]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const { nodes: nodesToRestore, edges: edgesToRestore } = history[newIndex];
      setNodes(nodesToRestore);
      setEdges(edgesToRestore);
    }
  }, [historyIndex, history, setNodes, setEdges]);
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const { nodes: nodesToRedo, edges: edgesToRedo } = history[newIndex];
      setNodes(nodesToRedo);
      setEdges(edgesToRedo);
    }
  }, [historyIndex, history, setNodes, setEdges]);

  useEffect(() => {
    if (user && mindMapId) {
      const unsub = onSnapshot(doc(db, "users", user.uid, "mindMaps", mindMapId), (doc) => {
        if (doc.exists()) {
            const data = doc.data() as MindMapData;
            setBoardName(data.name);
            setNodes(data.reactFlow?.nodes || initialNodes);
            setEdges(data.reactFlow?.edges || []);
            setNextId(data.reactFlow?.nextId || (data.reactFlow?.nodes?.length || 1) + 1);
            
            // Initialize history
            if (data.reactFlow && history.length === 0) {
              setHistory([{ nodes: data.reactFlow.nodes, edges: data.reactFlow.edges }]);
              setHistoryIndex(0);
            }
        }
      });
      return () => unsub();
    }
  }, [user, mindMapId, setNodes, setEdges]);
  
  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true, type: 'smoothstep' }, eds)),
    [setEdges]
  );

  const addNode = () => {
    const newId = nextId.toString();
    const lastNode = nodes[nodes.length - 1];
    const newNodePosition = lastNode 
        ? { x: lastNode.position.x + 50, y: lastNode.position.y + 50 }
        : { x: Math.random() * 200, y: Math.random() * 200 };
        
    const newNode: Node = {
      id: newId,
      data: { label: `Idea ${newId}` },
      position: newNodePosition,
      style: {
        background: '#fff',
        border: '1px solid #9ca3af',
        borderRadius: '10px',
        padding: '10px 20px',
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNextId(nextId + 1);
  };
  
  const onNodeDoubleClick = (event: React.MouseEvent, node: Node) => {
    const newLabel = prompt('Enter new label:', node.data.label);
    if (newLabel !== null) {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            n.data = { ...n.data, label: newLabel };
          }
          return n;
        })
      );
    }
  };

  return (
    <div style={{ width: "100%", height: "100%" }} className="flex flex-col">
       <div className="flex justify-between items-center p-2 border-b">
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => router.push('/mind-map')}><ArrowLeft /></Button>
            <Input
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                className="text-xl font-bold font-headline h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
        </div>
        <div className="flex gap-2">
            <Button onClick={undo} variant="outline" size="sm" disabled={historyIndex <= 0}><Undo/> Undo</Button>
            <Button onClick={redo} variant="outline" size="sm" disabled={historyIndex >= history.length - 1}><Redo/> Redo</Button>
            <Button onClick={addNode} variant="outline" size="sm"><PlusCircle/> Add Node</Button>
            <Button onClick={debouncedSave.flush} size="sm"><Save /> Save Now</Button>
        </div>
      </div>
      <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDoubleClick={onNodeDoubleClick}
            fitView
            style={{ background: "#f3f4f6" }}
          >
            <MiniMap />
            <Controls />
            <Background color="#aaa" gap={16} />
          </ReactFlow>
       </div>
    </div>
  );
};

export default MindMapTool;
