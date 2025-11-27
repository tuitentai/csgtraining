import React, { useState, useEffect } from 'react';
import { TrainingSession, Status, Department, BoardMember } from '../types';
import { getSessions, updateSession, getBoardMembers, subscribeDataChanges } from '../services/dataService';
import { Edit2, Save, ExternalLink, CheckCircle2, Clock, AlertCircle, Sparkles, ChevronDown, ListFilter, Calendar, Timer, UserCheck } from 'lucide-react';
import GeminiAssistant from './GeminiAssistant';

const CurriculumManager: React.FC = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TrainingSession>>({});

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiContext, setAiContext] = useState({ topic: '', reqs: '' });

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
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200"><CheckCircle2 size={12} className="mr-1.5" />Đã Duyệt</span>;
      case Status.CHECKING:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"><Clock size={12} className="mr-1.5" />Đang KT</span>;
      case Status.REVISION:
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><AlertCircle size={12} className="mr-1.5" />Chỉnh Lại</span>;
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
    if (status === Status.APPROVED)
      return <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded ml-2">Đúng hạn</span>;

    const today = new Date();
    const deadlineDate = new Date(deadline);
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);

    if (today > deadlineDate)
      return <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded ml-2">Trễ hạn</span>;
    if (today.getTime() === deadlineDate.getTime())
      return <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded ml-2">Hôm nay</span>;
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
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${activeTab === tab.id
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
                const hours = Math.floor((editForm.duration ?? session.duration) / 60);
                const minutes = (editForm.duration ?? session.duration) % 60;

                return (
                  <tr key={session.id} className="group hover:bg-orange-50/30 transition-colors">
                    {/* 1️⃣ Chủ đề & thời lượng */}
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
                            <input type="number" min="0" value={hours}
                              onChange={(e) => handleChange('duration', parseInt(e.target.value) * 60 + minutes)}
                              className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-xs" />h
                            <input type="number" min="0" max="59" value={minutes}
                              onChange={(e) => handleChange('duration', hours * 60 + parseInt(e.target.value))}
                              className="w-16 bg-white border border-slate-200 rounded px-2 py-1 text-xs" />p
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-slate-500 font-medium">
                          <Timer size={12} className="mr-1" />
                          Thời lượng: <span className="text-slate-800 ml-1 font-bold">{formatDuration(session.duration)}</span>
                        </div>
                      )}
                    </td>

                    {/* 2️⃣ Deadline & Người Duyệt */}
                    <td className="px-6 py-4 align-top w-1/5">
                      {isEditing ? (
                        <>
                          <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Deadline</label>
                          <input
                            type="date"
                            value={editForm.deadline || session.deadline || ''}
                            onChange={(e) => handleChange('deadline', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs mb-2"
                          />
                          <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Người duyệt</label>
                          <select
                            value={editForm.reviewer || session.reviewer || ''}
                            onChange={(e) => handleChange('reviewer', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs"
                          >
                            <option value="">-- Chọn người duyệt --</option>
                            {potentialReviewers.map(m => (
                              <option key={m.id} value={m.name}>{m.name}</option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-slate-600">
                            <Calendar size={12} className="inline mr-1 text-slate-400" />
                            {session.deadline ? formatDate(session.deadline) : 'Chưa có deadline'}
                            {checkDeadlineStatus(session.deadline, session.status)}
                          </div>
                          {session.reviewer && (
                            <div className="mt-1 text-xs text-slate-500 flex items-center">
                              <UserCheck size={12} className="mr-1" /> {session.reviewer}
                            </div>
                          )}
                        </>
                      )}
                    </td>

                    {/* 3️⃣ Nội dung */}
                    <td className="px-6 py-4 align-top w-2/5">
                      {isEditing ? (
                        <textarea
                          value={editForm.requirements || session.requirements || ''}
                          onChange={(e) => handleChange('requirements', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs min-h-[70px]"
                        />
                      ) : (
                        <p className="text-xs text-slate-700 leading-relaxed">{session.requirements || '—'}</p>
                      )}
                    </td>

                    {/* 4️⃣ Trạng thái */}
                    <td className="px-6 py-4 align-top w-1/6">{getStatusBadge(session.status)}</td>

                    {/* 5️⃣ Tác vụ */}
                    <td className="px-6 py-4 align-top text-center">
                      {isEditing ? (
                        <button
                          onClick={handleSaveClick}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700"
                        >
                          <Save size={12} className="inline mr-1" />Lưu
                        </button>
                      ) : (
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(session)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
                          >
                            <Edit2 size={12} className="inline mr-1" />Sửa
                          </button>
                          <button
                            onClick={() => openAiHelper(session.topic, session.requirements || '')}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100"
                          >
                            <Sparkles size={12} className="inline mr-1" />AI
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <ListFilter size={48} className="mb-3 opacity-20" />
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
