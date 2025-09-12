
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Trade, TradingStrategy } from './types';

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


// --- Strategies ---
export const addStrategy = async (userId: string, strategyData: Omit<TradingStrategy, 'id' | 'createdAt' | 'ownerId'>) => {
  const strategiesRef = collection(db, 'users', userId, 'tradingStrategies');
  return await addDoc(strategiesRef, {
    ...strategyData,
    ownerId: userId,
    createdAt: serverTimestamp(),
  });
};

export const updateStrategy = async (userId: string, strategyId: string, strategyData: Partial<Omit<TradingStrategy, 'id'>>) => {
  const strategyRef = doc(db, 'users', userId, 'tradingStrategies', strategyId);
  return await updateDoc(strategyRef, strategyData);
};

export const deleteStrategy = async (userId: string, strategyId: string) => {
  const strategyRef = doc(db, 'users', userId, 'tradingStrategies', strategyId);
  return await deleteDoc(strategyRef);
};

    