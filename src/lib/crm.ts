
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
import type { Client, Quotation, Invoice } from './types';

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


// --- Invoice & Quotation Management (as part of client doc) ---

export const addQuotationToClient = async (userId: string, clientId: string, quotation: Quotation) => {
    // This is a simplified example. In a real-world scenario, you might have
    // a more complex way of updating nested arrays in Firestore to avoid race conditions.
    // For this app, we'll read the client, update the array, and write it back.
    const clientRef = doc(db, 'users', userId, 'clients', clientId);
    const clientSnap = await getDocs(query(collection(db, 'users', userId, 'clients'), where('id', '==', clientId)));

    if(!clientSnap.empty) {
        const clientDoc = clientSnap.docs[0];
        const clientData = clientDoc.data() as Client;
        const updatedQuotations = [...(clientData.quotations || []), quotation];
        await updateDoc(clientRef, { quotations: updatedQuotations });
    }
}

export const addInvoiceToClient = async (userId: string, clientId: string, invoice: Invoice) => {
    const clientRef = doc(db, 'users', userId, 'clients', clientId);
    const clientSnap = await getDocs(query(collection(db, 'users', userId, 'clients'), where('id', '==', clientId)));
     if(!clientSnap.empty) {
        const clientDoc = clientSnap.docs[0];
        const clientData = clientDoc.data() as Client;
        const updatedInvoices = [...(clientData.invoices || []), invoice];
        await updateDoc(clientRef, { invoices: updatedInvoices });
    }
}
