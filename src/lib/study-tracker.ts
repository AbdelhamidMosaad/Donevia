

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
  getDoc,
  setDoc,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import type { StudyGoal, StudyChapter, StudyTopic, StudyProfile } from './types';
import moment from 'moment';
import { checkAndAwardBadges } from './gamification';

// --- Goals ---
export const addStudyGoal = async (userId: string, goalData: Omit<StudyGoal, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => {
  const goalsRef = collection(db, 'users', userId, 'studyGoals');
  return await addDoc(goalsRef, {
    ...goalData,
    ownerId: userId,
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
  
  const topicsQuery = query(collection(db, 'users', userId, 'studyTopics'), where('goalId', '==', goalId));
  const topicsSnapshot = await getDocs(topicsQuery);
  topicsSnapshot.forEach((doc) => batch.delete(doc.ref));

  return await batch.commit();
};


// --- Folders ---
export const addStudyFolder = async (userId: string, folderName: string, parentId: string | null = null) => {
  const foldersRef = collection(db, 'users', userId, 'studyFolders');
  return await addDoc(foldersRef, {
    name: folderName,
    ownerId: userId,
    parentId: parentId,
    createdAt: serverTimestamp(),
  });
};

export const updateStudyFolder = async (userId: string, folderId: string, folderData: { name: string }) => {
  const folderRef = doc(db, 'users', userId, 'studyFolders', folderId);
  return await updateDoc(folderRef, folderData);
};

export const moveStudyFolder = async (userId: string, folderId: string, newParentId: string | null) => {
    const folderRef = doc(db, 'users', userId, 'studyFolders', folderId);
    return await updateDoc(folderRef, { parentId: newParentId });
}

export const deleteStudyFolder = async (userId: string, folderId: string) => {
  const folderRef = doc(db, 'users', userId, 'studyFolders', folderId);
  return await deleteDoc(folderRef);
};


// --- Chapters ---
export const addStudyChapter = async (userId: string, chapterData: Omit<StudyChapter, 'id' | 'createdAt' | 'ownerId'>) => {
  const chaptersRef = collection(db, 'users', userId, 'studyChapters');
  return await addDoc(chaptersRef, {
    ...chapterData,
    ownerId: userId,
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

  const topicsQuery = query(collection(db, 'users', userId, 'studyTopics'), where('chapterId', '==', chapterId));
  const topicsSnapshot = await getDocs(topicsQuery);
  topicsSnapshot.forEach((doc) => batch.delete(doc.ref));
  
  return await batch.commit();
}


// --- Topics ---
export const addStudyTopic = async (userId: string, topicData: Omit<StudyTopic, 'id' | 'createdAt' | 'ownerId'>) => {
  const topicsRef = collection(db, 'users', userId, 'studyTopics');
  return await addDoc(topicsRef, {
    ...topicData,
    ownerId: userId,
    createdAt: serverTimestamp(),
  });
};

export const updateStudyTopic = async (userId: string, topicId: string, topicData: Partial<Omit<StudyTopic, 'id'>>) => {
  const topicRef = doc(db, 'users', userId, 'studyTopics', topicId);
  return await updateDoc(topicRef, topicData);
};

export const toggleStudyTopicCompletion = async (userId: string, topicId: string, isCompleted: boolean) => {
    const topicRef = doc(db, 'users', userId, 'studyTopics', topicId);
    await updateDoc(topicRef, { isCompleted });
    if(isCompleted) {
        await logStudyActivity(userId);
        await checkAndAwardBadges(userId, 'topic');
    }
}

export const deleteStudyTopic = async (userId: string, topicId: string) => {
  const topicRef = doc(db, 'users', userId, 'studyTopics', topicId);
  return await deleteDoc(topicRef);
};


// --- Time Tracking ---
export const logStudySession = async (userId: string, topicId: string, durationSeconds: number) => {
    if (durationSeconds <= 0) return;

    const batch = writeBatch(db);
    
    // Log the individual session
    const sessionRef = doc(collection(db, 'users', userId, 'studySessions'));
    batch.set(sessionRef, {
        topicId,
        ownerId: userId,
        durationSeconds,
        date: serverTimestamp(),
    });

    // Increment the total time on the topic
    const topicRef = doc(db, 'users', userId, 'studyTopics', topicId);
    batch.update(topicRef, {
        timeSpentSeconds: increment(durationSeconds)
    });
    
    await batch.commit();
}


// --- Advanced Operations ---

export const logStudyActivity = async (userId: string) => {
    const settingsRef = doc(db, 'users', userId, 'profile', 'settings');
    const today = moment().format('YYYY-MM-DD');
    
    const settingsSnap = await getDoc(settingsRef);
    const currentProfile: StudyProfile = settingsSnap.data()?.studyProfile || {
        currentStreak: 0,
        longestStreak: 0,
        lastStudyDay: '',
        level: 1,
        experiencePoints: 0,
        earnedBadges: [],
    };
    
    if (currentProfile.lastStudyDay === today) {
        return; // Already logged for today
    }
    
    const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
    const newStreak = currentProfile.lastStudyDay === yesterday ? currentProfile.currentStreak + 1 : 1;
    
    const newProfile: StudyProfile = {
        ...currentProfile,
        currentStreak: newStreak,
        longestStreak: Math.max(currentProfile.longestStreak, newStreak),
        lastStudyDay: today,
    };
    
    await setDoc(settingsRef, { studyProfile: newProfile }, { merge: true });
};

export const addSampleStudyGoal = async (userId: string) => {
    const batch = writeBatch(db);
    const goalRef = doc(collection(db, 'users', userId, 'studyGoals'));
    batch.set(goalRef, {
        title: 'Learn React',
        description: 'Master the fundamentals of React for web development.',
        ownerId: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    const chapters = [
        { title: '1. Introduction to React', order: 0, topics: ['What is React?', 'Setting up a React project', 'Understanding JSX'] },
        { title: '2. Components & Props', order: 1, topics: ['Functional Components', 'Class Components', 'Passing Props'] },
        { title: '3. State & Lifecycle', order: 2, topics: ['useState Hook', 'useEffect Hook', 'Lifecycle Methods'] },
    ];

    for (const chapterData of chapters) {
        const chapterRef = doc(collection(db, 'users', userId, 'studyChapters'));
        batch.set(chapterRef, {
            goalId: goalRef.id,
            title: chapterData.title,
            order: chapterData.order,
            ownerId: userId,
            createdAt: serverTimestamp(),
        });

        for (const [i, topicTitle] of chapterData.topics.entries()) {
            const topicRef = doc(collection(db, 'users', userId, 'studyTopics'));
            batch.set(topicRef, {
                goalId: goalRef.id,
                chapterId: chapterRef.id,
                title: topicTitle,
                isCompleted: false,
                order: i,
                ownerId: userId,
                timeSpentSeconds: 0,
                createdAt: serverTimestamp(),
            });
        }
    }
    await batch.commit();
}


export const cleanupFinishedTopics = async (userId: string): Promise<number> => {
    const q = query(collection(db, 'users', userId, 'studyTopics'), where('isCompleted', '==', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return 0;
    }
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    return snapshot.size;
}
