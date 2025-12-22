
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAmI4KU7j8P2JnFEXFVeLuoN7ZtTDdI48o",
  authDomain: "usersss-369bb.firebaseapp.com",
  projectId: "usersss-369bb",
  storageBucket: "usersss-369bb.firebasestorage.app",
  messagingSenderId: "41396967802",
  appId: "1:41396967802:web:a839b0feb956f163cb1ec3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
