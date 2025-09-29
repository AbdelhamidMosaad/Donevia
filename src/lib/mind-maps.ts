
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import type { MindMapType, MindMapNode } from './types';

export const addMindMap = async (userId: string, name: string) => {
  const mindMapsRef = collection(db, 'users', userId, 'mindMaps');
  const rootNode: MindMapNode = {
    id: '1',
    text: 'Central Idea',
    x: 0,
    y: 0,
    parentId: null,
    children: [],
    collapsed: false,
    color: '#8b5cf6',
    shape: 'rounded',
    fontSize: 18,
    bold: true,
    width: 200,
  };
  
  return await addDoc(mindMapsRef, {
    name,
    ownerId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    nodes: { '1': rootNode },
    connections: [],
    scale: 1,
    pan: { x: 0, y: 0 },
  });
};

export const updateMindMap = async (userId: string, mapId: string, mapData: Partial<MindMapType>) => {
  const mapRef = doc(db, 'users', userId, 'mindMaps', mapId);
  return await updateDoc(mapRef, {
    ...mapData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteMindMap = async (userId: string, mapId: string) => {
  const mapRef = doc(db, 'users', userId, 'mindMaps', mapId);
  return await deleteDoc(mapRef);
};
