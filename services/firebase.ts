import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ⚙️ Đây là cấu hình của bạn (giữ nguyên hoặc thay nếu khác)
const firebaseConfig = {
  apiKey: "AIzaSyDAJrE5MU7pYeUhoJBUBzBuj0-ENfnSxA",
  authDomain: "cocsaigon-training.firebaseapp.com",
  projectId: "cocsaigon-training",
  storageBucket: "cocsaigon-training.appspot.com",
  messagingSenderId: "481643110648",
  appId: "1:481643110648:web:923b9d22c102eda441b0d",
  measurementId: "G-F22B5VL16B"
};

// 🔥 Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// ✨ Kích hoạt các dịch vụ bạn cần
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
