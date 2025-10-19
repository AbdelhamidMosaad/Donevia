
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
} from 'firebase/firestore';
import { db } from './firebase';
import type { Task, TaskFolder } from './types';

// This function is now only used for seeding/testing if needed.
// The primary addTask logic is in the useTasks hook for optimistic updates.
export const addTaskToDb = async (userId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    return await addDoc(tasksRef, {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
};

export const updateTaskInDb = async (userId: string, taskId: string, taskData: Partial<Omit<Task, 'id'>>) => {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    return await updateDoc(taskRef, {
        ...taskData,
        updatedAt: serverTimestamp()
    });
};

export const deleteTaskFromDb = async (userId: string, taskId: string) => {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    // Using a hard delete for simplicity in optimistic UI.
    // Soft delete can be re-introduced if a trash/archive feature is needed.
    return await deleteDoc(taskRef);
};

export const deleteTaskFolder = async (userId: string, folderId: string) => {
    const batch = writeBatch(db);
    const folderRef = doc(db, 'users', userId, 'taskFolders', folderId);
    batch.delete(folderRef);

    // Find lists in this folder and move them to root
    const listsQuery = query(collection(db, 'users', userId, 'taskLists'), where('folderId', '==', folderId));
    const listsSnapshot = await getDocs(listsQuery);
    listsSnapshot.forEach((doc) => {
        batch.update(doc.ref, { folderId: null });
    });

    return await batch.commit();
}
