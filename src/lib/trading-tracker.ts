import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Trade } from './types';

// --- Trades ---
export const addTrade = async (userId: string, tradeData: Partial<Omit<Trade, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>>) => {
  const tradesRef = collection(db, 'users', userId, 'trades');
  return await addDoc(tradesRef, {
    ...tradeData,
    ownerId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateTrade = async (userId: string, tradeId: string, tradeData: Partial<Omit<Trade, 'id'>>) => {
  const tradeRef = doc(db, 'users', userId, 'trades', tradeId);
  return await updateDoc(tradeRef, {
    ...tradeData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteTrade = async (userId: string, tradeId: string) => {
  const tradeRef = doc(db, 'users', userId, 'trades', tradeId);
  return await deleteDoc(tradeRef);
};
