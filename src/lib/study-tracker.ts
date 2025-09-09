
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
import type { StudyGoal, StudyChapter, StudySubtopic } from './types';

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

  const chaptersQuery = query(collection(db, 'users', userId, 'studyChapters'), where('goalId', '==', goalId));
  const chaptersSnapshot = await getDocs(chaptersQuery);
  chaptersSnapshot.forEach((doc) => batch.delete(doc.ref));
  
  const subtopicsQuery = query(collection(db, 'users', userId, 'studySubtopics'), where('goalId', '==', goalId));
  const subtopicsSnapshot = await getDocs(subtopicsQuery);
  subtopicsSnapshot.forEach((doc) => batch.delete(doc.ref));

  return await batch.commit();
};


// --- Chapters ---
export const addStudyChapter = async (userId: string, chapterData: Omit<StudyChapter, 'id' | 'createdAt'>) => {
  const chaptersRef = collection(db, 'users', userId, 'studyChapters');
  return await addDoc(chaptersRef, {
    ...chapterData,
    createdAt: serverTimestamp(),
  });
};

export const updateStudyChapter = async (userId: string, chapterId: string, chapterData: Partial<Omit<StudyChapter, 'id'>>) => {
  const chapterRef = doc(db, 'users', userId, 'studyChapters', chapterId);
  return await updateDoc(chapterRef, chapterData);
};

export const deleteStudyChapter = async (userId: string, chapterId: string) => {
  const batch = writeBatch(db);
  const chapterRef = doc(db, 'users', userId, 'studyChapters', chapterId);
  batch.delete(chapterRef);

  const subtopicsQuery = query(collection(db, 'users', userId, 'studySubtopics'), where('chapterId', '==', chapterId));
  const subtopicsSnapshot = await getDocs(subtopicsQuery);
  subtopicsSnapshot.forEach((doc) => batch.delete(doc.ref));
  
  return await batch.commit();
}


// --- Subtopics ---
export const addStudySubtopic = async (userId: string, subtopicData: Omit<StudySubtopic, 'id' | 'createdAt'>) => {
  const subtopicsRef = collection(db, 'users', userId, 'studySubtopics');
  return await addDoc(subtopicsRef, {
    ...subtopicData,
    createdAt: serverTimestamp(),
  });
};

export const updateStudySubtopic = async (userId: string, subtopicId: string, subtopicData: Partial<Omit<StudySubtopic, 'id'>>) => {
  const subtopicRef = doc(db, 'users', userId, 'studySubtopics', subtopicId);
  return await updateDoc(subtopicRef, subtopicData);
};

export const toggleStudySubtopicCompletion = async (userId: string, subtopicId: string, isCompleted: boolean) => {
    const subtopicRef = doc(db, 'users', userId, 'studySubtopics', subtopicId);
    return await updateDoc(subtopicRef, { isCompleted });
}

export const deleteStudySubtopic = async (userId: string, subtopicId: string) => {
  const subtopicRef = doc(db, 'users', userId, 'studySubtopics', subtopicId);
  return await deleteDoc(subtopicRef);
};
