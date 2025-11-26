
export enum Department {
  GENERAL = 'General',
  EVENT = 'Ban Event',
  MEDIA = 'Ban Media',
  ER = 'Ban ER',
  BOARD = 'Ban Điều Hành/Chủ Nhiệm'
}

export enum Status {
  APPROVED = 'Đã Duyệt',
  CHECKING = 'Đang Kiểm Tra',
  REVISION = 'Chỉnh Lại',
  PENDING = 'Chưa Nộp'
}

export enum LocationType {
  CLASSROOM = 'Phòng Học',
  HALL = 'Hội Trường'
}

export interface TrainingSession {
  id: string;
  topic: string; // e.g., "Training Design"
  department: Department;
  trainerName: string;
  materialsLink: string;
  requirements: string; // Minimum requirements
  status: Status;
  reviewerName: string;
  
  // Schedule info
  date: string; // '2024-12-06'
  startTime: string; // "13:00"
  duration: number; // in minutes
  locationType: LocationType;
  locationDetail: string; // "Room 201" or "Hall A"
  
  // Deadline info
  deadline: string; // '2024-12-05'
}

export interface BoardMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
}

export type ViewState = 'dashboard' | 'curriculum' | 'schedule' | 'board' | 'admin' | 'guide';

export type AdminRole = 'SUPER_ADMIN' | 'MANAGER';

export interface AdminUser {
  email: string;
  name: string;
  avatar: string;
  roleType?: AdminRole;
}

export interface AppConfig {
  logoUrl: string; // URL for the logo image (or 'default' for the CSS C letter)
  title: string;   // e.g., "Cóc Sài Gòn"
  subtitle: string; // e.g., "TRAINING MANAGER"
  welcomeTitle: string; // e.g., "Xin chào Cóc Sài Gòn! 👋"
  welcomeDescription: string; // e.g., "Hệ thống training..."
}
