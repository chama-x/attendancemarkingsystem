// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBxbW5AWyGB6LNosonlTA0VMuArtv13VIo",
  authDomain: "attendance-a35f4.firebaseapp.com",
  projectId: "attendance-a35f4",
  storageBucket: "attendance-a35f4.firebasestorage.app",
  messagingSenderId: "348193851485",
  appId: "1:348193851485:web:e23d155efc7a15cbba65b4",
  measurementId: "G-J2D4FEF4C3",
  databaseURL: "https://attendance-a35f4-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Export the app instance for use in other components
export const firebaseApp = app; 