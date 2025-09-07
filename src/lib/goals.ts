
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
import type { Goal, Milestone, ProgressUpdate } from './types';

// --- Goals ---
export const addGoal = async (userId: string, goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
  const goalsRef = collection(db, 'users', userId, 'goals');
  return await addDoc(goalsRef, {
    ...goalData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateGoal = async (userId: string, goalId: string, goalData: Partial<Omit<Goal, 'id'>>) => {
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  return await updateDoc(goalRef, {
    ...goalData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteGoal = async (userId: string, goalId: string) => {
  const batch = writeBatch(db);
  
  // 1. Delete the goal itself
  const goalRef = doc(db, 'users', userId, 'goals', goalId);
  batch.delete(goalRef);

  // 2. Delete associated milestones
  const milestonesQuery = query(collection(db, 'users', userId, 'milestones'), where('goalId', '==', goalId));
  const milestonesSnapshot = await getDocs(milestonesQuery);
  milestonesSnapshot.forEach((doc) => batch.delete(doc.ref));

  // 3. Delete associated progress updates
  const progressUpdatesQuery = query(collection(db, 'users', userId, 'progressUpdates'), where('goalId', '==', goalId));
  const progressUpdatesSnapshot = await getDocs(progressUpdatesQuery);
  progressUpdatesSnapshot.forEach((doc) => batch.delete(doc.ref));

  return await batch.commit();
};


// --- Milestones ---
export const addMilestone = async (userId: string, milestoneData: Omit<Milestone, 'id' | 'createdAt' | 'updatedAt'>) => {
  const milestonesRef = collection(db, 'users', userId, 'milestones');
  return await addDoc(milestonesRef, {
    ...milestoneData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateMilestone = async (userId: string, milestoneId: string, milestoneData: Partial<Omit<Milestone, 'id'>>) => {
  const milestoneRef = doc(db, 'users', userId, 'milestones', milestoneId);
  return await updateDoc(milestoneRef, {
    ...milestoneData,
    updatedAt: serverTimestamp(),
  });
};

export const toggleMilestoneCompletion = async (userId: string, milestoneId: string, isCompleted: boolean) => {
    const milestoneRef = doc(db, 'users', userId, 'milestones', milestoneId);
    return await updateDoc(milestoneRef, { isCompleted, updatedAt: serverTimestamp() });
}

export const deleteMilestone = async (userId: string, milestoneId: string) => {
  const milestoneRef = doc(db, 'users', userId, 'milestones', milestoneId);
  return await deleteDoc(milestoneRef);
};


// --- Progress Updates ---
export const addProgressUpdate = async (userId: string, progressData: Omit<ProgressUpdate, 'id' | 'createdAt'>) => {
  const progressUpdatesRef = collection(db, 'users', userId, 'progressUpdates');
  return await addDoc(progressUpdatesRef, {
    ...progressData,
    createdAt: serverTimestamp(),
  });
};
