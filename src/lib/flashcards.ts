
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
} from 'firebase/firestore';
import { db } from './firebase';
import type { Deck, Flashcard, FlashcardToolCard } from './types';


// --- Decks ---
export const addDeck = async (userId: string, deckData: Omit<Deck, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'isPublic' | 'editors' | 'viewers'>) => {
  const decksRef = collection(db, 'users', userId, 'flashcardDecks');
  return await addDoc(decksRef, {
    ...deckData,
    ownerId: userId,
    isPublic: false,
    editors: [],
    viewers: [],
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

  const cardsQuery = query(collection(db, 'users', userId, 'flashcardDecks', deckId, 'cards'));
  const cardsSnapshot = await getDocs(cardsQuery);
  cardsSnapshot.forEach((doc) => batch.delete(doc.ref));
  
  const progressQuery = query(collection(db, 'users', userId, 'flashcardDecks', deckId, 'progress'));
  const progressSnapshot = await getDocs(progressQuery);
  progressSnapshot.forEach((doc) => batch.delete(doc.ref));

  return await batch.commit();
};


// --- Cards ---
export const addCard = async (userId: string, deckId: string, cardData: Omit<FlashcardToolCard, 'id' | 'createdAt' | 'updatedAt' | 'deckId'>) => {
  const cardsRef = collection(db, 'users', userId, 'flashcardDecks', deckId, 'cards');
  return await addDoc(cardsRef, {
    ...cardData,
    deckId,
    correct: 0,
    wrong: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const addCardsToDeck = async (userId: string, deckId: string, cards: Omit<Flashcard, 'id'>[]) => {
    const batch = writeBatch(db);
    const cardsRef = collection(db, 'users', userId, 'flashcardDecks', deckId, 'cards');
    cards.forEach(cardData => {
        const newCardRef = doc(cardsRef);
        batch.set(newCardRef, {
            ...cardData,
            deckId,
            correct: 0,
            wrong: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
    });
    await batch.commit();
}


export const updateCard = async (userId: string, deckId: string, cardId: string, cardData: Partial<Omit<FlashcardToolCard, 'id'>>) => {
  const cardRef = doc(db, 'users', userId, 'flashcardDecks', deckId, 'cards', cardId);
  return await updateDoc(cardRef, {
    ...cardData,
    updatedAt: serverTimestamp(),
  });
};

export const deleteCard = async (userId: string, deckId: string, cardId: string) => {
    const batch = writeBatch(db);
    const cardRef = doc(db, 'users', userId, 'flashcardDecks', deckId, 'cards', cardId);
    batch.delete(cardRef);
    
    // Also delete the progress document if it exists
    const progressRef = doc(db, 'users', userId, 'flashcardDecks', deckId, 'progress', cardId);
    batch.delete(progressRef);

    return await batch.commit();
};

// --- Folders ---
export const addFlashcardFolder = async (userId: string, folderName: string) => {
  const foldersRef = collection(db, 'users', userId, 'flashcardFolders');
  return await addDoc(foldersRef, {
    name: folderName,
    ownerId: userId,
    createdAt: serverTimestamp(),
  });
};

export const updateFlashcardFolder = async (userId: string, folderId: string, folderData: { name: string }) => {
  const folderRef = doc(db, 'users', userId, 'flashcardFolders', folderId);
  return await updateDoc(folderRef, folderData);
};

export const deleteFlashcardFolder = async (userId: string, folderId: string) => {
  // This currently only deletes the folder itself. Decks inside are not deleted.
  const folderRef = doc(db, 'users', userId, 'flashcardFolders', folderId);
  return await deleteDoc(folderRef);
};


// --- Sharing & Public Decks ---
export const publishDeck = async (deck: Deck) => {
    const publicDeckRef = doc(db, 'publicDecks', deck.id);
    const { ownerId, name, description, createdAt } = deck;
    await setDoc(publicDeckRef, {
        ownerId,
        name,
        description,
        sourceDeckId: deck.id,
        sourceUserId: deck.ownerId,
        createdAt,
        updatedAt: serverTimestamp(),
    });

    const userDeckRef = doc(db, 'users', deck.ownerId, 'flashcardDecks', deck.id);
    await updateDoc(userDeckRef, { isPublic: true });
}

export const unpublishDeck = async (deck: Deck) => {
    const publicDeckRef = doc(db, 'publicDecks', deck.id);
    await deleteDoc(publicDeckRef);

    const userDeckRef = doc(db, 'users', deck.ownerId, 'flashcardDecks', deck.id);
    await updateDoc(userDeckRef, { isPublic: false });
}

export const importPublicDeck = async (userId: string, publicDeckId: string) => {
    const publicDeckRef = doc(db, 'publicDecks', publicDeckId);
    const publicDeckSnap = await getDoc(publicDeckRef);

    if (!publicDeckSnap.exists()) {
        throw new Error("Public deck not found");
    }
    const publicDeckData = publicDeckSnap.data();

    const newUserDeckRef = await addDeck(userId, {
        name: publicDeckData.name,
        description: publicDeckData.description,
    });
    
    const sourceCardsQuery = query(collection(db, 'users', publicDeckData.sourceUserId, 'flashcardDecks', publicDeckData.sourceDeckId, 'cards'));
    const cardsSnapshot = await getDocs(sourceCardsQuery);
    
    const batch = writeBatch(db);
    cardsSnapshot.forEach(cardDoc => {
        const newCardRef = doc(collection(db, 'users', userId, 'flashcardDecks', newUserDeckRef.id, 'cards'));
        batch.set(newCardRef, cardDoc.data());
    });

    await batch.commit();
    return newUserDeckRef.id;
}
