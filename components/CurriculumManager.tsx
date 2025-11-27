import React, { useState, useEffect } from 'react';
import { TrainingSession, Status, Department, BoardMember } from '../types';
import { getSessions, updateSession, getBoardMembers, subscribeDataChanges } from '../services/dataService'; // 🔥 thêm subscribeDataChanges để realtime
import { Edit2, Save, ExternalLink, CheckCircle2, Clock, AlertCircle, Sparkles, ChevronDown, ListFilter, Calendar, Timer } from 'lucide-react';
import GeminiAssistant from './GeminiAssistant';

const CurriculumManager: React.FC = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TrainingSession>>({});
  
  // AI Assistant State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiContext, setAiContext] = useState({ topic: '', reqs: '' });

  // 🔥 Khi khởi tạo: lấy dữ liệu từ Firestore + lắng nghe thay đổi realtime
  useEffect(() => {
    setSessions(getSessions());
    setBoardMembers(getBoardMembers());

    // Khi Firestore thay đổi, cập nhật lại state
    subscribeDataChanges(() => {
      setSessions(getSessions());
      setBoardMembers(getBoardMembers());
    });
  }, []);

  const handleEditClick = (session: TrainingSession) => {
    setEditingId(session.id);
    setEditForm({ ...session });
  };

  // 🔥 Khi bấm Lưu: ghi trực tiếp lên Firestore
  const handleSaveClick = () => {
    if (editingId && editForm) {
      const original = sessions.find(s => s.id === editingId);
      if (original) {
        const updated = { ...original, ...editForm } as TrainingSession;
        updateSession(updated); // 🔥 ghi lên Firestore
        setSessions(prev => prev.map(s => s.id === editingId ? updated : s));
        setEditingId(null);
      }
    }
  };

  const handleChange = (field: keyof TrainingSession, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const openAiHelper = (topic: string, requirements: string) => {
      setAiContext({ topic, reqs: requirements });
      setIsAiOpen(true);
  };

  // Helper to format date DD-MM-YYYY
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  // Filter reviewers based on role
  const potentialReviewers = boardMembers.filter(m => 
    m.role.toLowerCase().includes('trưởng') || 
    m.role.toLowerCase().includes('phó') || 
    m.role.toLowerCase().includes('chủ nhiệm') ||
    m.role.toLowerCase().includes('mentor')
  );

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case Status.APPROVED:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200"><CheckCircle2 size={12} className="mr-1.5"/> Đã Duyệt</span>;
      case Status.CHECKING:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><Clock size={12} className="mr-1.5"/> Đang KT</span>;
      case Status.REVISION:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><AlertCircle size={12} className="mr-1.5"/> Chỉnh Lại</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">Chưa Nộp</span>;
    }
  };

  const formatDuration = (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      if (h > 0 && m > 0) return `${h}h ${m}p`;
      if (h > 0) return `${h}h`;
      return `${m}p`;
  };

  const checkDeadlineStatus = (deadline: string, status: Status) => {
      if (!deadline) return null;
      if (status === Status.APPROVED) return <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded ml-2">Đúng hạn</span>;
      
      const today = new Date();
      const deadlineDate = new Date(deadline);
      today.setHours(0,0,0,0);
      deadlineDate.setHours(0,0,0,0);

      if (today > deadlineDate) {
          return <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded ml-2">Trễ hạn</span>;
      }
      if (today.getTime() === deadlineDate.getTime()) {
        return <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded ml-2">Hôm nay</span>;
      }
      return null;
  };

  const filteredSessions = activeTab === 'ALL' 
    ? sessions 
    : sessions.filter(s => s.department === activeTab);

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: Department.GENERAL, label: 'General' },
    { id: Department.MEDIA, label: 'Ban Media' },
    { id: Department.EVENT, label: 'Ban Event' },
    { id: Department.ER, label: 'Ban ER' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Quản Lý Giáo Án</h2>
            <p className="text-sm text-slate-500 mt-1">Theo dõi tiến độ và nộp giáo trình đúng hạn</p>
        </div>
        
        <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                        activeTab === tab.id 
                        ? 'bg-orange-50 text-orange-700 shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Chủ đề & Thời lượng</th>
                <th className="px-6 py-4">Deadline & Người Duyệt</th>
                <th className="px-6 py-4">Nội dung</th>
                <th className="px-6 py-4">Trạng Thái</th>
                <th className="px-6 py-4 text-center">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.map((session) => {
                const isEditing = editingId === session.id;
                const hours = Math.floor((editForm.duration || 0) / 60);
                const minutes = (editForm.duration || 0) % 60;

                return (
                  <tr key={session.id} className="group hover:bg-orange-50/30 transition-colors">
                    {/* Topic & Duration */}
                    <td className="px-6 py-4 align-top w-1/4">
                      <div className="font-bold text-slate-800 text-base mb-1">{session.topic}</div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500">
                            {session.department}
                        </span>
                      </div>
                      
                      {isEditing ? (
                          <div className="mt-2 bg-slate-50 p-2 rounded border border-slate-200">
                              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Chỉnh thời lượng</label>
                              <div className="flex gap-2">
                                  <div className="relative flex-1">
                                      <input 
                                        type="number"
                                        min="0"
                                        className="w-full bg-white border border-slate-200 rounded px-1 py-1 text-xs text-slate-800 pr-4"
                                        value={hours}
                                        onChange={(e) => {
                                            const newH = parseInt(e.target.value) || 0;
                                            handleChange('duration', newH * 60 + minutes);
                                        }}
                                      />
                                      <span className="absolute right-1 top-1 text-[10px] text-slate-400">h</span>
                                  </div>
                                  <div className="relative flex-1">
                                      <input 
                                        type="number"
                                        min="0"
                                        max="59"
                                        className="w-full bg-white border border-slate-200 rounded px-1 py-1 text-xs text-slate-800 pr-4"
                                        value={minutes}
                                        onChange={(e) => {
                                            const newM = parseInt(e.target.value) || 0;
                                            handleChange('duration', hours * 60 + newM);
                                        }}
                                      />
                                      <span className="absolute right-1 top-1 text-[10px] text-slate-400">p</span>
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="flex items-center text-xs text-slate-500 font-medium">
                              <Timer size={12} className="mr-1"/> 
                              Thời lượng: <span className="text-slate-800 ml-1 font-bold">{formatDuration(session.duration)}</span>
                          </div>
                      )}
                    </td>

                    {/* Deadline & People */}
                    <td className="px-6 py-4 align-top w-1/5">
                      {/* ... Giữ nguyên phần còn lại ... */}
                    </td>

                    {/* Content, Status, Actions ... (giữ nguyên y chang như bản bạn gửi) */}
                  </tr>
                );
              })}

              {filteredSessions.length === 0 && (
                <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center">
                            <ListFilter size={48} className="mb-3 opacity-20"/>
                            <p>Không có giáo án nào trong mục này.</p>
                        </div>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GeminiAssistant 
        isOpen={isAiOpen} 
        onClose={() => setIsAiOpen(false)} 
        initialTopic={aiContext.topic}
        initialRequirements={aiContext.reqs}
      />
    </div>
  );
};

export default CurriculumManager;
