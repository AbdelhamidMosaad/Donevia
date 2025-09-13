
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserVocabularyWord, HighlightedWord, VocabularyLevel, MasteryLevel } from './types/vocabulary';

export const addUserVocabularyWords = async (
  userId: string,
  words: HighlightedWord[],
  sourceLevel: VocabularyLevel
) => {
  const batch = writeBatch(db);
  const vocabRef = collection(db, 'users', userId, 'vocabulary');

  words.forEach((wordData) => {
    const newWordRef = doc(vocabRef);
    const newWord: Omit<UserVocabularyWord, 'id'> = {
      ...wordData,
      ownerId: userId,
      sourceLevel,
      masteryLevel: 'Novice', // Default mastery level
      createdAt: serverTimestamp() as any, // Let the server set the timestamp
    };
    batch.set(newWordRef, newWord);
  });

  return await batch.commit();
};

export const updateUserVocabularyWordLevel = async (
  userId: string,
  wordId: string,
  masteryLevel: MasteryLevel,
) => {
  const wordRef = doc(db, 'users', userId, 'vocabulary', wordId);
  return await updateDoc(wordRef, { masteryLevel });
}

export const deleteUserVocabularyWord = async (
  userId: string,
  wordId: string
) => {
  const wordRef = doc(db, 'users', userId, 'vocabulary', wordId);
  return await deleteDoc(wordRef);
};
