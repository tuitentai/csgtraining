// src/services/dataService.ts
import { 
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc 
} from "firebase/firestore";
import { db } from "./firebaseService";

import { BoardMember, TrainingSession, AppConfig } from "../types";

// =========================
// 📌 COLLECTION NAMES
// =========================
const COL_MEMBERS = "boardMembers";
const COL_SESSIONS = "sessions";
const COL_CONFIG = "config";

// =========================
// 📌 BOARD MEMBERS
// =========================

// GET all members
export const getBoardMembers = async (): Promise<BoardMember[]> => {
  const snap = await getDocs(collection(db, COL_MEMBERS));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as BoardMember[];
};

// SAVE all members (overwrite)
export const updateBoardMembers = async (members: BoardMember[]) => {
  for (const m of members) {
    await setDoc(doc(db, COL_MEMBERS, m.id), m);
  }
};


// =========================
// 📌 TRAINING SESSIONS
// =========================

export const getSessions = async (): Promise<TrainingSession[]> => {
  const snap = await getDocs(collection(db, COL_SESSIONS));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })) as TrainingSession[];
};

// UPDATE 1 session
export const updateSession = async (session: TrainingSession) => {
  await setDoc(doc(db, COL_SESSIONS, session.id), session);
};

// UPDATE ALL sessions (save button)
export const updateAllSessions = async (sessions: TrainingSession[]) => {
  for (const s of sessions) {
    await setDoc(doc(db, COL_SESSIONS, s.id), s);
  }
};


// =========================
// 📌 APP CONFIG
// =========================

export const getAppConfig = async (): Promise<AppConfig> => {
  const snap = await getDocs(collection(db, COL_CONFIG));
  if (snap.empty) {
    // Nếu chưa có config → tạo config mặc định
    const defaultConfig: AppConfig = {
      logoUrl: "default",
      title: "Cóc Sài Gòn",
      subtitle: "TRAINING MANAGER",
      welcomeTitle: "Xin chào Cóc Sài Gòn! 👋",
      welcomeDescription:
        "Hệ thống training website chuyên nghiệp cho đợt tuyển thành viên mới Gen Z."
    };
    await setDoc(doc(db, COL_CONFIG, "main"), defaultConfig);
    return defaultConfig;
  }
  const docData = snap.docs[0].data();
  return docData as AppConfig;
};

export const updateAppConfig = async (config: AppConfig) => {
  await setDoc(doc(db, COL_CONFIG, "main"), config);
};


// =========================
// ❗ KHÔNG CÒN HÀM resetData (localStorage)
// vì đã dùng cloud Firestore.
// =========================
