import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, where, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc, getDocFromServer, serverTimestamp, Timestamp } from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Export common Firestore functions
export { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDocFromServer,
  serverTimestamp,
  Timestamp,
  signInWithPopup,
  onAuthStateChanged
};
export type { User };

// Test connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();
