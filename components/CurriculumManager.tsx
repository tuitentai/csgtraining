import React, { useState, useEffect } from 'react';
import { TrainingSession, Status, Department, BoardMember } from '../types';
import { getSessions, updateSession, getBoardMembers, subscribeDataChanges } from '../services/dataService';
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

  // 🔥 Lấy dữ liệu realtime từ Firestore
  useEffect(() => {
    setSessions(getSessions());
    setBoardMembers(getBoardMembers());

    subscribeDataChanges(() => {
      setSessions(getSessions());
      setBoardMembers(getBoardMembers());
    });
  }, []);

  const handleEditClick = (session: TrainingSession) => {
    setEditingId(session.id);
    setEditForm({ ...session });
  };

  // 🔥 Lưu dữ liệu trực tiếp lên Firestore
  const handleSaveClick = () => {
    if (editingId && editForm) {
      const original = sessions.find(s => s.id === editingId);
      if (original) {
        const updated = { ...original, ...editForm } as TrainingSession;
        updateSession(updated);
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

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const potentialReviewers = boardMembers.filter(m => 
    m.role.toLowerCase().includes('trưởng') || 
    m.role.toLowerCase().includes('phó') || 
    m.role.toLowerCase().includes('chủ nhiệm') ||
    m.role.toLowerCase().includes('mentor')
  );

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case Status.APPROVED:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200"><CheckCircle2 size={12} className="mr-1.5"/>Đã Duyệt</span>;
      case Status.CHECKING:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><Clock size={12} className="mr-1.5"/>Đang KT</span>;
      case Status.REVISION:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><AlertCircle size={12} className="mr-1.5"/>Chỉnh Lại</span>;
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

      {/* Main Table */}
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
              {filteredSessions.map(session => {
                const isEditing = editingId === session.id;
                const hours = Math.floor((editForm.duration || session.duration) / 60);
                const minutes = (editForm.duration || session.duration) % 60;

                return (
                  <tr key={session.id} className="group hover:bg-orange-50/30 transition-colors">
                    {/* Chủ đề & thời lượng */}
                    <td className="px-6 py-4 align-top w-1/4">
                      <div className="font-bold text-slate-800 text-base mb-1">{session.topic}</div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500">
                            {session.department}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-slate-500 font-medium">
                        <Timer size={12} className="mr-1"/> 
                        Thời lượng: <span className="text-slate-800 ml-1 font-bold">{formatDuration(session.duration)}</span>
                      </div>
                    </td>

                    {/* Deadline + Reviewer + Trainer */}
                    <td className="px-6 py-4 align-top w-1/5">
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center mb-1">
                            <Calendar size={10} className="mr-1"/> Deadline Nộp
                          </label>
                          {session.deadline ? (
                            <div className="text-slate-800 font-medium text-xs flex items-center">
                              {formatDate(session.deadline)}
                              {checkDeadlineStatus(session.deadline, session.status)}
                            </div>
                          ) : <span className="text-slate-400 italic text-xs">Chưa có hạn</span>}
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Người Duyệt</label>
                          <div className="text-slate-600 text-xs">{session.reviewerName}</div>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Trainer</label>
                          <div className="text-slate-800 text-sm font-medium">{session.trainerName || <span className="text-slate-400 italic text-xs">Chưa phân công</span>}</div>
                        </div>
                      </div>
                    </td>

                    {/* Nội dung + AI */}
                    <td className="px-6 py-4 align-top w-1/4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Link Giáo Án</label>
                          {session.materialsLink ? (
                            <a href={session.materialsLink} target="_blank" rel="noreferrer" className="inline-flex items-center text-blue-600 hover:text-blue-700 hover:underline font-medium text-sm">
                              <ExternalLink size={14} className="mr-1.5"/> Mở Tài Liệu
                            </a>
                          ) : <span className="text-slate-400 italic text-xs">Chưa nộp link</span>}
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Yêu cầu tối thiểu</label>
                          <div className="text-slate-600 text-xs leading-relaxed mb-2 bg-slate-50 p-2 rounded border border-slate-100">
                            {session.requirements || "Chưa có yêu cầu cụ thể"}
                          </div>
                          <button
                            onClick={() => openAiHelper(session.topic, session.requirements)}
                            className="inline-flex items-center text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded hover:bg-purple-100 transition-colors border border-purple-100"
                          >
                            <Sparkles size={12} className="mr-1.5"/> AI Gợi ý Outline
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Trạng thái */}
                    <td className="px-6 py-4 align-top w-1/6">
                      {getStatusBadge(session.status)}
                    </td>

                    {/* Tác vụ */}
                    <td className="px-6 py-4 align-middle text-center w-24">
                      <button 
                        onClick={() => handleEditClick(session)}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 hover:shadow-md transition-all mx-auto"
                        title="Chỉnh sửa"
                      >
                        <Edit2 size={16}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
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
