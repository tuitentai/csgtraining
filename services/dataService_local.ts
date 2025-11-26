
import { BoardMember, Department, LocationType, Status, TrainingSession, AppConfig } from '../types';

const BOARD_MEMBERS_KEY = 'csg_board_members';
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

export const getBoardMembers = (): BoardMember[] => {
  const stored = localStorage.getItem(BOARD_MEMBERS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(BOARD_MEMBERS_KEY, JSON.stringify(INITIAL_BOARD_MEMBERS));
  return INITIAL_BOARD_MEMBERS;
};

export const updateBoardMembers = (members: BoardMember[]): void => {
    localStorage.setItem(BOARD_MEMBERS_KEY, JSON.stringify(members));
};

export const getSessions = (): TrainingSession[] => {
  const stored = localStorage.getItem(SESSIONS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(INITIAL_SESSIONS));
  return INITIAL_SESSIONS;
};

export const updateSession = (updatedSession: TrainingSession): void => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === updatedSession.id);
  if (index !== -1) {
    sessions[index] = updatedSession;
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }
};

export const updateAllSessions = (sessions: TrainingSession[]): void => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export const getAppConfig = (): AppConfig => {
    const stored = localStorage.getItem(APP_CONFIG_KEY);
    if (stored) {
        // Merge with initial to ensure new fields (welcomeTitle) exist if local storage is old
        const parsed = JSON.parse(stored);
        return { ...INITIAL_CONFIG, ...parsed };
    }
    localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(INITIAL_CONFIG));
    return INITIAL_CONFIG;
}

export const updateAppConfig = (config: AppConfig): void => {
    localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(config));
}

export const resetData = (): void => {
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(BOARD_MEMBERS_KEY);
    localStorage.removeItem(APP_CONFIG_KEY);
    window.location.reload();
}
