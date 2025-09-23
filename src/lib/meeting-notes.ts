
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
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

export const duplicateMeetingNote = async (userId: string, noteId: string) => {
  const originalNoteRef = doc(db, 'users', userId, 'meetingNotes', noteId);
  const originalNoteSnap = await getDoc(originalNoteRef);

  if (!originalNoteSnap.exists()) {
    throw new Error("Original note not found.");
  }

  const originalData = originalNoteSnap.data() as MeetingNote;
  const { id, createdAt, updatedAt, ownerId, ...rest } = originalData;
  
  const newNoteData = {
    ...rest,
    title: `Copy of ${originalData.title}`,
  };

  return addMeetingNote(userId, newNoteData);
}

