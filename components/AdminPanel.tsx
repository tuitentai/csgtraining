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
  const isSuperAdmin = user.roleType === 'SUPER_ADMIN';

  // Default to 'curriculum' if not super admin
  const [activeTab, setActiveTab] = useState<'members' | 'config' | 'curriculum'>('curriculum');
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [config, setConfig] = useState<AppConfig>({ logoUrl: 'default', title: '', subtitle: '', welcomeTitle: '', welcomeDescription: '' });
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Toast State
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
      isOpen: boolean;
      type: 'member' | 'session' | null;
      id: string | null;
  }>({ isOpen: false, type: null, id: null });

  // Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [pendingMembers, setPendingMembers] = useState<BoardMember[]>([]);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);

  // Forms
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

  // =========================
  // FIX LỖI: dùng async/await
  // =========================
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        if (!isSuperAdmin) setActiveTab('curriculum');
        const [m, c, s] = await Promise.all([
          getBoardMembers(),   // await
          getAppConfig(),      // await
          getSessions()        // await
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

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
  };

  // =========================
  // FIX LỖI: các hàm save dùng await
  // =========================
  const handleSaveMembers = async () => {
    try {
      await updateBoardMembers(members);
      showToast('Đã cập nhật danh sách nhân sự thành công!');
    } catch (e) {
      console.error(e);
      showToast('Lưu nhân sự thất bại.', 'error');
    }
  };

  const handleSaveConfig = async () => {
    try {
      await updateAppConfig(config);
      showToast('Đã lưu cấu hình giao diện thành công!');
    } catch (e) {
      console.error(e);
      showToast('Lưu cấu hình thất bại.', 'error');
    }
  };

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

      {/* IMPORT REPORT MODAL */}
      {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
                  <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                      <div>
                          <h3 className="font-bold text-lg text-slate-800 flex items-center">
                              <FileText className="mr-2 text-green-600" size={20}/> Kết quả đọc File
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">Hệ thống đã phân tích file của bạn. Vui lòng kiểm tra trước khi nhập.</p>
                      </div>
                      <button onClick={() => setShowImportModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto flex-1 space-y-6">
                        {/* Headers Detected */}
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Các cột tìm thấy trong file:</h4>
                            <div className="flex flex-wrap gap-2">
                                {detectedHeaders.length > 0 ? detectedHeaders.map((h, i) => (
                                    <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-600 shadow-sm">{h}</span>
                                )) : <span className="text-red-500 text-xs italic">Không tìm thấy tiêu đề cột nào</span>}
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-green-50 border border-green-100 p-3 rounded-xl text-center">
                                <span className="block text-2xl font-bold text-green-600">{pendingMembers.length}</span>
                                <span className="text-xs font-bold text-green-800 uppercase">Hợp lệ</span>
                            </div>
                            <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-center">
                                <span className="block text-2xl font-bold text-red-600">{importLogs.filter(l => l.status === 'error').length}</span>
                                <span className="text-xs font-bold text-red-800 uppercase">Lỗi</span>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-xl text-center">
                                <span className="block text-2xl font-bold text-yellow-600">{importLogs.filter(l => l.status === 'warning').length}</span>
                                <span className="text-xs font-bold text-yellow-800 uppercase">Cảnh báo</span>
                            </div>
                        </div>

                        {/* Log Detail Table */}
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-3 w-16 text-center">Dòng</th>
                                        <th className="px-4 py-3 w-24">Trạng thái</th>
                                        <th className="px-4 py-3">Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {importLogs.map((log, idx) => (
                                        <tr key={idx} className={log.status === 'error' ? 'bg-red-50/30' : ''}>
                                            <td className="px-4 py-2 text-center text-slate-400 font-mono text-xs">{log.row}</td>
                                            <td className="px-4 py-2">
                                                {log.status === 'success' && <span className="text-green-600 font-bold text-xs flex items-center"><CheckCircle2 size={12} className="mr-1"/> OK</span>}
                                                {log.status === 'error' && <span className="text-red-600 font-bold text-xs flex items-center"><X size={12} className="mr-1"/> Lỗi</span>}
                                                {log.status === 'warning' && <span className="text-yellow-600 font-bold text-xs flex items-center"><AlertCircle size={12} className="mr-1"/> Lưu ý</span>}
                                            </td>
                                            <td className="px-4 py-2 text-slate-700">{log.message}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                  </div>

                  <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                        <button 
                            onClick={() => setShowImportModal(false)}
                            className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm"
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            onClick={confirmImport}
                            disabled={pendingMembers.length === 0}
                            className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-lg disabled:opacity-50 disabled:shadow-none transition-all text-sm flex items-center"
                        >
                            <UserCheck size={16} className="mr-2"/>
                            Xác nhận nhập {pendingMembers.length} thành viên
                        </button>
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

      {/* Navigation Tabs - Hide restricted tabs for regular Managers */}
      {isSuperAdmin ? (
        <div className="flex p-1 bg-white border border-slate-200 rounded-xl w-fit overflow-x-auto shadow-sm">
            <button
                onClick={() => setActiveTab('config')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all ${activeTab === 'config' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <LayoutTemplate size={16} className="mr-2"/> Cấu hình Website
            </button>
            <button
                onClick={() => setActiveTab('curriculum')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all ${activeTab === 'curriculum' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Briefcase size={16} className="mr-2"/> Quản lý Khung Giáo Án
            </button>
            <button
                onClick={() => setActiveTab('members')}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all ${activeTab === 'members' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Shield size={16} className="mr-2"/> Quản lý Nhân Sự
            </button>
        </div>
      ) : (
          /* For Managers, just show a label since they only have one tab */
          <div className="flex items-center space-x-2 px-1">
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase shadow-sm">Khu vực quản lý</span>
              <span className="text-slate-600 text-sm font-medium">Bạn có quyền quản lý toàn bộ khung giáo án.</span>
          </div>
      )}

      {/* Config Panel - SUPER ADMIN ONLY */}
      {activeTab === 'config' && isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-lg text-slate-800 flex items-center">
                    <Settings className="mr-2 text-purple-500" size={20}/> Cấu hình giao diện
                </h3>
                <button 
                    onClick={handleSaveConfig}
                    className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-bold shadow-md shadow-purple-200"
                >
                    <Save size={16} className="mr-2" /> Lưu Cấu Hình
                </button>
            </div>
            <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* General Settings */}
                    <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center"><LayoutTemplate size={16} className="mr-2 text-purple-500"/> Thông tin chung</h4>
                        <div className="grid md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Tên Website (Title)</label>
                                <input 
                                    type="text" 
                                    value={config.title}
                                    onChange={(e) => setConfig({...config, title: e.target.value})}
                                    className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all shadow-sm"
                                    placeholder="Cóc Sài Gòn"
                                />
                                <p className="text-xs text-slate-400">Tên chính hiển thị trên sidebar và header.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Tagline (Subtitle)</label>
                                <input 
                                    type="text" 
                                    value={config.subtitle}
                                    onChange={(e) => setConfig({...config, subtitle: e.target.value})}
                                    className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all shadow-sm"
                                    placeholder="TRAINING MANAGER"
                                />
                                <p className="text-xs text-slate-400">Dòng chữ nhỏ bên dưới tiêu đề chính.</p>
                            </div>
                        </div>
                    </div>

                    {/* Dashboard Welcome */}
                    <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="text-sm font-bold text-slate-800 uppercase mb-4 flex items-center"><CheckCircle2 size={16} className="mr-2 text-green-500"/> Lời chào Dashboard (Tổng quan)</h4>
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Tiêu đề Lời chào</label>
                                <input 
                                    type="text" 
                                    value={config.welcomeTitle || ''}
                                    onChange={(e) => setConfig({...config, welcomeTitle: e.target.value})}
                                    className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all shadow-sm font-bold text-lg"
                                    placeholder="Xin chào Cóc Sài Gòn! 👋"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700">Mô tả / Thông điệp</label>
                                <textarea 
                                    value={config.welcomeDescription || ''}
                                    onChange={(e) => setConfig({...config, welcomeDescription: e.target.value})}
                                    className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-800 focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all shadow-sm h-24 resize-none"
                                    placeholder="Hệ thống training chuyên nghiệp..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Logo Website</label>
                         <div className="flex gap-4 items-start">
                            <div className="flex-1">
                                <div className="flex gap-2">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        id="logo-upload"
                                        className="hidden"
                                        onChange={handleLogoUpload}
                                    />
                                    <label 
                                        htmlFor="logo-upload"
                                        className="flex items-center px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer text-sm font-medium shadow-sm transition-colors"
                                    >
                                        <Upload size={16} className="mr-2"/> Tải ảnh lên
                                    </label>
                                    <button 
                                        onClick={() => setConfig({...config, logoUrl: 'default'})}
                                        className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm font-medium transition-colors"
                                    >
                                        Dùng mặc định
                                    </button>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Hỗ trợ định dạng PNG, JPG. Ảnh nên có nền trong suốt.</p>
                            </div>
                            <div className="w-20 h-20 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1">
                                {config.logoUrl === 'default' || !config.logoUrl ? (
                                    <span className="font-bold text-slate-400 text-2xl">C</span>
                                ) : (
                                    <img src={config.logoUrl} alt="Preview" className="w-full h-full object-contain" />
                                )}
                            </div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Curriculum Manager Panel - AVAILABLE TO BOTH - FULL ACCESS */}
      {activeTab === 'curriculum' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-50/50 gap-4">
                <div>
                    <h3 className="font-bold text-lg text-slate-800 flex items-center">
                        <FileSignature className="mr-2 text-blue-500" size={20}/> Quản lý Khung Giáo Án
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Soạn thảo các slot training, thời gian, địa điểm và yêu cầu nội dung.
                    </p>
                </div>
                <button 
                    onClick={handleSaveSessions}
                    className="flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors text-sm font-bold shadow-md shadow-blue-200"
                >
                    <Save size={18} className="mr-2" /> Lưu Thay Đổi
                </button>
              </div>

              <div className="p-6">
                <div className="space-y-8">
                    {/* Add New Slot */}
                    <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 shadow-sm">
                        <h4 className="font-bold text-sm text-blue-800 mb-4 uppercase tracking-wide flex items-center">
                            <Plus size={16} className="mr-2"/> Thêm Slot Training Mới
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Tên bài Training</label>
                                <input 
                                    placeholder="Nhập tên bài..." 
                                    className="w-full bg-white border border-blue-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm"
                                    value={newSession.topic}
                                    onChange={e => setNewSession({...newSession, topic: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Ban Chuyên Môn</label>
                                <select 
                                    className="w-full bg-white border border-blue-200 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm cursor-pointer"
                                    value={newSession.department}
                                    onChange={e => setNewSession({...newSession, department: e.target.value as Department})}
                                >
                                    {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Ngày diễn ra</label>
                                <input 
                                    type="date"
                                    className="w-full bg-white border border-blue-200 rounded-lg px-2 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm"
                                    value={newSession.date}
                                    onChange={e => setNewSession({...newSession, date: e.target.value})}
                                />
                            </div>
                            
                            <div className="col-span-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Bắt đầu lúc</label>
                                        <input 
                                            type="time"
                                            className="w-full bg-white border border-blue-200 rounded-lg px-2 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm"
                                            value={newSession.startTime}
                                            onChange={e => setNewSession({...newSession, startTime: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Thời lượng (Giờ : Phút)</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                className="w-full bg-white border border-blue-200 rounded-lg px-2 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 outline-none shadow-sm text-center"
                                                value={Math.floor((newSession.duration || 0) / 60)}
                                                onChange={e => {
                                                    const h = parseInt(e.target.value) || 0;
                                                    const m = (newSession.duration || 0) % 60;
                                                    setNewSession({...newSession, duration: h * 60 + m});
                                                }}
                                            />
                                            <span className="self-center font-bold text-slate-400">:</span>
                                            <input 
                                                type="number"
                                                min="0"
                                                max="59"
                                                placeholder="45"
                                                className="w-full bg-white border border-blue-200 rounded-lg px-2 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 outline-none shadow-sm text-center"
                                                value={(newSession.duration || 0) % 60}
                                                onChange={e => {
                                                    const h = Math.floor((newSession.duration || 0) / 60);
                                                    const m = parseInt(e.target.value) || 0;
                                                    setNewSession({...newSession, duration: h * 60 + m});
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Deadline Nộp</label>
                                        <input 
                                            type="date"
                                            className="w-full bg-white border border-blue-200 rounded-lg px-2 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm"
                                            value={newSession.deadline}
                                            onChange={e => setNewSession({...newSession, deadline: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Người Duyệt</label>
                                        <select
                                            className="w-full bg-white border border-blue-200 rounded-lg px-2 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 outline-none cursor-pointer"
                                            value={newSession.reviewerName}
                                            onChange={e => setNewSession({...newSession, reviewerName: e.target.value})}
                                        >
                                            <option value="">Chọn người duyệt...</option>
                                            {members
                                              .filter(m => 
                                                m.role.toLowerCase().includes('trưởng') || 
                                                m.role.toLowerCase().includes('phó') || 
                                                m.role.toLowerCase().includes('chủ nhiệm') ||
                                                m.role.toLowerCase().includes('mentor')
                                              )
                                              .map(m => <option key={m.id} value={m.name}>{m.name} ({m.role})</option>)
                                            }
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-4 flex gap-3 items-end">
                                <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 mb-1 ml-1">Yêu cầu nội dung (Requirements)</label>
                                        <input
                                        placeholder="Nhập yêu cầu tối thiểu..."
                                        className="w-full bg-white border border-blue-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm"
                                        value={newSession.requirements}
                                        onChange={e => setNewSession({...newSession, requirements: e.target.value})}
                                    />
                                </div>
                                <button 
                                    onClick={handleAddSession}
                                    className="h-[42px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-md shadow-blue-200 active:scale-95 flex items-center justify-center shrink-0"
                                >
                                    <Plus size={18} className="mr-2"/> Thêm Mới
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* List Existing */}
                    <div className="space-y-4">
                        {sessions.map((session) => {
                             const h = Math.floor(session.duration / 60);
                             const m = session.duration % 60;

                             return (
                                <div key={session.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 group relative">
                                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button 
                                            type="button"
                                            onClick={() => promptDeleteSession(session.id)} 
                                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                            title="Xóa slot này"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                        <div className="md:col-span-4 space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Chủ đề (Topic) & Ban</label>
                                            <input 
                                                value={session.topic}
                                                onChange={(e) => handleUpdateSession(session.id, 'topic', e.target.value)}
                                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm"
                                            />
                                            <select 
                                                value={session.department}
                                                onChange={(e) => handleUpdateSession(session.id, 'department', e.target.value)}
                                                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 focus:border-blue-500 outline-none shadow-sm mt-2"
                                            >
                                                {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>

                                        <div className="md:col-span-4 space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center">
                                                <Clock size={12} className="mr-1"/> Thời gian & Địa điểm
                                            </label>
                                            <div className="flex gap-2 items-center">
                                                <div className="relative flex-[2]">
                                                    <input type="date" value={session.date} onChange={e => handleUpdateSession(session.id, 'date', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none shadow-sm"/>
                                                </div>
                                                <div className="relative flex-1 min-w-[80px]">
                                                    <input type="time" value={session.startTime} onChange={e => handleUpdateSession(session.id, 'startTime', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm text-slate-800 focus:border-blue-500 outline-none shadow-sm"/>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 items-center mt-2">
                                                {/* Duration Split */}
                                                <div className="flex gap-1 items-center bg-slate-50 border border-slate-300 rounded-lg p-1">
                                                    <input 
                                                        type="number" 
                                                        className="w-8 bg-transparent text-center text-xs font-bold outline-none"
                                                        value={h}
                                                        onChange={(e) => {
                                                            const newH = parseInt(e.target.value) || 0;
                                                            handleUpdateSession(session.id, 'duration', newH * 60 + m);
                                                        }}
                                                    />
                                                    <span className="text-[10px] text-slate-400">h</span>
                                                    <input 
                                                        type="number" 
                                                        className="w-8 bg-transparent text-center text-xs font-bold outline-none"
                                                        value={m}
                                                        onChange={(e) => {
                                                            const newM = parseInt(e.target.value) || 0;
                                                            handleUpdateSession(session.id, 'duration', h * 60 + newM);
                                                        }}
                                                    />
                                                    <span className="text-[10px] text-slate-400">p</span>
                                                </div>

                                                <select value={session.locationType} onChange={e => handleUpdateSession(session.id, 'locationType', e.target.value)} className="bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-800 focus:border-blue-500 outline-none shadow-sm flex-1">
                                                    <option value={LocationType.CLASSROOM}>{LocationType.CLASSROOM}</option>
                                                    <option value={LocationType.HALL}>{LocationType.HALL}</option>
                                                </select>
                                                <input placeholder="Số phòng..." value={session.locationDetail} onChange={e => handleUpdateSession(session.id, 'locationDetail', e.target.value)} className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 w-24 focus:border-blue-500 outline-none shadow-sm"/>
                                            </div>
                                        </div>

                                        <div className="md:col-span-4 space-y-2">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center justify-between">
                                                <span className="flex items-center"><Edit size={12} className="mr-1"/> Yêu cầu & Deadline</span>
                                            </label>
                                            <div className="flex gap-2 mb-2">
                                                 <div className="relative flex-1">
                                                     <input 
                                                        type="date"
                                                        value={session.deadline || ''}
                                                        onChange={e => handleUpdateSession(session.id, 'deadline', e.target.value)}
                                                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                                                     />
                                                 </div>
                                                 <div className="flex-1">
                                                    <select
                                                        className="w-full bg-white border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-800 focus:border-blue-500 outline-none shadow-sm"
                                                        value={session.reviewerName}
                                                        onChange={e => handleUpdateSession(session.id, 'reviewerName', e.target.value)}
                                                    >
                                                        <option value="">Chọn người duyệt...</option>
                                                        {members
                                                          .filter(m => 
                                                            m.role.toLowerCase().includes('trưởng') || 
                                                            m.role.toLowerCase().includes('phó') || 
                                                            m.role.toLowerCase().includes('chủ nhiệm') ||
                                                            m.role.toLowerCase().includes('mentor')
                                                          )
                                                          .map(m => <option key={m.id} value={m.name}>{m.name}</option>)
                                                        }
                                                    </select>
                                                 </div>
                                            </div>
                                            <textarea 
                                                value={session.requirements}
                                                onChange={(e) => handleUpdateSession(session.id, 'requirements', e.target.value)}
                                                className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-700 h-[52px] resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all shadow-sm"
                                                placeholder="Nhập yêu cầu chi tiết..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
              </div>
          </div>
      )}

      {/* Board Management Section - SUPER ADMIN ONLY */}
      {activeTab === 'members' && isSuperAdmin && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-lg text-slate-800 flex items-center">
                <Shield className="mr-2 text-orange-500" size={20}/> Quản lý Ban Điều Hành
            </h3>
            <button 
                onClick={handleSaveMembers}
                className="flex items-center px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors text-sm font-bold shadow-md shadow-green-200"
            >
                <Save size={18} className="mr-2" /> Lưu Nhân Sự
            </button>
            </div>
            
            <div className="p-6 space-y-6">
                {/* Import Section */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-green-100 p-5 rounded-xl">
                    <h4 className="font-bold text-green-800 mb-3 flex items-center text-sm uppercase tracking-wide">
                        <FileSpreadsheet className="mr-2" size={18}/> Nhập dữ liệu hàng loạt
                    </h4>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 text-sm text-green-700">
                            Bạn có thể nhập danh sách nhân sự từ file <strong>Excel (.xlsx)</strong> hoặc <strong>CSV</strong>.
                            <br/>
                            File cần có các cột: <strong>Name, Role, Email</strong>.
                            <br/>
                            <span className="text-xs opacity-75 italic mt-1 block">Mẹo: Nếu dùng Google Sheet, hãy chọn File {'>'} Download {'>'} Microsoft Excel (.xlsx) rồi tải lên đây.</span>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <button 
                                onClick={handleDownloadTemplate}
                                className="flex items-center px-4 py-2 bg-white border border-green-200 text-green-700 rounded-lg hover:bg-green-50 text-xs font-bold transition-colors shadow-sm"
                            >
                                <Download size={14} className="mr-1.5"/> Tải file mẫu
                            </button>
                            <div className="relative">
                                <input 
                                    type="file" 
                                    accept=".xlsx, .xls, .csv" 
                                    className="hidden" 
                                    id="file-upload"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                                <label 
                                    htmlFor="file-upload"
                                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer text-xs font-bold transition-colors shadow-sm"
                                >
                                    <Upload size={14} className="mr-1.5"/> Tải lên Excel/CSV
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add New Member */}
                <div className="flex flex-col md:flex-row gap-4 p-5 bg-slate-50 border border-slate-100 rounded-xl">
                    <input 
                        placeholder="Tên thành viên..." 
                        value={newMember.name}
                        onChange={e => setNewMember({...newMember, name: e.target.value})}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all shadow-sm"
                    />
                    <input 
                        placeholder="Chức vụ..." 
                        value={newMember.role}
                        onChange={e => setNewMember({...newMember, role: e.target.value})}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all shadow-sm"
                    />
                    <input 
                        placeholder="Email (Quan trọng để cấp quyền)..." 
                        value={newMember.email}
                        onChange={e => setNewMember({...newMember, email: e.target.value})}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all shadow-sm"
                    />
                    <button 
                        onClick={handleAddMember}
                        className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition-all shadow-md active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={18} className="inline mr-1"/> Thêm
                    </button>
                </div>
                
                {/* List Members */}
                <div className="space-y-3">
                    {members.map(member => (
                        <div key={member.id} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-shadow group">
                            <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full border border-slate-200" />
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                <input 
                                    value={member.name}
                                    onChange={(e) => handleUpdateMember(member.id, 'name', e.target.value)}
                                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-green-500 px-2 py-1 outline-none text-slate-800 font-bold text-sm transition-colors"
                                />
                                <input 
                                    value={member.role}
                                    onChange={(e) => handleUpdateMember(member.id, 'role', e.target.value)}
                                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-green-500 px-2 py-1 outline-none text-orange-600 font-medium text-xs transition-colors"
                                />
                                <input 
                                    value={member.email}
                                    onChange={(e) => handleUpdateMember(member.id, 'email', e.target.value)}
                                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-green-500 px-2 py-1 outline-none text-slate-500 text-xs transition-colors"
                                />
                            </div>
                            <button 
                                type="button"
                                onClick={() => promptDeleteMember(member.id)}
                                className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa thành viên"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                    {members.length === 0 && (
                        <div className="text-center py-8 text-slate-400 italic">Danh sách trống</div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
