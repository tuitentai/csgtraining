// dataService.ts (Firestore version - giữ nguyên 100% API như bản localStorage)

import { BoardMember, Department, LocationType, Status, TrainingSession, AppConfig } from '../types';
import { db } from './firebaseService';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  getDoc,
  onSnapshot,
  writeBatch,
  deleteDoc,
  query
} from 'firebase/firestore';

// ==============================
// Giữ nguyên các hằng & dữ liệu khởi tạo (cho UI có dữ liệu ngay lần đầu)
// ==============================
const BOARD_MEMBERS_KEY = 'csg_board_members'; // giữ tên cũ để không vỡ import ở nơi khác (không còn dùng local)
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
  // Media - Date 06/12
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
  // Event - Date 07/12
  {
    id: 'evt-1', topic: 'Training Event Production', department: Department.EVENT, trainerName: '', materialsLink: '', requirements: 'Chạy chương trình, setup âm thanh ánh sáng', status: Status.PENDING, reviewerName: 'Trưởng Ban Event', date: '2024-12-07', startTime: '09:00', duration: 45, locationType: LocationType.HALL, locationDetail: 'Hall B', deadline: '2024-12-05'
  },
  {
    id: 'evt-2', topic: 'Training Planning', department: Department.EVENT, trainerName: '', materialsLink: '', requirements: 'Lên ý tưởng, viết proposal, timeline', status: Status.PENDING, reviewerName: 'Trưởng Ban Event', date: '2024-12-07', startTime: '10:00', duration: 45, locationType: LocationType.CLASSROOM, locationDetail: '', deadline: '2024-12-05'
  },
  {
    id: 'evt-3', topic: 'Training Paperwork', department: Department.EVENT, trainerName: '', materialsLink: '', requirements: 'Giấy tờ xin phép, thủ tục hành chính', status: Status.PENDING, reviewerName: 'Trưởng Ban Event', date: '2024-12-07', startTime: '11:00', duration: 30, locationType: LocationType.CLASSROOM, locationDetail: '', deadline: '2024-12-05'
  },
  // ER - Date 07/12
  {
    id: 'er-1', topic: 'Kỹ năng Đối ngoại', department: Department.ER, trainerName: '', materialsLink: '', requirements: 'Giao tiếp, xin tài trợ, giữ mối quan hệ', status: Status.PENDING, reviewerName: 'Trưởng Ban ER', date: '2024-12-07', startTime: '13:30', duration: 45, locationType: LocationType.CLASSROOM, locationDetail: '', deadline: '2024-12-05'
  },
];

const INITIAL_CONFIG: AppConfig = {
  logoUrl: 'default',
  title: 'Cóc Sài Gòn',
  subtitle: 'TRAINING MANAGER',
  welcomeTitle: 'Xin chào Cóc Sài Gòn! 👋',
  welcomeDescription: 'Hệ thống training website chuyên nghiệp cho đợt tuyển thành viên mới Gen Z.'
};

// ==============================
// Cache bộ nhớ + Listener Firestore để giữ API đồng bộ
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
      if (arr.length > 0) {
        BOARD_MEMBERS_CACHE = arr;
      }
    });

    // Sessions
    onSnapshot(query(sessionsCol), (snap) => {
      const arr: TrainingSession[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
      if (arr.length > 0) {
        SESSIONS_CACHE = arr;
      }
    });

    // Config
    onSnapshot(configDoc, (d) => {
      if (d.exists()) {
        APP_CONFIG_CACHE = { ...INITIAL_CONFIG, ...(d.data() as any) };
      }
    });
  } catch (e) {
    console.error('Firestore onSnapshot init error:', e);
  }
})();

// ==============================
// Giữ NGUYÊN CHỮ KÝ HÀM (đồng bộ) nhưng thao tác ghi là async nội bộ
// ==============================

export const getBoardMembers = (): BoardMember[] => {
  // Lần đầu nếu cache chưa có dữ liệu cloud, trả về INITIAL để UI có thứ hiển thị
  // Listener sẽ cập nhật cache khi Firestore trả dữ liệu.
  return BOARD_MEMBERS_CACHE;
};

