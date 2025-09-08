
import {
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export const deleteMindMap = async (userId: string, mapId: string) => {
  const mapRef = doc(db, 'users', userId, 'mindMaps', mapId);
  return await deleteDoc(mapRef);
};
