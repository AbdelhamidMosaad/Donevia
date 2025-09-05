
import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Task } from './types';

export const addTask = async (userId: string, taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    return await addDoc(tasksRef, {
        ...taskData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
};

export const updateTask = async (userId: string, taskId: string, taskData: Partial<Omit<Task, 'id'>>) => {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    return await updateDoc(taskRef, {
        ...taskData,
        updatedAt: serverTimestamp()
    });
};

export const deleteTask = async (userId: string, taskId: string) => {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    return await deleteDoc(taskRef);
};
