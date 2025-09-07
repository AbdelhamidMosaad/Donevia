
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
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import type { Habit, HabitCompletion } from './types';
import moment from 'moment';

// --- Habits ---

export const addHabit = async (userId: string, habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'archived'>) => {
  const habitsRef = collection(db, 'users', userId, 'habits');
  return await addDoc(habitsRef, {
    ...habitData,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateHabit = async (userId: string, habitId: string, habitData: Partial<Omit<Habit, 'id'>>) => {
  const habitRef = doc(db, 'users', userId, 'habits', habitId);
  return await updateDoc(habitRef, {
    ...habitData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteHabit = async (userId: string, habitId: string) => {
  const batch = writeBatch(db);
  
  const habitRef = doc(db, 'users', userId, 'habits', habitId);
  batch.delete(habitRef);

  const completionsQuery = query(collection(db, 'users', userId, 'habitCompletions'), where('habitId', '==', habitId));
  const completionsSnapshot = await getDocs(completionsQuery);
  completionsSnapshot.forEach((doc) => batch.delete(doc.ref));

  return await batch.commit();
};

export const toggleHabitCompletion = async (userId: string, habitId: string, date: string, isCompleted: boolean) => {
    const completionsRef = collection(db, 'users', userId, 'habitCompletions');
    const q = query(completionsRef, where('habitId', '==', habitId), where('date', '==', date));
    const snapshot = await getDocs(q);

    if (isCompleted) {
        if (snapshot.empty) {
             await addDoc(completionsRef, {
                habitId,
                date,
                completedAt: serverTimestamp(),
            });
        }
    } else {
        if (!snapshot.empty) {
            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
        }
    }
};

// --- Statistics ---

export const calculateStreaks = (completions: HabitCompletion[]) => {
    if (completions.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    const sortedDates = completions
        .map(c => moment(c.date, 'YYYY-MM-DD'))
        .sort((a, b) => a.diff(b));
    
    if (sortedDates.length === 0) {
        return { currentStreak: 0, longestStreak: 0 };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'days').startOf('day');

    // Check if the latest completion is today or yesterday to start the current streak
    const lastCompletionDate = sortedDates[sortedDates.length - 1];
    if (lastCompletionDate.isSame(today) || lastCompletionDate.isSame(yesterday)) {
        currentStreak = 1;
        for (let i = sortedDates.length - 2; i >= 0; i--) {
            const current = sortedDates[i+1];
            const previous = sortedDates[i];
            if (current.diff(previous, 'days') === 1) {
                currentStreak++;
            } else {
                break;
            }
        }
    }

    // Calculate longest streak
    if(sortedDates.length > 0) {
        longestStreak = 1;
        let tempStreak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
            if (sortedDates[i].diff(sortedDates[i-1], 'days') === 1) {
                tempStreak++;
            } else if (sortedDates[i].diff(sortedDates[i-1], 'days') > 1) {
                tempStreak = 1; // Reset if gap is more than one day
            }
            if(tempStreak > longestStreak) {
                longestStreak = tempStreak;
            }
        }
    }


    return { currentStreak, longestStreak };
};
