
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
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import type { Client } from './types';

// --- Client Management ---
export const addClient = async (userId: string, clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'customFields' | 'quotations' | 'invoices'>) => {
  const clientsRef = collection(db, 'users', userId, 'clients');
  return await addDoc(clientsRef, {
    ...clientData,
    customFields: [],
    quotations: [],
    invoices: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateClient = async (userId: string, clientId: string, clientData: Partial<Omit<Client, 'id'>>) => {
  const clientRef = doc(db, 'users', userId, 'clients', clientId);
  return await updateDoc(clientRef, {
    ...clientData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteClient = async (userId: string, clientId: string) => {
    const batch = writeBatch(db);

    const clientRef = doc(db, 'users', userId, 'clients', clientId);
    batch.delete(clientRef);

    // Note: In a full implementation, you would also delete associated
    // quotations, invoices, and files from storage here.
    // For now, we just delete the client document.

    return await batch.commit();
};
