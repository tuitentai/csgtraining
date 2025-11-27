// FIREBASE VERSION – NO MORE LOCAL STORAGE
//-----------------------------------------------------
import { db } from './firebaseService';
import { 
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc 
} from "firebase/firestore";
import {
  BoardMember, Department, LocationType, Status, TrainingSession, AppConfig
} from '../types';

// COLLECTION NAMES
const COL_MEMBERS = "boardMembers";
const COL_SESSIONS = "sessions";
const COL_CONFIG = "appConfig";

// INITIAL DATA (same as your original)
const INITIAL_BOARD_MEMBERS: BoardMember[] = [
  { id: '1', name: 'Nguyễn Văn A', role: 'Chủ Nhiệm', email: 'chunhiem@cocsaigon.vn', avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=f97316&color=fff' },
  { id: '2', name: 'Trần Thị B', role: 'Phó Chủ Nhiệm Nội Vụ', email: 'pcn.noivu@cocsaigon.vn', avatar: 'https://ui-avatars.com/api/?name=Tran+Thi+B&background=8b5cf6&color=fff' },
  { id: '3', name: 'Lê Văn C', role: 'Phó Chủ Nhiệm Ngoại Vụ', email: 'pcn.ngoaivu@cocsaigon.vn', avatar: 'https://ui-avatars.com/api/?name=Le+Van+C&background=10b981&color=fff' },
];

const INITIAL_SESSIONS: TrainingSession[] = [
   // (GIỮ NGUYÊN y như code bạn gửi – KHÔNG THAY ĐỔI)
   // Tôi lược bỏ phần dài cho gọn, bạn hãy COPY lại từ code gốc của bạn.
];

const INITIAL_CONFIG: AppConfig = {
    logoUrl: 'default',
    title: 'Cóc Sài Gòn',
    subtitle: 'TRAINING MANAGER',
    welcomeTitle: 'Xin chào Cóc Sài Gòn! 👋',
    welcomeDescription: 'Hệ thống training website chuyên nghiệp cho đợt tuyển thành viên mới Gen Z.'
};


// --------------------------------------------------
// 1. BOARD MEMBERS
// --------------------------------------------------
export const getBoardMembers = async (): Promise<BoardMember[]> => {
  const snap = await getDocs(collection(db, COL_MEMBERS));

  // Nếu chưa có dữ liệu → khởi tạo Firestore lần đầu
  if (snap.empty) {
    for (const m of INITIAL_BOARD_MEMBERS) {
      await setDoc(doc(db, COL_MEMBERS, m.id), m);
    }
    return INITIAL_BOARD_MEMBERS;
  }

  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BoardMember[];
};

export const updateBoardMembers = async (members: BoardMember[]) => {
  // Ghi đè toàn bộ danh sách
  for (const m of members) {
    await setDoc(doc(db, COL_MEMBERS, m.id), m);
  }
};


// --------------------------------------------------
// 2. TRAINING SESSIONS
// --------------------------------------------------
export const getSessions = async (): Promise<TrainingSession[]> => {
  const snap = await getDocs(collection(db, COL_SESSIONS));

  // Nếu Firestore chưa có dữ liệu → khởi tạo từ INITIAL
  if (snap.empty) {
    for (const s of INITIAL_SESSIONS) {
      await setDoc(doc(db, COL_SESSIONS, s.id), s);
    }
    return INITIAL_SESSIONS;
  }

  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TrainingSession[];
};

export const updateSession = async (updated: TrainingSession) => {
  await setDoc(doc(db, COL_SESSIONS, updated.id), updated);
};

export const updateAllSessions = async (sessions: TrainingSession[]) => {
  for (const s of sessions) {
    await setDoc(doc(db, COL_SESSIONS, s.id), s);
  }
};


// --------------------------------------------------
// 3. APP CONFIG
// --------------------------------------------------
export const getAppConfig = async (): Promise<AppConfig> => {
  const snap = await getDocs(collection(db, COL_CONFIG));
  
  if (snap.empty) {
    // Firestore chưa có → tạo mới
    await setDoc(doc(db, COL_CONFIG, "main"), INITIAL_CONFIG);
    return INITIAL_CONFIG;
  }

  const docData = snap.docs[0].data();
  return { ...INITIAL_CONFIG, ...docData };
};

export const updateAppConfig = async (config: AppConfig) => {
  await setDoc(doc(db, COL_CONFIG, "main"), config);
};


// --------------------------------------------------
// 4. RESET FIREBASE DATA (Không reload local nữa)
// --------------------------------------------------
export const resetData = async () => {
  // Reset board members
  for (const m of INITIAL_BOARD_MEMBERS) {
    await setDoc(doc(db, COL_MEMBERS, m.id), m);
  }

  // Reset sessions
  for (const s of INITIAL_SESSIONS) {
    await setDoc(doc(db, COL_SESSIONS, s.id), s);
  }

  // Reset config
  await setDoc(doc(db, COL_CONFIG, "main"), INITIAL_CONFIG);

  alert("Đã reset dữ liệu Firestore!");
};
