
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { MeetingNote } from './types';

export const addMeetingNote = async (userId: string, noteData: Omit<MeetingNote, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => {
  const notesRef = collection(db, 'users', userId, 'meetingNotes');
  return await addDoc(notesRef, {
    ...noteData,
    ownerId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateMeetingNote = async (userId: string, noteId: string, noteData: Partial<Omit<MeetingNote, 'id' | 'ownerId'>>) => {
  const noteRef = doc(db, 'users', userId, 'meetingNotes', noteId);
  return await updateDoc(noteRef, {
    ...noteData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteMeetingNote = async (userId: string, noteId: string) => {
  const noteRef = doc(db, 'users', userId, 'meetingNotes', noteId);
  return await deleteDoc(noteRef);
};
