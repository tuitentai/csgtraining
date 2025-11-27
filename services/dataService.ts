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
const BOARD_MEMBERS_KEY = 'csg_board_members'; // vẫn giữ tên cũ để không vỡ import
const SESSIONS_KEY = 'csg_training_sessions';
const APP_CONFIG_KEY = 'csg_app_config';

const INITIAL_BOARD_MEMBERS: BoardMember[] = [
  { id: '1', name: 'Nguyễn Văn A', role: 'Chủ Nhiệm', email: 'chunhiem@cocsaigon.vn', avatar: 'https://ui-avatars.com/api/?name=Nguyen+Van+A&background=f97316&color=fff' },
  { id: '2', name: 'Trần Thị B', role: 'Phó Chủ Nhiệm Nội Vụ', email: 'pcn.noivu@cocsaigon.vn', avatar: 'https://ui-avatars.com/api/?name=Tran+Thi+B&background=8b5cf6&color=fff' },
  { id: '3', name: 'Lê Văn C', role: 'Phó Chủ Nhiệm Ngoại Vụ', email: 'pcn.ngoaivu@cocsaigon.vn', avatar: 'https://ui-avatars.com/api/?name=Le+Van+C&background=10b981&color=fff' },
];

const INITIAL_SESSIONS: TrainingSession[] = [
  // General
  {
    id: 'gen-1', topic: 'Office + Mail Tổng', department: Department.GENERAL, trainerName: 'Nguyễn Văn A', materialsLink: '', requirements: 'Quy trình sử dụng mail, cách soạn văn bản hành chính', status: Status.PENDING, reviewerName: 'Ban Kiểm Soát', date: '2024-12-07', startTime: '08:00', duration: 45, locationType: LocationType.HALL, locationDetail: 'Hall A', deadline: '2024-12-05'
  },
  // Media
  {
    id: 'med-1', topic: 'Training Design', department: Department.MEDIA, trainerName: '', materialsLink: '', requirements: 'Cơ bản về Photoshop/Illustrator, Brand guidelines', status: Status.PENDING, reviewerName: 'Trưởng Ban Media', date: '2024-12-06', startTime: '13:30', duration: 45, locationType: LocationType.CLASSROOM, locationDetail: '', deadline: '2024-12-04'
  },
  {
    id: 'med-2', topic: 'Training Photo', department: Department.MEDIA, trainerName: '', materialsLink: '', requirements: 'Góc chụp, bố cục, chỉnh sửa Lightroom', status: Status.PENDING, reviewerName: 'Trưởng Ban Media', date: '2024-12-06', startTime: '14:30', duration: 45, locationType: LocationType.CLASSROOM, locationDetail: '', deadline: '2024-12-04'
  },
  {
    id: 'med-3', topic: 'Training Content', department: Department.MEDIA, trainerName: '', materialsLink: '', requirements: 'Tone & Mood, cấu trúc bài viết', status: Status.PENDING, reviewerName: 'Trưởng Ban Media', date: '2024-12-06', startTime: '15:30', duration: 30, locationType: LocationType.CLASSROOM, locationDetail: '', deadline: '2024-12-04'
  },
  {
    id: 'med-4', topic: 'Training Video Edition', department: Department.MEDIA, trainerName: '', materialsLink: '', requirements: 'Premiere/Capcut cơ bản, Tư duy dựng', status: Status.PENDING, reviewerName: 'Trưởng Ban Media', date: '2024-12-06', startTime: '16:15', duration: 45, locationType: LocationType.CLASSROOM, locationDetail: '', deadline: '2024-12-04'
  },
  // Event
  {
    id: 'evt-1', topic: 'Training Event Production', department: Department.EVENT, trainerName: '', materialsLink: '', requirements: 'Chạy chương trình, setup âm thanh ánh sáng', status: Status.PENDING, reviewerName: 'Trưởng Ban Event', date: '2024-12-07', startTime: '09:00', duration: 45, locationType: LocationType.HALL, locationDetail: 'Hall B', deadline: '2024-12-05'
  },
  {
    id: 'evt-2', topic: 'Training Planning', department: Department.EVENT, trainerName: '', materialsLink: '', requirements: 'Lên ý tưởng, viết proposal, timeline', status: Status.PENDING, reviewerName: 'Trưởng Ban Event', date: '2024-12-07', startTime: '10:00', duration: 45, locationType: LocationType.CLASSROOM, locationDetail: '', deadline: '2024-12-05'
  },
  {
    id: 'evt-3', topic: 'Training Paperwork', department: Department.EVENT, trainerName: '', materialsLink: '', requirements: 'Giấy tờ xin phép, thủ tục hành chính', status: Status.PENDING, reviewerName: 'Trưởng Ban Event', date: '2024-12-07', startTime: '11:00', duration: 30, locationType: LocationType.CLASSROOM, locationDetail: '', deadline: '2024-12-05'
  },
  // ER
  {
    id: 'er-1', topic: 'Kỹ năng Đối ngoại', department: Department.ER, trainerName: '', materialsLink: '', requirements: 'Giao tiếp, xin tài trợ, giữ mối quan hệ', status: Status.PENDING, reviewerName: 'Trưởng Ban ER', date: '2024-12-07', startTime: '13:30', duration: 45, locationType: LocationType.CLASSROOM, locationDetail: '', deadline: '2024-12-05'
  },
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
// Cache bộ nhớ + Listener Firestore để GIỮ API ĐỒNG BỘ
// ==============================
let BOARD_MEMBERS_CACHE: BoardMember[] = [...INITIAL_BOARD_MEMBERS];
let SESSIONS_CACHE: TrainingSession[] = [...INITIAL_SESSIONS];
let APP_CONFIG_CACHE: AppConfig = { ...INITIAL_CONFIG };

const membersCol = collection(db, 'boardMembers');
const sessionsCol = collection(db, 'sessions');
const configDoc = doc(db, 'config', 'main');

// Khởi động listener ngay khi module được import
(function initFirestoreSubscriptions() {
  try {
    // Board Members
    onSnapshot(query(membersCol), (snap) => {
      const arr: BoardMember[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      if (arr.length > 0) BOARD_MEMBERS_CACHE = arr;
    });

    // Sessions
    onSnapshot(query(sessionsCol), (snap) => {
      const arr: TrainingSession[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      if (arr.length > 0) SESSIONS_CACHE = arr;
    });

    // Config
    onSnapshot(configDoc, (d) => {
      if (d.exists()) APP_CONFIG_CACHE = { ...INITIAL_CONFIG, ...(d.data() as any) };
    });
  } catch (e) {
    console.error('Firestore onSnapshot init error:', e);
  }
})();

// ==============================
// EXPORT HÀM (KHÔNG ĐỔI LOGIC)
// ==============================

export const getBoardMembers = (): BoardMember[] => BOARD_MEMBERS_CACHE;

export const updateBoardMembers = (members: BoardMember[]): void => {
  (async () => {
    try {
      const batch = writeBatch(db);
      const idsFromIncoming = new Set<string>(members.map(m => m.id));

      for (const m of members) batch.set(doc(db, 'boardMembers', m.id), m);

      const snap = await getDocs(membersCol);
      for (const d of snap.docs) if (!idsFromIncoming.has(d.id)) batch.delete(doc(db, 'boardMembers', d.id));

      await batch.commit();

      // Tự động đồng bộ quyền
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
    } catch (e: any) {
      console.error('updateBoardMembers error:', e?.code, e?.message, e);
      alert('Không thể lưu danh sách nhân sự lên cloud. Vui lòng thử lại.');
    }
  })();
};

// ==============================
// ✅ THÊM EXPORT HỢP LỆ CHO CurriculumManager
// (KHÔNG THAY ĐỔI LOGIC FIREBASE, chỉ giúp Vercel build được)
// ==============================

// Hàm lấy sessions (đồng bộ cache)
export const getSessions = (): TrainingSession[] => {
  return SESSIONS_CACHE;
};

// Hàm update session đơn lẻ (ghi Firestore thật)
export const updateSession = (session: TrainingSession): void => {
  (async () => {
    try {
      await setDoc(doc(db, 'sessions', session.id), session, { merge: true });
      // Cập nhật cache local để UI phản hồi ngay
      SESSIONS_CACHE = SESSIONS_CACHE.map(s => s.id === session.id ? session : s);
    } catch (e: any) {
      console.error('updateSession error:', e?.code, e?.message, e);
      alert('Không thể lưu thay đổi session. Vui lòng thử lại.');
    }
  })();
};

// Cập nhật toàn bộ sessions (dùng cho AdminPanel)
export const updateAllSessions = (sessions: TrainingSession[]): void => {
  (async () => {
    try {
      const batch = writeBatch(db);
      sessions.forEach((s) => batch.set(doc(db, 'sessions', s.id), s));
      await batch.commit();
      SESSIONS_CACHE = [...sessions];
    } catch (e: any) {
      console.error('updateAllSessions error:', e?.code, e?.message, e);
      alert('Không thể cập nhật danh sách sessions lên cloud. Vui lòng thử lại.');
    }
  })();
};

// ✅ Đồng bộ AppConfig với Firestore
export const getAppConfig = (): AppConfig => {
  // Nếu Firestore chưa kịp trả snapshot, vẫn trả cache mặc định
  return APP_CONFIG_CACHE;
};

export const updateAppConfig = (config: AppConfig): void => {
  (async () => {
    try {
      // Ghi trực tiếp lên Firestore (document: config/main)
      await setDoc(configDoc, config, { merge: true });

      // Cập nhật cache local để UI phản hồi tức thời
      APP_CONFIG_CACHE = { ...config };
      console.log('✅ AppConfig updated to Firestore:', config);
    } catch (e: any) {
      console.error('updateAppConfig error:', e?.code, e?.message, e);
      alert('Không thể lưu cấu hình lên cloud. Vui lòng thử lại.');
    }
  })();
};
