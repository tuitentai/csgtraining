// 🔥 DATA SERVICE (FIREBASE VERSION)
// Lưu toàn bộ dữ liệu BoardMembers, Config, Sessions lên Firestore cloud

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { BoardMember, AppConfig, TrainingSession } from "../types";

// --------- COLLECTION NAMES TRÊN FIRESTORE ---------
const COLLECTION_MEMBERS = "boardMembers";
const COLLECTION_CONFIG = "appConfig";
const COLLECTION_SESSIONS = "trainingSessions";

// --------- LẤY DANH SÁCH BAN CHỦ NHIỆM ---------
export const getBoardMembers = async (): Promise<BoardMember[]> => {
  const snapshot = await getDocs(collection(db, COLLECTION_MEMBERS));
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() } as BoardMember)
  );
};

// --------- THÊM HOẶC CẬP NHẬT BAN CHỦ NHIỆM ---------
export const updateBoardMembers = async (members: BoardMember[]) => {
  const colRef = collection(db, COLLECTION_MEMBERS);
  for (const m of members) {
    if (m.id) {
      await setDoc(doc(colRef, m.id), m);
    } else {
      await addDoc(colRef, m);
    }
  }
};

// --------- LẤY CẤU HÌNH WEBSITE ---------
export const getAppConfig = async (): Promise<AppConfig> => {
  const snapshot = await getDocs(collection(db, COLLECTION_CONFIG));
  if (snapshot.empty) {
    return {
      logoUrl: "default",
      title: "Cóc Sài Gòn",
      subtitle: "TRAINING MANAGER",
      welcomeTitle: "",
      welcomeDescription: "",
    };
  }
  return snapshot.docs[0].data() as AppConfig;
};

// --------- CẬP NHẬT CẤU HÌNH WEBSITE ---------
export const updateAppConfig = async (config: AppConfig) => {
  const colRef = collection(db, COLLECTION_CONFIG);
  const snapshot = await getDocs(colRef);
  if (snapshot.empty) {
    await addDoc(colRef, config);
  } else {
    const docId = snapshot.docs[0].id;
    await updateDoc(doc(db, COLLECTION_CONFIG, docId), config as any);
  }
};

// --------- LẤY DANH SÁCH CÁC BUỔI TRAINING ---------
export const getSessions = async (): Promise<TrainingSession[]> => {
  const snapshot = await getDocs(collection(db, COLLECTION_SESSIONS));
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() } as TrainingSession)
  );
};

// --------- CẬP NHẬT TOÀN BỘ BUỔI TRAINING ---------
export const updateAllSessions = async (sessions: TrainingSession[]) => {
  const colRef = collection(db, COLLECTION_SESSIONS);
  for (const s of sessions) {
    if (s.id) {
      await setDoc(doc(colRef, s.id), s);
    } else {
      await addDoc(colRef, s);
    }
  }
};

// --------- CẬP NHẬT 1 BUỔI TRAINING RIÊNG LẺ ---------
export const updateSession = async (session: TrainingSession) => {
  const colRef = collection(db, COLLECTION_SESSIONS);
  if (session.id) {
    // Nếu có id thì update
    await setDoc(doc(colRef, session.id), session);
  } else {
    // Nếu chưa có thì thêm mới
    await addDoc(colRef, session);
  }
};

// --------- XOÁ MỘT BUỔI TRAINING ---------
export const deleteSession = async (id: string) => {
  await deleteDoc(doc(db, COLLECTION_SESSIONS, id));
};
