
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
import type { StudyGoal, StudyMilestone } from './types';

// --- Goals ---
export const addStudyGoal = async (userId: string, goalData: Omit<StudyGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
  const goalsRef = collection(db, 'users', userId, 'studyGoals');
  return await addDoc(goalsRef, {
    ...goalData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateStudyGoal = async (userId: string, goalId: string, goalData: Partial<Omit<StudyGoal, 'id'>>) => {
  const goalRef = doc(db, 'users', userId, 'studyGoals', goalId);
  return await updateDoc(goalRef, {
    ...goalData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteStudyGoal = async (userId: string, goalId: string) => {
  const batch = writeBatch(db);
  
  const goalRef = doc(db, 'users', userId, 'studyGoals', goalId);
  batch.delete(goalRef);

  const milestonesQuery = query(collection(db, 'users', userId, 'studyMilestones'), where('goalId', '==', goalId));
  const milestonesSnapshot = await getDocs(milestonesQuery);
  milestonesSnapshot.forEach((doc) => batch.delete(doc.ref));

  return await batch.commit();
};


// --- Milestones ---
export const addStudyMilestone = async (userId: string, milestoneData: Omit<StudyMilestone, 'id' | 'createdAt'>) => {
  const milestonesRef = collection(db, 'users', userId, 'studyMilestones');
  return await addDoc(milestonesRef, {
    ...milestoneData,
    createdAt: serverTimestamp(),
  });
};

export const updateStudyMilestone = async (userId: string, milestoneId: string, milestoneData: Partial<Omit<StudyMilestone, 'id'>>) => {
  const milestoneRef = doc(db, 'users', userId, 'studyMilestones', milestoneId);
  return await updateDoc(milestoneRef, milestoneData);
};

export const toggleStudyMilestoneCompletion = async (userId: string, milestoneId: string, isCompleted: boolean) => {
    const milestoneRef = doc(db, 'users', userId, 'studyMilestones', milestoneId);
    return await updateDoc(milestoneRef, { isCompleted });
}

export const deleteStudyMilestone = async (userId: string, milestoneId: string) => {
  const milestoneRef = doc(db, 'users', userId, 'studyMilestones', milestoneId);
  return await deleteDoc(milestoneRef);
};
