
// Import the functions you need from the SDKs you need
import {initializeApp, getApps, getApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';
import {getFirestore, initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


// Enable persistence
try {
    enableIndexedDbPersistence(db)
    console.log("Firebase Offline Caching Enabled");
} catch (error: any) {
    if (error.code == 'failed-precondition') {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
    } else if (error.code == 'unimplemented') {
        console.warn("The current browser does not support all of the features required to enable persistence.");
    }
}


export {app, auth, db, storage};

