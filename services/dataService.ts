import { BoardMember, Department, LocationType, Status, TrainingSession, AppConfig } from '../types';
import { db } from './firebaseService';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
  writeBatch,
  deleteDoc,
  query
} from 'firebase/firestore';

// ==============================
// GIỮ NGUYÊN các hằng & dữ liệu khởi tạo
// ==============================
const BOARD_MEMBERS_KEY = 'csg_board_members'; 
const SESSIONS_KEY = 'csg_training_sessions';
const APP_CONFIG_KEY = 'csg_app_config';

const INITIAL_BOARD_MEMBERS: BoardMember[] = [
  { id: '1', name: 'Nguyễn Văn A', role: 'Chủ Nhiệm', email: 'chunhiem@cocsaigon.vn', avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=f97316&color=fff' },
  { id: '2', name: 'Trần Thị B', role: 'Phó Chủ Nhiệm Nội Vụ', email: 'pcn.noivu@cocsaigon.vn', avatar: 'https://ui-avatars.com/api/?name=Tran+Thi+B&background=8b5cf6&color=fff' },
  { id: '3', name: 'Lê Văn C', role: 'Phó Chủ Nhiệm Ngoại Vụ', email: 'pcn.ngoaivu@cocsaigon.vn', avatar: 'https://ui-avatars.com/api/?name=Le+Van+C&background=10b981&color=fff' },
];

const INITIAL_SESSIONS: TrainingSession[] = [
  {
    id: 'gen-1', topic: 'Office + Mail Tổng', department: Department.GENERAL, trainerName: 'Nguyễn Văn A', materialsLink: '', requirements: 'Quy trình sử dụng mail, cách soạn văn bản hành chính', status: Status.PENDING, reviewerName: 'Ban Kiểm Soát', date: '2024-12-07', startTime: '08:00', duration: 45, locationType: LocationType.HALL, locationDetail: 'Hall A', deadline: '2024-12-05'
  },
  // Add other sessions here
];

const INITIAL_CONFIG: AppConfig = {
  logoUrl: 'default',
  title: 'Cóc Sài Gòn',
  subtitle: 'TRAINING MANAGER',
  welcomeTitle: 'Xin chào Cóc Sài Gòn! 👋',
  welcomeDescription: 'Hệ thống training website chuyên nghiệp cho đợt tuyển thành viên mới Gen Z.',
  editorEmails: []
};

// ==============================
// Cache + Listener Firestore
// ==============================
let BOARD_MEMBERS_CACHE: BoardMember[] = [...INITIAL_BOARD_MEMBERS];
let SESSIONS_CACHE: TrainingSession[] = [...INITIAL_SESSIONS];
let APP_CONFIG_CACHE: AppConfig = { ...INITIAL_CONFIG };

const membersCol = collection(db, 'boardMembers');
const sessionsCol = collection(db, 'sessions');
const configDoc = doc(db, 'config', 'main');

let onDataChangeCallback: (() => void) | null = null;
let firestoreReady = false;

export const subscribeDataChanges = (callback: () => void) => {
  onDataChangeCallback = callback;

  // Lắng nghe và đồng bộ khi có thay đổi từ Firebase
  onSnapshot(query(membersCol), (snap) => {
    const arr: BoardMember[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    if (arr.length > 0) {
      BOARD_MEMBERS_CACHE = arr;
      // Cập nhật vào localStorage
      localStorage.setItem(BOARD_MEMBERS_KEY, JSON.stringify(arr));
      firestoreReady = true;
      notifyDataChange();
    }
  });

  onSnapshot(query(sessionsCol), (snap) => {
    const arr: TrainingSession[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    SESSIONS_CACHE = arr; // ⚡ Giữ đồng bộ realtime và localStorage
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(arr)); // Lưu vào localStorage
    firestoreReady = true;
    notifyDataChange();
  });

  onSnapshot(configDoc, (d) => {
    if (d.exists()) {
      APP_CONFIG_CACHE = { ...INITIAL_CONFIG, ...(d.data() as any) };
      // Cập nhật vào localStorage
      localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(APP_CONFIG_CACHE));
      firestoreReady = true;
      notifyDataChange();
    }
  });
};

function notifyDataChange() {
  if (onDataChangeCallback) onDataChangeCallback();
}

export const waitForFirestoreReady = async (): Promise<void> => {
  return new Promise((resolve) => {
    if (firestoreReady) resolve();
    else {
      const check = setInterval(() => {
        if (firestoreReady) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    }
  });
};

// ==============================
// EXPORT HÀM (CÓ CẬP NHẬT FIRESTORE)
// ==============================

export const getBoardMembers = (): BoardMember[] => {
  const cachedData = localStorage.getItem(BOARD_MEMBERS_KEY);
  return cachedData ? JSON.parse(cachedData) : BOARD_MEMBERS_CACHE;
};

export const updateBoardMembers = (members: BoardMember[]): void => {
  (async () => {
    try {
      const batch = writeBatch(db);
      const idsFromIncoming = new Set<string>(members.map(m => m.id));

      for (const m of members) batch.set(doc(db, 'boardMembers', m.id), m);

      const snap = await getDocs(membersCol);
      for (const d of snap.docs) if (!idsFromIncoming.has(d.id)) batch.delete(doc(db, 'boardMembers', d.id));

      await batch.commit();

      const editorEmails = members
        .filter(m => {
          const r = (m.role || '').toLowerCase();
          return r.includes('trưởng') || r.includes('phó') || r.includes('mentor');
        })
        .map(m => (m.email || '').toLowerCase())
        .filter(e => !!e);

      const uniqueEditors = Array.from(new Set(editorEmails));
      await setDoc(configDoc, { editorEmails: uniqueEditors } as any, { merge: true });

      BOARD_MEMBERS_CACHE = [...members];
      // Cập nhật vào localStorage
      localStorage.setItem(BOARD_MEMBERS_KEY, JSON.stringify(members));
    } catch (e: any) {
      console.error('updateBoardMembers error:', e?.code, e?.message, e);
      alert('Không thể lưu danh sách nhân sự lên cloud. Vui lòng thử lại.');
    }
  })();
};

export const getSessions = (): TrainingSession[] => {
  const cachedData = localStorage.getItem(SESSIONS_KEY);
  return cachedData ? JSON.parse(cachedData) : SESSIONS_CACHE;
};

export const updateSession = (session: TrainingSession): void => {
  (async () => {
    try {
      await setDoc(doc(db, 'sessions', session.id), session, { merge: true });
      SESSIONS_CACHE = SESSIONS_CACHE.map(s => s.id === session.id ? session : s);
      // Cập nhật vào localStorage
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(SESSIONS_CACHE));
      notifyDataChange();
    } catch (e: any) {
      console.error('updateSession error:', e?.code, e?.message, e);
      alert('Không thể lưu thay đổi session. Vui lòng thử lại.');
    }
  })();
};

export const updateAllSessions = (sessions: TrainingSession[]): void => {
  (async () => {
    try {
      const batch = writeBatch(db);
      const idsIncoming = new Set(sessions.map(s => s.id));

      sessions.forEach((s) => batch.set(doc(db, 'sessions', s.id), s));

      const existing = await getDocs(sessionsCol);
      existing.forEach(d => {
        if (!idsIncoming.has(d.id)) batch.delete(doc(db, 'sessions', d.id));
      });

      await batch.commit();
      SESSIONS_CACHE = [...sessions];
      // Cập nhật vào localStorage
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      notifyDataChange();
      console.log('✅ updateAllSessions đã đồng bộ Firestore thành công.');
    } catch (e: any) {
      console.error('updateAllSessions error:', e?.code, e?.message, e);
      alert('Không thể cập nhật danh sách sessions lên cloud. Vui lòng thử lại.');
    }
  })();
};

// ✅ Thêm mới: XÓA session trên Firestore (và đồng bộ realtime)
export const deleteSession = async (sessionId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'sessions', sessionId));
    SESSIONS_CACHE = SESSIONS_CACHE.filter(s => s.id !== sessionId);
    // Cập nhật vào localStorage
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(SESSIONS_CACHE));
    notifyDataChange();
    console.log(`✅ Đã xóa session ${sessionId} khỏi Firestore`);
  } catch (e: any) {
    console.error('❌ Lỗi khi xóa session:', e?.code, e?.message, e);
    alert('Không thể xóa session này. Vui lòng thử lại.');
  }
};

export const getAppConfig = (): AppConfig => {
  const cachedData = localStorage.getItem(APP_CONFIG_KEY);
  return cachedData ? JSON.parse(cachedData) : APP_CONFIG_CACHE;
};

export const updateAppConfig = (config: AppConfig): void => {
  (async () => {
    try {
      await setDoc(configDoc, config, { merge: true });
      APP_CONFIG_CACHE = { ...config };
      // Cập nhật vào localStorage
      localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(config));
      console.log('✅ AppConfig updated to Firestore:', config);
    } catch (e: any) {
      console.error('updateAppConfig error:', e?.code, e?.message, e);
      alert('Không thể lưu cấu hình lên cloud. Vui lòng thử lại.');
    }
  })();
};
