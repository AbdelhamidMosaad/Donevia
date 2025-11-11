// MindMap.tsx
'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  useReactFlow,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '../ui/input';
import { useDebouncedCallback } from 'use-debounce';
import { MindMapNode, MindMapType as MindMapData } from '@/lib/types';

// -------------------------- Helper Utilities --------------------------
const uid = () => Math.random().toString(36).slice(2, 9);

function findDescendants(nodeId: string, edges: Edge[]): string[] {
  const children = edges.filter((e) => e.source === nodeId).map((e) => e.target);
  const all = new Set<string>(children);
  children.forEach((c) => {
    findDescendants(c, edges).forEach((d) => all.add(d));
  });
  return Array.from(all);
}

// -------------------------- Custom Node Component --------------------------
function CustomNode({ data, id }: { data: any; id: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(data.label);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setValue(data.label), [data.label]);

  useEffect(() => {
    if (editing && ref.current) ref.current.focus();
  }, [editing]);

  return (
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      layout
      className={`min-w-[140px] max-w-[280px] p-3 rounded-2xl shadow-md border 
        ${data.theme === 'dark' ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200'}`}
      onDoubleClick={() => setEditing(true)}
    >
      <div className="flex items-start gap-2">
        {data.icon ? (
          <div className="text-xl select-none">{data.icon}</div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center">•</div>
        )}
        <div className="flex-1">
          {editing ? (
            <textarea
              ref={ref}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => {
                data.onChange(id, value.trim() || 'Untitled');
                setEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  data.onChange(id, value.trim() || 'Untitled');
                  setEditing(false);
                }
              }}
              className="w-full resize-none bg-transparent outline-none text-sm"
              rows={3}
            />
          ) : (
            <div className="text-sm leading-snug break-words whitespace-pre-wrap">{data.label}</div>
          )}
          <div className="mt-2 flex items-center gap-2 text-[11px] opacity-80">
            <button
              onClick={() => data.toggleCollapse(id)}
              className="px-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {data.collapsed ? 'Expand' : 'Collapse'}
            </button>
            <button
              onClick={() => data.addChild(id)}
              className="px-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              + Child
            </button>
            <button
              onClick={() => data.deleteNode(id)}
              className="px-2 py-1 rounded-full text-rose-600 hover:bg-rose-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// -------------------------- Main App --------------------------
