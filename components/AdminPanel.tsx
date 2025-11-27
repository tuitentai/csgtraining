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
  // Kiểm tra nếu là admin chính
  const isSuperAdmin = user.email === 'thanhtailai2003@gmail.com';

  // Tab hiện tại của admin
  const [activeTab, setActiveTab] = useState<'members' | 'config' | 'curriculum'>('curriculum');
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [config, setConfig] = useState<AppConfig>({ logoUrl: 'default', title: '', subtitle: '', welcomeTitle: '', welcomeDescription: '' });
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Trạng thái thông báo
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);

  // Trạng thái xóa
  const [deleteModal, setDeleteModal] = useState<{
      isOpen: boolean;
      type: 'member' | 'session' | null;
      id: string | null;
  }>({ isOpen: false, type: null, id: null });

  // Trạng thái nhập khẩu
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [pendingMembers, setPendingMembers] = useState<BoardMember[]>([]);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);

  // Form thêm nhân sự và giáo án
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

  // Load dữ liệu khi component được mount
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        if (!isSuperAdmin) setActiveTab('curriculum');
        const [m, c, s] = await Promise.all([
          getBoardMembers(),
          getAppConfig(),
          getSessions()
        ]);
        if (!mounted) return;
        setMembers(m);
        setConfig(c);
        setSessions(s);
      } catch (err) {
        console.error(err);
        setToast({ message: 'Không tải được dữ liệu từ Firestore.', type: 'error' });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [isSuperAdmin]);

  // Hiển thị thông báo
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
  };

  // Lưu nhân sự mới
  const handleSaveMembers = async () => {
    try {
      await updateBoardMembers(members);
      showToast('Đã cập nhật danh sách nhân sự thành công!');
    } catch (e) {
      console.error(e);
      showToast('Lưu nhân sự thất bại.', 'error');
    }
  };

  // Lưu cấu hình
  const handleSaveConfig = async () => {
    try {
      await updateAppConfig(config);
      showToast('Đã lưu cấu hình giao diện thành công!');
    } catch (e) {
      console.error(e);
      showToast('Lưu cấu hình thất bại.', 'error');
    }
  };

  // Lưu giáo án
  const handleSaveSessions = async () => {
    try {
      await updateAllSessions(sessions);
      showToast('Đã cập nhật khung giáo án thành công!');
    } catch (e) {
      console.error(e);
      showToast('Lưu khung giáo án thất bại.', 'error');
    }
  };

  // --- Delete Logic with Modal ---
  const promptDeleteMember = (id: string) => {
      setDeleteModal({ isOpen: true, type: 'member', id });
  };

  const promptDeleteSession = (id: string) => {
      setDeleteModal({ isOpen: true, type: 'session', id });
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

  const handleUpdateMember = (id: string, field: keyof BoardMember, value: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  // --- Import Logic ---
  const handleDownloadTemplate = () => {
      const ws = XLSX.utils.json_to_sheet([
          { Name: 'Nguyen Van A', Role: 'Chu Nhiem', Email: 'chunhiem@cocsaigon.vn' },
          { Name: 'Tran Thi B', Role: 'Truong Ban Event', Email: 'event@cocsaigon.vn' },
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, "Template_NhanSu.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    
    reader.onload = (evt) => {
        try {
            const data = evt.target?.result;
            const wb = XLSX.read(data as ArrayBuffer, { type: 'array' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            
            // Get raw data (array of arrays) to detect headers
            const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
            if (rawData.length > 0) {
                setDetectedHeaders(rawData[0].map(String));
            }

            const jsonData = XLSX.utils.sheet_to_json(ws);
            
            const logs: ImportLog[] = [];
            const validMembers: BoardMember[] = [];

            if (jsonData.length === 0) {
                logs.push({ status: 'error', row: 0, message: 'File rỗng hoặc không đọc được dữ liệu.' });
            }

            const getValue = (row: any, potentialKeys: string[]) => {
                const keys = Object.keys(row);
                const foundKey = keys.find(k => potentialKeys.includes(k.trim().toLowerCase()));
                return foundKey ? row[foundKey] : undefined;
            };

            jsonData.forEach((row: any, index: number) => {
                const rowNum = index + 2; // +1 for header, +1 for 0-index
                
                const name = getValue(row, ['name', 'họ tên', 'tên', 'full name', 'fullname', 'tên thành viên']);
                const role = getValue(row, ['role', 'chức vụ', 'position', 'vị trí', 'ban']);
                const email = getValue(row, ['email', 'mail', 'thư điện tử', 'gmail']);

                if (!name) {
                    logs.push({ status: 'error', row: rowNum, message: 'Thiếu thông tin cột Tên (Name/Họ Tên).' });
                    return;
                }
                
                if (!role) {
                    logs.push({ status: 'warning', row: rowNum, message: `Thành viên "${name}" thiếu chức vụ. Đã set mặc định là "Thành viên".` });
                }

                if (!email) {
                    logs.push({ status: 'warning', row: rowNum, message: `Thành viên "${name}" thiếu Email. Sẽ không thể cấp quyền.` });
                }

                validMembers.push({
                    id: `imp-${Date.now()}-${index}`,
                    name: String(name),
                    role: role ? String(role) : 'Thành viên',
                    email: email ? String(email) : '',
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(String(name))}&background=random&color=fff`
                });

                logs.push({ status: 'success', row: rowNum, message: `Đã đọc thành công: ${name}` });
            });

            setImportLogs(logs);
            setPendingMembers(validMembers);
            setShowImportModal(true);

        } catch (error) {
            console.error(error);
            showToast('Lỗi nghiêm trọng khi đọc file Excel.', 'error');
        }
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    
    reader.readAsArrayBuffer(file);
  };

  const confirmImport = () => {
      setMembers(prev => [...prev, ...pendingMembers]);
      setShowImportModal(false);
      setPendingMembers([]);
      setImportLogs([]);
      showToast(`Đã thêm thành công ${pendingMembers.length} thành viên!`, 'success');
  };

  // --- Logo Upload --- 
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
          if (typeof reader.result === 'string') {
              setConfig(prev => ({ ...prev, logoUrl: reader.result as string }));
          }
      };
      reader.readAsDataURL(file);
  };

  // --- Session Logic ---
  const handleAddSession = () => {
      if(!newSession.topic) {
          alert("Vui lòng nhập tên bài Training");
          return;
      }
      const id = 'sess-' + Date.now().toString();
      const sessionToAdd: TrainingSession = {
          id,
          topic: newSession.topic || 'New Topic',
          department: newSession.department || Department.GENERAL,
          trainerName: '',
          materialsLink: '',
          requirements: newSession.requirements || '',
          status: Status.PENDING,
          reviewerName: newSession.reviewerName || 'Ban Kiểm Soát',
          date: newSession.date || '2024-12-07',
          startTime: newSession.startTime || '08:00',
          duration: newSession.duration || 45,
          locationType: newSession.locationType || LocationType.CLASSROOM,
          locationDetail: '',
          deadline: newSession.deadline || '2024-12-05'
      };

      setSessions(prev => [...prev, sessionToAdd]);
      setNewSession({
        topic: '',
        department: Department.GENERAL,
        date: '2024-12-07',
        startTime: '08:00',
        duration: 45,
        locationType: LocationType.CLASSROOM,
        requirements: '',
        reviewerName: '',
        deadline: '2024-12-05'
      });
      showToast('Đã thêm slot training mới. Hãy bấm "Lưu Thay Đổi" để hoàn tất.', 'success');
  };

  const handleUpdateSession = (id: string, field: keyof TrainingSession, value: any) => {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // Filter possible reviewers
  const potentialReviewers = members.filter(m => 
    m.role.toLowerCase().includes('trưởng') || 
    m.role.toLowerCase().includes('phó') || 
    m.role.toLowerCase().includes('chủ nhiệm') ||
    m.role.toLowerCase().includes('mentor')
  );

  // Loading guard – tránh render khi data chưa có
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse text-slate-400 text-sm">Đang tải dữ liệu...</div>
      </div>
    );
  }

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
                <div className={`rounded-full p-1 ${
                    toast.type === 'success' ? 'bg-green-500 text-slate-900' : 
                    toast.type === 'error' ? 'bg-red-500 text-white' :
                    'bg-yellow-500 text-white'
                }`}>
                    {toast.type === 'success' ? <CheckCircle2 size={16} strokeWidth={3} /> : <AlertTriangle size={16} strokeWidth={3} />}
                </div>
                <div>
                    <h4 className="font-bold text-sm">
                        {toast.type === 'success' ? 'Thành công!' : toast.type === 'error' ? 'Lỗi!' : 'Lưu ý'}
                    </h4>
                    <p className="text-xs opacity-90">{toast.message}</p>
                </div>
                <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
                    <X size={16}/>
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
                              : 'Bạn có chắc chắn muốn xóa slot training này? Các dữ liệu đi kèm sẽ bị mất.'
                          }
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
