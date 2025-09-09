
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import type { BrainstormingIdea } from './types';

// Create
export const addIdea = async (userId: string, content: string, color: string) => {
  const ideasRef = collection(db, 'users', userId, 'brainstormingIdeas');
  const snapshot = await getDocs(ideasRef);
  const currentMaxOrder = snapshot.docs.reduce((max, doc) => Math.max(doc.data().order || 0, max), 0);

  return await addDoc(ideasRef, {
    content,
    color,
    ownerId: userId,
    priority: 'Medium',
    tags: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    order: currentMaxOrder + 1,
  });
};

// Update
export const updateIdea = async (userId: string, ideaId: string, data: Partial<Omit<BrainstormingIdea, 'id'>>) => {
  const ideaRef = doc(db, 'users', userId, 'brainstormingIdeas', ideaId);
  return await updateDoc(ideaRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Delete
export const deleteIdea = async (userId: string, ideaId: string) => {
  const ideaRef = doc(db, 'users', userId, 'brainstormingIdeas', ideaId);
  return await deleteDoc(ideaRef);
};

// Batch update order
export const updateIdeaOrder = async (userId: string, orderedIdeas: Pick<BrainstormingIdea, 'id' | 'order'>[]) => {
  const batch = writeBatch(db);
  orderedIdeas.forEach(idea => {
    const ideaRef = doc(db, 'users', userId, 'brainstormingIdeas', idea.id);
    batch.update(ideaRef, { order: idea.order });
  });
  return await batch.commit();
};