function MindMapApp() {
  const { user } = useAuth();
  const params = useParams();
  const { toast } = useToast();
  const mindMapId = params.mindMapId as string;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [boardName, setBoardName] = useState('Loading Mind Map...');
  
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [future, setFuture] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);

  const reactFlowWrapper = useRef(null);
  const { fitView, zoomIn, zoomOut, getNodes, getEdges } = useReactFlow();

  const getBoardDocRef = useCallback(() => {
    if (!user || !mindMapId) return null;
    return doc(db, 'users', user.uid, 'mindMaps', mindMapId);
  }, [user, mindMapId]);
  
  const handleSave = useCallback(() => {
    const boardRef = getBoardDocRef();
    if (!boardRef) return;
    
    const reactFlowInstance = { nodes: getNodes(), edges: getEdges() };
    const dataToSave = {
        name: boardName,
        reactFlow: reactFlowInstance,
        updatedAt: serverTimestamp(),
    };
    updateDoc(boardRef, dataToSave);
  }, [getBoardDocRef, getNodes, getEdges, boardName]);
  
  const debouncedSave = useDebouncedCallback(handleSave, 2000);

  useEffect(() => {
    const boardRef = getBoardDocRef();
    if (boardRef) {
        const unsub = onSnapshot(boardRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data() as MindMapData;
                setBoardName(data.name);
                
                if (data.reactFlow) {
                    const reactFlowData = data.reactFlow;
                    const loadedNodes = reactFlowData.nodes.map(n => ({
                        ...n,
                        data: {
                            ...n.data,
                            onChange: updateNodeLabel,
                            addChild,
                            deleteNode,
                            toggleCollapse,
                        },
                    }));
                    setNodes(loadedNodes);
                    setEdges(reactFlowData.edges || []);
                     if (history.length === 0) {
                        setHistory([{ nodes: loadedNodes, edges: reactFlowData.edges || [] }]);
                    }
                }
            }
        });
        return () => unsub();
    }
  }, [user, mindMapId]);

  useEffect(() => {
    if (history.length > 1) { // Don't save on initial load
        debouncedSave();
    }
  }, [nodes, edges]);

  // register custom node type mapping
  const nodeTypes = useMemo(() => ({
    custom: (props: any) => <CustomNode {...props} />,
  }), []);

  // ----------------- CRUD helpers -----------------
  const pushHistory = useCallback(() => {
    setHistory((h) => [...h, { nodes: getNodes(), edges: getEdges() }]);
    setFuture([]);
  }, [getNodes, getEdges]);

  const undo = () => {
    setHistory((h) => {
      if (h.length <= 1) return h;
      const copy = [...h];
      const last = copy.pop()!;
      setFuture((f) => [last, ...f]);
      const prev = copy[copy.length - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      return copy;
    });
  };

  const redo = () => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const [first, ...rest] = f;
      setNodes(first.nodes);
      setEdges(first.edges);
      setHistory((h) => [...h, first]);
      return rest;
    });
  };

  const createNode = (position: {x:number, y:number}, label = 'New Idea'): string => {
    const id = uid();
    const newNode: Node = {
      id,
      position,
      data: { 
          label, 
          icon: '🟢', 
          theme: 'light',
          onChange: updateNodeLabel,
          addChild,
          deleteNode,
          toggleCollapse,
        },
      type: 'custom',
    };
    pushHistory();
    setNodes((nds) => [...nds, newNode]);
    return id;
  };

  const addChild = (parentId: string) => {
    const parent = nodes.find((n) => n.id === parentId);
    if (!parent) return;
    const pos = { x: parent.position.x + 220, y: parent.position.y + 80 };
    const childId = createNode(pos, 'Child');
    const newEdge = { id: uid(), source: parentId, target: childId, markerEnd: { type: MarkerType.Arrow } };
    pushHistory();
    setEdges((eds) => [...eds, newEdge]);
  };

  const updateNodeLabel = (id: string, label: string) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n)));
    pushHistory();
  };

  const toggleCollapse = (id: string) => {
    const descendants = findDescendants(id, edges);
    
    setNodes((nds) => nds.map((n) => {
        if(n.id === id) return { ...n, data: { ...n.data, collapsed: !n.data.collapsed } };
        if(descendants.includes(n.id)) return { ...n, hidden: !n.hidden };
        return n;
    }));
    setEdges((eds) => eds.map(e => {
        if (descendants.includes(e.source) || descendants.includes(e.target)) return { ...e, hidden: !e.hidden };
        return e;
    }));

    pushHistory();
  };

  const deleteNode = (id: string) => {
    if(id === 'root') {
        toast({ variant: 'destructive', title: "Cannot delete the root node."});
        return;
    };
    pushHistory();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };

  // ----------------- React Flow event handlers -----------------
  const onConnect = useCallback((params: Edge | Connection) => {
    pushHistory();
    setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.Arrow } }, eds));
  }, [pushHistory, setEdges]);

  const onPaneDoubleClick = (event: React.MouseEvent) => {
    const reactFlowInstance = (reactFlowWrapper.current as any);
    if (!reactFlowInstance) return;
    
    const bounds = reactFlowInstance.getBoundingClientRect();
    const position = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
    };
    createNode(position, 'Idea');
  };

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') undo();
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') redo();
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [history, future, nodes, edges, undo, redo, handleSave]);

  // ----------------- Export / Import -----------------
  const downloadJSON = () => {
    const payload = { nodes: getNodes(), edges: getEdges() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindmap.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.nodes && parsed.edges) {
          pushHistory();
          const importedNodes = parsed.nodes.map((n: Node) => ({
              ...n,
              data: {
                ...n.data,
                onChange: updateNodeLabel,
                addChild,
                deleteNode,
                toggleCollapse,
              },
          }));
          setNodes(importedNodes);
          setEdges(parsed.edges);
        } else {
          alert('Invalid mindmap file');
        }
      } catch (err) {
        alert('Error parsing file');
      }
    };
    reader.readAsText(file);
  };
  
    // ----------------- UI Controls -----------------
  return (
    <div className="flex h-full w-full bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <div className="w-72 p-4 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
        <Input
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            className="text-lg font-bold font-headline h-auto p-0 border-none focus-visible:ring-0 focus-visible:ring-offset-0 mb-2"
        />
        <p className="text-sm mb-4 text-slate-600 dark:text-slate-300">Double-click the canvas to add a node. Double-click a node to edit.</p>

        <div className="space-y-2">
          <Button onClick={() => addChild('root')} className="w-full">
            + Add child to root
          </Button>
          <div className="flex gap-2">
            <Button onClick={undo} className="flex-1" variant="outline">Undo</Button>
            <Button onClick={redo} className="flex-1" variant="outline">Redo</Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => fitView()} className="flex-1" variant="outline">Fit</Button>
            <Button onClick={() => zoomIn()} className="p-2" variant="outline">+</Button>
            <Button onClick={() => zoomOut()} className="p-2" variant="outline">-</Button>
          </div>
          <div className="mt-2">
            <label className="block text-xs text-slate-500">Import JSON</label>
            <Input
              type="file"
              accept="application/json"
              onChange={(e) => e.target.files && importJSON(e.target.files[0])}
              className="mt-1"
            />
          </div>
          <div className="mt-2 flex gap-2">
            <Button onClick={downloadJSON} className="flex-1" variant="outline">Export</Button>
            <Button onClick={() => { setNodes([{ id: 'root', position: { x: 300, y: 120 }, data: { label: 'Central Idea', icon: '💡', onChange: updateNodeLabel, addChild, deleteNode, toggleCollapse }, type: 'custom' }]); setEdges([]); setHistory([]); setFuture([]); }} className="flex-1" variant="outline">Reset</Button>
          </div>
        </div>

        <div className="mt-6 text-xs text-slate-500">
          <div className="font-semibold">Tips</div>
          <ul className="list-disc ml-4 mt-2">
            <li>Drag nodes to arrange ideas.</li>
            <li>Connect nodes by dragging from the connector points.</li>
            <li>Use Ctrl/Cmd+S to export, Ctrl/Cmd+Z to undo.</li>
          </ul>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes.filter((n) => !n.hidden)}
          edges={edges.filter((e) => !e.hidden)}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneDoubleClick={onPaneDoubleClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          snapToGrid
          snapGrid={[20, 20]}
          className="bg-transparent"
        >
          <MiniMap />
          <Controls />
          <Background gap={16} />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function MindMapTool() {
    return (
        <ReactFlowProvider>
            <MindMapApp />
        </ReactFlowProvider>
    )
}