import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBCS1jpn4yj6CvZS3gDspn0QYrwk5WRPiA",
  authDomain: "finsync-5aaf7.firebaseapp.com",
  projectId: "finsync-5aaf7",
  storageBucket: "finsync-5aaf7.firebasestorage.app",
  messagingSenderId: "944983416574",
  appId: "1:944983416574:web:04b62ea813feceff75cfaf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Enable select account prompt
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { signInWithPopup };
