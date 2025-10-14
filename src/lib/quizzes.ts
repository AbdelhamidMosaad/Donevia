
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { StudyMaterialResponse } from './types';

export const saveQuiz = async (userId: string, quizData: StudyMaterialResponse) => {
  const savedQuizzesRef = collection(db, 'users', userId, 'savedQuizzes');
  return await addDoc(savedQuizzesRef, {
    ...quizData,
    ownerId: userId,
    createdAt: serverTimestamp(),
  });
};

export const deleteSavedQuiz = async (userId: string, quizId: string) => {
  const quizRef = doc(db, 'users', userId, 'savedQuizzes', quizId);
  return await deleteDoc(quizRef);
};
