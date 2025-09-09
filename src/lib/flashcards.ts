
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
  getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import type { Deck, FlashcardToolCard } from './types';


// --- Decks ---
export const addDeck = async (userId: string, deckData: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>) => {
  const decksRef = collection(db, 'users', userId, 'flashcardDecks');
  return await addDoc(decksRef, {
    ...deckData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateDeck = async (userId: string, deckId: string, deckData: Partial<Omit<Deck, 'id'>>) => {
  const deckRef = doc(db, 'users', userId, 'flashcardDecks', deckId);
  return await updateDoc(deckRef, {
    ...deckData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteDeck = async (userId: string, deckId: string) => {
  const batch = writeBatch(db);
  
  const deckRef = doc(db, 'users', userId, 'flashcardDecks', deckId);
  batch.delete(deckRef);

  const cardsQuery = query(collection(db, 'users', userId, 'flashcards'), where('deckId', '==', deckId));
  const cardsSnapshot = await getDocs(cardsQuery);
  cardsSnapshot.forEach((doc) => batch.delete(doc.ref));

  return await batch.commit();
};


// --- Cards ---
export const addCard = async (userId: string, cardData: Omit<FlashcardToolCard, 'id' | 'createdAt' | 'updatedAt'>) => {
  const cardsRef = collection(db, 'users', userId, 'flashcards');
  return await addDoc(cardsRef, {
    ...cardData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateCard = async (userId: string, cardId: string, cardData: Partial<Omit<FlashcardToolCard, 'id'>>) => {
  const cardRef = doc(db, 'users', userId, 'flashcards', cardId);
  return await updateDoc(cardRef, {
    ...cardData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCard = async (userId: string, cardId: string) => {
  const cardRef = doc(db, 'users', userId, 'flashcards', cardId);
  return await deleteDoc(cardRef);
};
