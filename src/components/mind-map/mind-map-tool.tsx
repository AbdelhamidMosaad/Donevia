
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from 'use-debounce';
import type { MindMapType as MindMapData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PlusCircle, Undo, Redo, Save } from 'lucide-react';
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
  const mindMapId = params.mindMapId as string;
  const [boardName, setBoardName] = useState('');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nextId, setNextId] = useState(2);
  
  const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushToHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    // Don't push if the state is the same as the last one
    if (newHistory.length > 0) {
      const lastState = newHistory[newHistory.length - 1];
      if (JSON.stringify(lastState.nodes) === JSON.stringify(newNodes) && JSON.stringify(lastState.edges) === JSON.stringify(newEdges)) {
        return;
      }
    }
    newHistory.push({ nodes: newNodes, edges: newEdges });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
        pushToHistory(nodes, edges);
    }
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      const { nodes: nodesToRestore, edges: edgesToRestore } = history[historyIndex - 1];
      setNodes(nodesToRestore);
      setEdges(edgesToRestore);
    }
  }, [historyIndex, history, setNodes, setEdges]);
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      const { nodes: nodesToRedo, edges: edgesToRedo } = history[historyIndex + 1];
      setNodes(nodesToRedo);
      setEdges(edgesToRedo);
    }
  }, [historyIndex, history, setNodes, setEdges]);


  const debouncedSave = useDebouncedCallback(async (dataToSave: Partial<MindMapData>) => {
    if (!user || !mindMapId) return;
    const mapRef = doc(db, 'users', user.uid, 'mindMaps', mindMapId);
    try {
      await updateDoc(mapRef, { ...dataToSave, updatedAt: serverTimestamp() });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to save mind map.' });
    }
  }, 2000);

  useEffect(() => {
    if (user && mindMapId) {
      const unsub = onSnapshot(doc(db, "users", user.uid, "mindMaps", mindMapId), (doc) => {
        if (doc.exists()) {
            const data = doc.data() as MindMapData;
            setBoardName(data.name);
            setNodes(data.reactFlow?.nodes || initialNodes);
            setEdges(data.reactFlow?.edges || []);
            setNextId(data.reactFlow?.nextId || (data.reactFlow?.nodes?.length || 1) + 1);
        }
      });
      return () => unsub();
    }
  }, [user, mindMapId, setNodes, setEdges]);
  
  const handleSave = () => {
    if(!user) return;
    debouncedSave.flush();
    toast({ title: 'Mind map saved!'});
  }

  useEffect(() => {
    if (nodes.length > 0) {
        debouncedSave({ name: boardName, reactFlow: { nodes, edges, nextId } });
    }
  }, [nodes, edges, nextId, boardName, debouncedSave]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true, type: 'smoothstep' }, eds)),
    [setEdges]
  );

  const addNode = () => {
    const newId = nextId.toString();
    const lastNode = nodes[nodes.length - 1];
    const newNodePosition = lastNode 
        ? { x: lastNode.position.x + 100, y: lastNode.position.y + 100 }
        : { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 };
        
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
    setNodes(nodes.map(n => n.id === node.id ? { ...n, data: { ...n.data, isEditing: true } } : n));
  };

  const handleNodeLabelChange = (nodeId: string, newLabel: string) => {
    setNodes(
      nodes.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, label: newLabel } } : n
      )
    );
  };

  const handleNodeLabelBlur = (nodeId: string) => {
     setNodes(
      nodes.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, isEditing: false } } : n
      )
    );
  }

  const CustomNode = ({ data, id }: {data: any, id: string}) => {
    if (data.isEditing) {
      return (
        <Input 
          value={data.label}
          onChange={(e) => handleNodeLabelChange(id, e.target.value)}
          onBlur={() => handleNodeLabelBlur(id)}
          autoFocus
        />
      );
    }
    return <div>{data.label}</div>
  }

  const nodeTypes = {
    custom: CustomNode,
  };


  return (
    <div style={{ width: "100%", height: "100%" }} className="flex flex-col">
       <div className="flex justify-between items-center p-2 border-b">
         <Input
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            className="text-xl font-bold font-headline h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0"
         />
        <div className="flex gap-2">
            <Button onClick={undo} variant="outline" size="sm" disabled={historyIndex <= 0}><Undo/> Undo</Button>
            <Button onClick={redo} variant="outline" size="sm" disabled={historyIndex >= history.length - 1}><Redo/> Redo</Button>
            <Button onClick={addNode} variant="outline" size="sm"><PlusCircle/> Add Node</Button>
            <Button onClick={handleSave} size="sm"><Save /> Save</Button>
        </div>
      </div>
      <div className="flex-1">
          <ReactFlow
            nodes={nodes.map(n => ({...n, type: 'custom'}))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
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
