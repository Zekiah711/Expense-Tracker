import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAvMQ_PC-gJBDDwjVTEY0Dimp_Jl-1KlbM",
  authDomain: "expense-tracker-mvp-87783.firebaseapp.com",
  databaseURL: "https://expense-tracker-mvp-87783-default-rtdb.firebaseio.com",
  projectId: "expense-tracker-mvp-87783",
  storageBucket: "expense-tracker-mvp-87783.firebasestorage.app",
  messagingSenderId: "414131843354",
  appId: "1:414131843354:web:3de94de861b1e15da93ca3"
};

const app = initializeApp(firebaseConfig);

const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, provider };
