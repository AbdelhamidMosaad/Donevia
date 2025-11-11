
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
  applyEdgeChanges,
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
import { MindMapCustomNode } from './mind-map-custom-node';

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    data: { label: 'Central Idea' },
    position: { x: 250, y: 100 },
  },
];

const nodeTypes = {
  custom: MindMapCustomNode,
};

const MindMapTool = () => {
  const { user } = useAuth();
  const params = useParams();
  const { toast } = useToast();
  const router = useRouter();
  const mindMapId = params.mindMapId as string;
  const [boardName, setBoardName] = useState('');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
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

  const handleSave = useCallback(() => {
    if (!user) return;
    const reactFlow = { nodes, edges, nextId };
    const mapRef = doc(db, 'users', user.uid, 'mindMaps', mindMapId);
    updateDoc(mapRef, { name: boardName, reactFlow, updatedAt: serverTimestamp() });
  }, [user, mindMapId, boardName, nodes, edges, nextId]);

  const debouncedSave = useDebouncedCallback(handleSave, 2000);

  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
        if(historyIndex > -1) { // Do not save on initial load
          debouncedSave();
        }
    }
  }, [nodes, edges, debouncedSave]);

  const onNodesChangeWithHistory = (changes: NodeChange[]) => {
      const newNodes = applyNodeChanges(changes, nodes);
      onNodesChange(changes);
      // Only push to history on drag stop or remove
      if(changes.some(c => c.type === 'remove' || (c.type === 'position' && c.dragging === false))) {
          pushToHistory(newNodes, edges);
      }
  };

  const onEdgesChangeWithHistory = (changes: EdgeChange[]) => {
      const newEdges = applyEdgeChanges(changes, edges);
      onEdgesChange(changes);
      if(changes.some(c => c.type === 'remove')) {
          pushToHistory(nodes, newEdges);
      }
  };

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
            const reactFlowData = data.reactFlow || { nodes: initialNodes, edges: [] };
            
            const nodesWithCustomType = reactFlowData.nodes.map(n => ({...n, type: 'custom'}));

            setNodes(nodesWithCustomType);
            setEdges(reactFlowData.edges || []);
            setNextId(data.reactFlow?.nextId || (reactFlowData.nodes?.length || 1) + 1);
            
            // Initialize history
            if (reactFlowData.nodes && history.length === 0) {
              setHistory([{ nodes: nodesWithCustomType, edges: reactFlowData.edges || [] }]);
              setHistoryIndex(0);
            }
        }
      });
      return () => unsub();
    }
  }, [user, mindMapId]);
  
  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const newEdges = addEdge({ ...params, animated: true, type: 'smoothstep' }, edges);
      setEdges(newEdges);
      pushToHistory(nodes, newEdges);
    },
    [edges, nodes, pushToHistory, setEdges]
  );

  const addNode = () => {
    const newId = nextId.toString();
    const lastNode = nodes[nodes.length - 1];
    const newNodePosition = lastNode 
        ? { x: lastNode.position.x + 50, y: lastNode.position.y + 50 }
        : { x: Math.random() * 200, y: Math.random() * 200 };
        
    const newNode: Node = {
      id: newId,
      type: 'custom',
      data: { label: `Idea ${newId}` },
      position: newNodePosition,
    };
    const newNodes = [...nodes, newNode];
    setNodes(newNodes);
    setNextId(nextId + 1);
    pushToHistory(newNodes, edges);
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
            onNodesChange={onNodesChangeWithHistory}
            onEdgesChange={onEdgesChangeWithHistory}
            onConnect={onConnect}
            fitView
            style={{ background: "#f3f4f6" }}
            nodeTypes={nodeTypes}
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
