'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer, Line, Rect, Text, Group } from 'react-konva';
import Konva from 'konva';
import throttle from 'lodash.throttle';
import { jsPDF } from 'jspdf';
import { useAuth } from '@/hooks/use-auth';

// Firebase modular imports
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams } from 'next/navigation';

// -----------------------------
// Types
// -----------------------------
type User = { id: string; name: string; color?: string };

type StrokeDoc = {
  userId: string;
  points: number[]; // flat array [x1,y1,x2,y2,...]
  color: string;
  width: number;
  createdAt: any;
  deleted?: boolean;
};

type ShapeDoc = {
  userId: string;
  type: 'rect' | 'circle' | 'arrow' | 'sticky' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  color?: string;
  fontSize?: number;
  createdAt?: any;
  deleted?: boolean;
};

// -----------------------------
// Helper utils
// -----------------------------
function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// -----------------------------
// Component
// -----------------------------
export default function DigitalWhiteboard() {
  const { user: authUser } = useAuth();
  const params = useParams();
  const boardId = params.whiteboardId as string;

  // Adapt user prop
  const user: User | null = authUser ? { id: authUser.uid, name: authUser.displayName || 'Anonymous', color: '#FF6B6B' } : null;

  // Stage refs
  const stageRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  // UI state
  const [tool, setTool] = useState<'pan' | 'pen' | 'rect' | 'circle' | 'sticky' | 'text' | 'select'>('pen');
  const [color, setColor] = useState('#333333');
  const [widthPx, setWidthPx] = useState(4);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const currentPointsRef = useRef<number[]>([]);

  // Local representation of remote objects
  const [strokes, setStrokes] = useState<Record<string, StrokeDoc>>({});
  const [shapes, setShapes] = useState<Record<string, ShapeDoc>>({});

  // Undo/redo stacks (store doc ids and action type)
  const undoStackRef = useRef<Array<{ kind: 'stroke' | 'shape'; id: string }>>([]);
  const redoStackRef = useRef<Array<{ kind: 'stroke' | 'shape'; id: string }>>([]);

  // Canvas transform
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // Presence (other users cursors)
  const [presence, setPresence] = useState<Record<string, any>>({});

  // Throttled presence updater
  const updatePresenceThrottled = useRef<any>(
    throttle(async (x: number, y: number) => {
        if (!user) return;
      try {
        await setDoc(doc(db, `boards/${boardId}/presence`, user.id), {
          userId: user.id,
          name: user.name,
          color: user.color || '#2b6cb0',
          x,
          y,
          lastSeen: serverTimestamp(),
        });
      } catch (e) {
        // ignore for now
      }
    }, 200)
  ).current;

  // -----------------------------
  // Firestore listeners
  // -----------------------------
  useEffect(() => {
    if (!boardId) return;

    // listen strokes
    const strokesQ = query(collection(db, `boards/${boardId}/strokes`), orderBy('createdAt'));
    const unsubStrokes = onSnapshot(strokesQ, (snap) => {
      const next: Record<string, StrokeDoc> = {};
      snap.forEach((d) => {
        const data = d.data() as StrokeDoc;
        next[d.id] = data;
      });
      setStrokes((prev) => ({ ...prev, ...next }));
    });

    // listen shapes
    const shapesQ = query(collection(db, `boards/${boardId}/shapes`), orderBy('createdAt'));
    const unsubShapes = onSnapshot(shapesQ, (snap) => {
      const next: Record<string, ShapeDoc> = {};
      snap.forEach((d) => {
        const data = d.data() as ShapeDoc;
        next[d.id] = data;
      });
      setShapes((prev) => ({ ...prev, ...next }));
    });

    // presence
    const presenceQ = collection(db, `boards/${boardId}/presence`);
    const unsubPresence = onSnapshot(presenceQ, (snap) => {
      const next: Record<string, any> = {};
      snap.forEach((d) => {
        next[d.id] = d.data();
      });
      setPresence(next);
    });

    return () => {
      unsubStrokes();
      unsubShapes();
      unsubPresence();
    };
  }, [boardId]);

  // -----------------------------
  // Drawing handlers (Pen)
  // -----------------------------
  const handleMouseDown = (e: any) => {
    if (tool !== 'pen' || !user) return;
    setIsDrawing(true);
    const pos = stageRef.current.getPointerPosition();
    currentPointsRef.current = [pos.x, pos.y];
  };

  const handleMouseMove = (e: any) => {
    if(!stageRef.current) return;
    const pos = stageRef.current.getPointerPosition();
    updatePresenceThrottled(pos.x, pos.y);

    if (tool === 'pen' && isDrawing) {
      // add points
      currentPointsRef.current.push(pos.x, pos.y);
      // re-render happens via local temporary line by Konva; we'll store final stroke on mouseup
      // we can optionally write a temporary doc to Firestore for smoother multi-user drawing, but that increases writes
      // For simplicity, only push final stroke on mouseup
      // Force React update by using a dummy state toggle (not shown here) or use a ref-render hack; we'll skip that optimization
    }
  };

  const handleMouseUp = async (e: any) => {
    if (!user) return;
    if (tool === 'pen' && isDrawing) {
      setIsDrawing(false);
      const points = currentPointsRef.current.slice();
      currentPointsRef.current = [];
      if (points.length < 4) return; // ignore tiny strokes

      // save stroke to Firestore
      try {
        const docRef = await addDoc(collection(db, `boards/${boardId}/strokes`), {
          userId: user.id,
          points,
          color,
          width: widthPx,
          createdAt: serverTimestamp(),
        });
        // push to undo stack
        undoStackRef.current.push({ kind: 'stroke', id: docRef.id });
        // clear redo stack when new action happens
        redoStackRef.current = [];
      } catch (err) {
        console.error('Failed to save stroke', err);
      }
    }
  };

  // -----------------------------
  // Add a sticky note
  // -----------------------------
  const addSticky = async () => {
    if(!user) return;
    const id = uid();
    const payload: ShapeDoc = {
      userId: user.id,
      type: 'sticky',
      x: 100,
      y: 100,
      width: 200,
      height: 120,
      text: 'New note',
      color: '#FFF59D',
      fontSize: 16,
      createdAt: serverTimestamp(),
    };
    try {
      const docRef = doc(db, `boards/${boardId}/shapes`, id);
      await setDoc(docRef, payload);
      undoStackRef.current.push({ kind: 'shape', id });
      redoStackRef.current = [];
    } catch (e) {
      console.error('addSticky failed', e);
    }
  };

  // -----------------------------
  // Delete / soft-delete operations (used for undo)
  // -----------------------------
  const softDeleteShape = async (shapeId: string) => {
    try {
      await updateDoc(doc(db, `boards/${boardId}/shapes`, shapeId), { deleted: true });
    } catch (e) {
      console.error(e);
    }
  };

  const restoreShape = async (shapeId: string) => {
    try {
      await updateDoc(doc(db, `boards/${boardId}/shapes`, shapeId), { deleted: false });
    } catch (e) {
      console.error(e);
    }
  };

  const softDeleteStroke = async (strokeId: string) => {
    try {
      await updateDoc(doc(db, `boards/${boardId}/strokes`, strokeId), { deleted: true });
    } catch (e) {
      console.error(e);
    }
  };

  const restoreStroke = async (strokeId: string) => {
    try {
      await updateDoc(doc(db, `boards/${boardId}/strokes`, strokeId), { deleted: false });
    } catch (e) {
      console.error(e);
    }
  };

  // -----------------------------
  // Undo / Redo simple implementation (per-user sequence)
  // -----------------------------
  const undo = async () => {
    const last = undoStackRef.current.pop();
    if (!last) return;
    if (last.kind === 'stroke') {
      await softDeleteStroke(last.id);
    } else {
      await softDeleteShape(last.id);
    }
    redoStackRef.current.push(last);
  };

  const redo = async () => {
    const last = redoStackRef.current.pop();
    if (!last) return;
    if (last.kind === 'stroke') {
      await restoreStroke(last.id);
    } else {
      await restoreShape(last.id);
    }
    undoStackRef.current.push(last);
  };

  // -----------------------------
  // Export functions
  // -----------------------------
  const exportPNG = () => {
    if(!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 3 });
    const a = document.createElement('a');
    a.href = uri;
    a.download = `${boardId || 'board'}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const exportPDF = () => {
    if(!stageRef.current) return;
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const pdf = new jsPDF({ orientation: 'landscape' });
    pdf.addImage(uri, 'PNG', 10, 10, 277, 190);
    pdf.save(`${boardId || 'board'}.pdf`);
  };

  // -----------------------------
  // Wheel zoom handler
  // -----------------------------
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if(!stage) return;
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const scaleBy = 1.05;
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
    setScale(newScale);

    // to keep the pointer in the same place after scale
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStagePos(newPos);
  };

  // -----------------------------
  // Render helpers for strokes/shapes
  // -----------------------------
  const renderStrokes = () => {
    return Object.entries(strokes).map(([id, s]) => {
      if (s.deleted) return null;
      return (
        <Line
          key={id}
          points={s.points}
          stroke={s.color}
          strokeWidth={s.width}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation={s.width > 0 ? 'source-over' : 'source-over'}
        />
      );
    });
  };

  const renderShapes = () => {
    return Object.entries(shapes).map(([id, s]) => {
      if (s.deleted) return null;
      if (s.type === 'sticky') {
        return (
          <Group key={id} x={s.x} y={s.y} draggable>
            <Rect width={s.width} height={s.height} fill={s.color || '#FFF59D'} cornerRadius={6} />
            <Text text={s.text || ''} padding={10} width={s.width} fontSize={s.fontSize || 16} />
          </Group>
        );
      }
      if (s.type === 'text') {
        return <Text key={id} x={s.x} y={s.y} text={s.text || ''} fontSize={s.fontSize || 18} />;
      }
      if (s.type === 'rect') {
        return <Rect key={id} x={s.x} y={s.y} width={s.width} height={s.height} stroke={s.color || '#333'} />;
      }
      if (s.type === 'circle') {
        return <Konva.Circle key={id} x={s.x} y={s.y} radius={s.radius || 40} stroke={s.color || '#333'} />;
      }
      return null;
    });
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="w-full h-full flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Toolbar */}
      <div className="p-2 flex items-center gap-2 bg-white shadow">
        <button className="px-3 py-1 border rounded" onClick={() => setTool('pan')}>Pan</button>
        <button className="px-3 py-1 border rounded" onClick={() => setTool('pen')}>Pen</button>
        <button className="px-3 py-1 border rounded" onClick={() => setTool('rect')}>Rect</button>
        <button className="px-3 py-1 border rounded" onClick={() => setTool('circle')}>Circle</button>
        <button className="px-3 py-1 border rounded" onClick={() => setTool('sticky')}>Sticky</button>
        <button className="px-3 py-1 border rounded" onClick={() => addSticky()}>+ Add Sticky</button>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <input type="range" min={1} max={20} value={widthPx} onChange={(e) => setWidthPx(Number(e.target.value))} />
        <button className="px-3 py-1 border rounded" onClick={undo}>Undo</button>
        <button className="px-3 py-1 border rounded" onClick={redo}>Redo</button>
        <button className="px-3 py-1 border rounded" onClick={exportPNG}>Export PNG</button>
        <button className="px-3 py-1 border rounded" onClick={exportPDF}>Export PDF</button>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-gray-50">
        <Stage
          width={typeof window !== 'undefined' ? window.innerWidth : 1200}
          height={typeof window !== 'undefined' ? window.innerHeight - 64 : 800}
          draggable={tool === 'pan'}
          onWheel={handleWheel}
          ref={stageRef}
          scaleX={scale}
          scaleY={scale}
          x={stagePos.x}
          y={stagePos.y}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
        >
          <Layer ref={layerRef}>
            {/* background grid */}
            <Rect x={-4000} y={-4000} width={8000} height={8000} fill="#ffffff" />
            {renderStrokes()}
            {renderShapes()}

            {/* live cursors */}
            {Object.entries(presence).map(([id, p]) => {
              if (!p || !user || id === user.id) return null;
              return (
                <Group key={id} x={p.x} y={p.y}>
                  <Rect width={8} height={8} fill={p.color} offsetX={4} offsetY={4} cornerRadius={4} />
                  <Text y={12} text={p.name} fontSize={12} />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