export const updateBoardMembers = (members: BoardMember[]): void => {
  // Ghi Firestore theo batch, không đổi chữ ký (không async/await bên ngoài)
  (async () => {
    try {
      const batch = writeBatch(db);

      // Viết/ghi đè từng phần tử theo id hiện có
      const idsFromIncoming = new Set<string>(members.map(m => m.id));

      for (const m of members) {
        const ref = doc(db, 'boardMembers', m.id);
        batch.set(ref, m);
      }

      // Xóa những doc không còn trong danh sách mới
      const snap = await getDocs(membersCol);
      for (const d of snap.docs) {
        if (!idsFromIncoming.has(d.id)) {
          batch.delete(doc(db, 'boardMembers', d.id));
        }
      }

      await batch.commit();

      // Cập nhật cache ngay để UI phản hồi tức thì
      BOARD_MEMBERS_CACHE = [...members];
    } catch (e) {
      console.error('updateBoardMembers error:', e);
      alert('Không thể lưu danh sách nhân sự lên cloud. Vui lòng thử lại.');
    }
  })();
};

export const getSessions = (): TrainingSession[] => {
  return SESSIONS_CACHE;
};

export const updateSession = (updatedSession: TrainingSession): void => {
  (async () => {
    try {
      const ref = doc(db, 'sessions', updatedSession.id);
      await setDoc(ref, updatedSession);

      // Cập nhật cache cục bộ để đồng bộ UI
      const next = [...SESSIONS_CACHE];
      const index = next.findIndex(s => s.id === updatedSession.id);
      if (index !== -1) {
        next[index] = updatedSession;
      } else {
        next.push(updatedSession);
      }
      SESSIONS_CACHE = next;
    } catch (e) {
      console.error('updateSession error:', e);
      alert('Không thể lưu slot training lên cloud. Vui lòng thử lại.');
    }
  })();
};

export const updateAllSessions = (sessions: TrainingSession[]): void => {
  (async () => {
    try {
      const batch = writeBatch(db);
      const incomingIds = new Set<string>(sessions.map(s => s.id));

      // Viết/ghi đè toàn bộ danh sách truyền vào
      for (const s of sessions) {
        const ref = doc(db, 'sessions', s.id);
        batch.set(ref, s);
      }

      // Xóa những doc không còn trong danh sách
      const snap = await getDocs(sessionsCol);
      for (const d of snap.docs) {
        if (!incomingIds.has(d.id)) {
          batch.delete(doc(db, 'sessions', d.id));
        }
      }

      await batch.commit();

      // Cập nhật cache ngay
      SESSIONS_CACHE = [...sessions];
    } catch (e) {
      console.error('updateAllSessions error:', e);
      alert('Không thể lưu khung giáo án lên cloud. Vui lòng thử lại.');
    }
  })();
};

export const getAppConfig = (): AppConfig => {
  return APP_CONFIG_CACHE;
};

export const updateAppConfig = (config: AppConfig): void => {
  (async () => {
    try {
      await setDoc(configDoc, config, { merge: true });
      APP_CONFIG_CACHE = { ...APP_CONFIG_CACHE, ...config };
    } catch (e) {
      console.error('updateAppConfig error:', e);
      alert('Không thể lưu cấu hình giao diện lên cloud. Vui lòng thử lại.');
    }
  })();
};

export const resetData = (): void => {
  // Thay vì xóa localStorage, ta xóa dữ liệu trên Firestore cho đồng bộ giữa mọi người
  (async () => {
    try {
      // Xóa sessions
      const sSnap = await getDocs(sessionsCol);
      for (const d of sSnap.docs) {
        await deleteDoc(doc(db, 'sessions', d.id));
      }

      // Xóa board members
      const mSnap = await getDocs(membersCol);
      for (const d of mSnap.docs) {
        await deleteDoc(doc(db, 'boardMembers', d.id));
      }

      // Reset config
      await setDoc(configDoc, INITIAL_CONFIG);

      // Reset cache
      SESSIONS_CACHE = [...INITIAL_SESSIONS];
      BOARD_MEMBERS_CACHE = [...INITIAL_BOARD_MEMBERS];
      APP_CONFIG_CACHE = { ...INITIAL_CONFIG };

      // Giữ nguyên hành vi cũ: reload UI
      window.location.reload();
    } catch (e) {
      console.error('resetData error:', e);
      alert('Không thể reset dữ liệu cloud. Vui lòng thử lại.');
    }
  })();
};
