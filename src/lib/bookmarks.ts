import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Bookmark } from './types';

export const addBookmark = async (userId: string, bookmarkData: Omit<Bookmark, 'id' | 'createdAt'>) => {
  const bookmarksRef = collection(db, 'users', userId, 'bookmarks');
  return await addDoc(bookmarksRef, {
    ...bookmarkData,
    createdAt: serverTimestamp(),
  });
};

export const updateBookmark = async (userId: string, bookmarkId: string, bookmarkData: Partial<Omit<Bookmark, 'id' | 'createdAt'>>) => {
  const bookmarkRef = doc(db, 'users', userId, 'bookmarks', bookmarkId);
  return await updateDoc(bookmarkRef, {
    ...bookmarkData,
  });
};

export const deleteBookmark = async (userId: string, bookmarkId: string) => {
  const bookmarkRef = doc(db, 'users', userId, 'bookmarks', bookmarkId);
  return await deleteDoc(bookmarkRef);
};
