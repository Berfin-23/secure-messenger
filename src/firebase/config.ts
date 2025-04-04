import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAB1VsQIzfecmkRhwMwLfpbbUPkajHm0SQ",
  authDomain: "d-messaging-app-a33dd.firebaseapp.com",
  projectId: "d-messaging-app-a33dd",
  storageBucket: "d-messaging-app-a33dd.firebasestorage.app",
  messagingSenderId: "473053543240",
  appId: "1:473053543240:web:fe18718bee9d888845917d",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
