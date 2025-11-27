// src/services/firebaseService.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase configuration từ môi trường VITE
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Debugging: in ra cấu hình để chắc chắn rằng env đang được "tới"
console.log('[FirebaseConfig]', {
  apiKey: !!firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  measurementId: firebaseConfig.measurementId,
});

// Khởi tạo Firebase app với cấu hình
const app = initializeApp(firebaseConfig);

// Lấy các dịch vụ cần thiết
export const db = getFirestore(app);  // Firestore instance
export const auth = getAuth(app);      // Firebase Auth instance
export const provider = new GoogleAuthProvider();  // Google sign-in provider

// Xuất các dịch vụ này để sử dụng ở các nơi khác trong ứng dụng
