
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ClientRequest } from './types';

// --- Client Request Management ---
export const addRequest = async (userId: string, requestData: Omit<ClientRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
  const requestsRef = collection(db, 'users', userId, 'clientRequests');
  return await addDoc(requestsRef, {
    ...requestData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateRequest = async (userId: string, requestId: string, requestData: Partial<Omit<ClientRequest, 'id'>>) => {
  const requestRef = doc(db, 'users', userId, 'clientRequests', requestId);
  return await updateDoc(requestRef, {
    ...requestData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteRequest = async (userId: string, requestId: string) => {
    const requestRef = doc(db, 'users', userId, 'clientRequests', requestId);
    return await deleteDoc(requestRef);
};
