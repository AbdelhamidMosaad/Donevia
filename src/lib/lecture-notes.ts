
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { LectureNote } from './types';

// This file contains Firestore helper functions for Lecture Notes.

export const addLectureNote = async (userId: string, noteData: Omit<LectureNote, 'id' | 'createdAt' | 'updatedAt'>) => {
  const notesRef = collection(db, 'users', userId, 'lectureNotes');
  return await addDoc(notesRef, {
    ...noteData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateLectureNote = async (userId: string, noteId: string, noteData: Partial<Omit<LectureNote, 'id'>>) => {
  const noteRef = doc(db, 'users', userId, 'lectureNotes', noteId);
  return await updateDoc(noteRef, {
    ...noteData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteLectureNote = async (userId: string, noteId: string) => {
  const noteRef = doc(db, 'users', userId, 'lectureNotes', noteId);
  return await deleteDoc(noteRef);
};
