import React, { useState, useEffect, useRef } from 'react';
import { BoardMember, AdminUser, AppConfig, TrainingSession, Department, LocationType, Status } from '../types';
import { getBoardMembers, updateBoardMembers, getAppConfig, updateAppConfig, getSessions, updateAllSessions } from '../services/dataService';
import { Trash2, Plus, Save, LogOut, Shield, Settings, LayoutTemplate, Briefcase, FileSignature, Edit, AlertCircle, Upload, Download, FileSpreadsheet, Clock, CheckCircle2, X, AlertTriangle, FileText, UserCheck, Calendar } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  user: AdminUser;
  onLogout: () => void;
}

interface ImportLog {
  status: 'success' | 'error' | 'warning';
  row: number;
  message: string;
  data?: any;
}

const AdminPanel: React.FC<Props> = ({ user, onLogout }) => {
  // Check if the user is Super Admin or has Editor privileges
  const isSuperAdmin = user.roleType === 'SUPER_ADMIN';
  const isEditor = user.roleType === 'EDITOR' || ['Mentor', 'Trưởng Ban', 'Phó Ban'].includes(user.roleType); // Check if user is Mentor, Trưởng Ban, or Phó Ban

  const [activeTab, setActiveTab] = useState<'members' | 'config' | 'curriculum'>('curriculum');
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [config, setConfig] = useState<AppConfig>({ logoUrl: 'default', title: '', subtitle: '', welcomeTitle: '', welcomeDescription: '' });
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'warning' } | null>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'member' | 'session' | null;
    id: string | null;
  }>({ isOpen: false, type: null, id: null });

  const [showImportModal, setShowImportModal] = useState(false);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [pendingMembers, setPendingMembers] = useState<BoardMember[]>([]);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);

  const [newMember, setNewMember] = useState<Partial<BoardMember>>({ name: '', role: '', email: '', avatar: '' });
  const [newSession, setNewSession] = useState<Partial<TrainingSession>>({
    topic: '',
    department: Department.GENERAL,
    date: '2024-12-07',
    startTime: '08:00',
    duration: 45,
    locationType: LocationType.CLASSROOM,
    requirements: '',
    deadline: '2024-12-05'
  });

  useEffect(() => {
    setMembers(getBoardMembers());
    setConfig(getAppConfig());
    setSessions(getSessions());
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveMembers = () => {
    updateBoardMembers(members);
    showToast('Đã cập nhật danh sách nhân sự thành công!');
  };

  const handleSaveConfig = () => {
    updateAppConfig(config);
    showToast('Đã lưu cấu hình giao diện thành công!');
  }

  const handleSaveSessions = () => {
    updateAllSessions(sessions);
    showToast('Đã cập nhật khung giáo án thành công!');
  }

  // --- Delete Logic with Modal ---
  const promptDeleteMember = (id: string) => {
    setDeleteModal({ isOpen: true, type: 'member', id });
  };

  const confirmDelete = () => {
    if (!deleteModal.id || !deleteModal.type) return;

    if (deleteModal.type === 'member') {
      setMembers(prevMembers => prevMembers.filter(m => m.id !== deleteModal.id));
      showToast('Đã xóa khỏi danh sách hiển thị. Hãy bấm "Lưu Nhân Sự" để hoàn tất.', 'warning');
    } else if (deleteModal.type === 'session') {
      setSessions(prevSessions => prevSessions.filter(s => s.id !== deleteModal.id));
      showToast('Đã xóa slot. Hãy bấm "Lưu Thay Đổi" để hoàn tất.', 'warning');
    }

    setDeleteModal({ isOpen: false, type: null, id: null });
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.role) {
      alert('Vui lòng nhập tên và chức vụ');
      return;
    }
    const id = Date.now().toString();
    const avatarUrl = newMember.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(newMember.name || '')}&background=random&color=fff`;

    setMembers(prev => [...prev, { ...newMember, id, avatar: avatarUrl } as BoardMember]);
    setNewMember({ name: '', role: '', email: '', avatar: '' });
  };

  // Navigation and Access Control
  const handleTabChange = (tab: string) => {
    if (isSuperAdmin || tab === 'curriculum') {
      setActiveTab(tab as 'members' | 'config' | 'curriculum');
    } else {
      setActiveTab('curriculum');
    }
  };

  return (
    <div className="space-y-6 relative pb-10">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] animate-in slide-in-from-bottom-5 duration-300">
          <div className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border ${
            toast.type === 'success' ? 'bg-slate-900 text-white border-slate-700' : 
            toast.type === 'error' ? 'bg-red-50 text-red-900 border-red-200' :
            'bg-yellow-50 text-yellow-900 border-yellow-200'
          }`}>
            <div className={`rounded-full p-1 ${toast.type === 'success' ? 'bg-green-500 text-slate-900' : 
              toast.type === 'error' ? 'bg-red-500 text-white' :
              'bg-yellow-500 text-white'}`}>
              {toast.type === 'success' ? <CheckCircle2 size={16} strokeWidth={3} /> : <AlertTriangle size={16} strokeWidth={3} />}
            </div>
            <div>
              <h4 className="font-bold text-sm">
                {toast.type === 'success' ? 'Thành công!' : toast.type === 'error' ? 'Lỗi!' : 'Lưu ý'}
              </h4>
              <p className="text-xs opacity-90">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="text-red-500" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-1">Xác nhận xóa</h3>
              <p className="text-sm text-slate-500 mb-6">
                {deleteModal.type === 'member' 
                  ? 'Bạn có chắc chắn muốn xóa thành viên này khỏi danh sách? Hành động này không thể hoàn tác nếu bạn đã lưu.' 
                  : 'Bạn có chắc chắn muốn xóa slot training này? Các dữ liệu đi kèm sẽ bị mất.'}
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setDeleteModal({ isOpen: false, type: null, id: null })}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                >
                  Xóa ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-4">
          <img src={user.avatar} alt="Admin" className="w-12 h-12 rounded-full border-2 border-slate-700 shadow-sm" />
          <div>
            <h2 className="font-bold text-lg flex items-center">
              CMS Dashboard
              <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isSuperAdmin ? 'bg-yellow-500 text-slate-900' : 'bg-blue-500 text-white'}`}>
                {isSuperAdmin ? 'Super Admin' : 'Manager'}
              </span>
            </h2>
            <p className="text-slate-400 text-sm">Chào mừng, {user.name}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm font-medium border border-slate-700"
        >
          <LogOut size={16} className="mr-2" /> Đăng xuất
        </button>
      </div>

      {/* Navigation Tabs */}
      {isSuperAdmin ? (
        <div className="flex p-1 bg-white border border-slate-200 rounded-xl w-fit overflow-x-auto shadow-sm">
          <button
            onClick={() => handleTabChange('config')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all ${activeTab === 'config' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutTemplate size={16} className="mr-2" /> Cấu hình Website
          </button>
          <button
            onClick={() => handleTabChange('curriculum')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all ${activeTab === 'curriculum' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Briefcase size={16} className="mr-2" /> Quản lý Khung Giáo Án
          </button>
          <button
            onClick={() => handleTabChange('members')}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all ${activeTab === 'members' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Shield size={16} className="mr-2" /> Quản lý Nhân Sự
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-2 px-1">
          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase shadow-sm">Khu vực quản lý</span>
          <span className="text-slate-600 text-sm font-medium">Bạn có quyền quản lý toàn bộ khung giáo án.</span>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
