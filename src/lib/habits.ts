
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
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import type { Habit } from './types';

// --- Habits ---
export const addHabit = async (userId: string, habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) => {
  const habitsRef = collection(db, 'users', userId, 'habits');
  return await addDoc(habitsRef, {
    ...habitData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateHabit = async (userId: string, habitId: string, habitData: Partial<Omit<Habit, 'id'>>) => {
  const habitRef = doc(db, 'users', userId, 'habits', habitId);
  return await updateDoc(habitRef, {
    ...habitData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteHabit = async (userId: string, habitId: string) => {
  const batch = writeBatch(db);
  
  // 1. Delete the habit itself
  const habitRef = doc(db, 'users', userId, 'habits', habitId);
  batch.delete(habitRef);

  // 2. Delete associated completions
  const completionsQuery = query(collection(db, 'users', userId, 'habitCompletions'), where('habitId', '==', habitId));
  const completionsSnapshot = await getDocs(completionsQuery);
  completionsSnapshot.forEach((doc) => batch.delete(doc.ref));

  return await batch.commit();
};

// --- Habit Completions ---
export const toggleHabitCompletion = async (userId: string, habitId: string, date: string, shouldComplete: boolean) => {
    const completionsRef = collection(db, 'users', userId, 'habitCompletions');
    
    if (shouldComplete) {
        // Add a new completion document
        return await addDoc(completionsRef, {
            habitId,
            date, // Storing date as 'YYYY-MM-DD' string
            createdAt: serverTimestamp(),
        });
    } else {
        // Find and delete the existing completion document
        const q = query(
            completionsRef,
            where('habitId', '==', habitId),
            where('date', '==', date),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const docToDelete = snapshot.docs[0];
            return await deleteDoc(docToDelete.ref);
        }
    }
};
