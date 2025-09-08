
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
    
    const requestsQuery = query(collection(db, 'users', userId, 'clientRequests'), where('clientId', '==', clientId));
    const requestsSnapshot = await getDocs(requestsQuery);
    requestsSnapshot.forEach(doc => batch.delete(doc.ref));

    // Note: In a full implementation, you would also delete associated
    // files from storage here.
    // For now, we just delete the client and their requests.

    return await batch.commit();
};
