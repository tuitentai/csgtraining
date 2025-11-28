import React, { useState, useEffect } from 'react';
import { TrainingSession, Status, Department, BoardMember } from '../types';
import { getSessions, updateSession, getBoardMembers } from '../services/dataService';
import { Edit2, Save, ExternalLink, CheckCircle2, Clock, AlertCircle, Sparkles, ChevronDown, ListFilter, Calendar, Timer } from 'lucide-react';
import GeminiAssistant from './GeminiAssistant';

const CurriculumManager: React.FC = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TrainingSession>>({});

  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiContext, setAiContext] = useState({ topic: '', reqs: '' });

  // -----------------------------------------
  // SORT CỐ ĐỊNH THEO TÊN (KHÔNG ĐỔI THỨ TỰ NỮA)
  // -----------------------------------------
  const sortSessions = (list: TrainingSession[]) => {
    return [...list].sort((a, b) => a.topic.localeCompare(b.topic));
  };

  // -----------------------------------------
  // LOAD LẦN ĐẦU
  // -----------------------------------------
  useEffect(() => {
    setSessions(sortSessions(getSessions()));
    setBoardMembers(getBoardMembers());
  }, []);

  // -----------------------------------------
  // LOAD KHI ĐỔI TAB
  // -----------------------------------------
  useEffect(() => {
    setSessions(sortSessions(getSessions()));
  }, [activeTab]);

  // -----------------------------------------
  // EDIT
  // -----------------------------------------
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

        setSessions(prev =>
          sortSessions(prev.map(s => (s.id === editingId ? updated : s)))
        );

        setEditingId(null);
      }
    }
  };

  const handleChange = (field: keyof TrainingSession, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // -----------------------------------------
  // AI BUTTON
  // -----------------------------------------
  const openAiHelper = (topic: string, requirements: string) => {
    setAiContext({ topic, reqs: requirements });
    setIsAiOpen(true);
  };

  // -----------------------------------------
  // SUPPORT FUNCTIONS
  // -----------------------------------------
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const p = dateStr.split('-');
    return `${p[2]}-${p[1]}-${p[0]}`;
  };

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h ${m}p`;
    if (h > 0) return `${h}h`;
    return `${m}p`;
  };

  const potentialReviewers = boardMembers.filter(m =>
    m.role.toLowerCase().includes('trưởng') ||
    m.role.toLowerCase().includes('phó') ||
    m.role.toLowerCase().includes('chủ nhiệm') ||
    m.role.toLowerCase().includes('mentor')
  );

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

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case Status.APPROVED:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 size={12} className="mr-1.5" /> Đã Duyệt
          </span>
        );
      case Status.CHECKING:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock size={12} className="mr-1.5" /> Đang KT
          </span>
        );
      case Status.REVISION:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertCircle size={12} className="mr-1.5" /> Chỉnh Lại
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Chưa Nộp
          </span>
        );
    }
  };

  // -------------------------------------------------------
  // APPLY FILTER (TAB + STATUS)
  // -------------------------------------------------------
  const tabFiltered = activeTab === 'ALL'
    ? sessions
    : sessions.filter(s => s.department === activeTab);

  const filteredSessions =
    statusFilter === 'ALL'
      ? tabFiltered
      : tabFiltered.filter(s => s.status === statusFilter);

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------

  const tabs = [
    { id: 'ALL', label: 'Tất cả' },
    { id: Department.GENERAL, label: 'General' },
    { id: Department.MEDIA, label: 'Ban Media' },
    { id: Department.EVENT, label: 'Ban Event' },
    { id: Department.ER, label: 'Ban ER' }
  ];

  return (
    <div className="space-y-6 pb-20">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quản Lý Giáo Án</h2>
          <p className="text-sm text-slate-500 mt-1">Theo dõi tiến độ và nộp giáo trình đúng hạn</p>
        </div>

        {/* TABS */}
        <div className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all
                ${activeTab === tab.id
                  ? 'bg-orange-50 text-orange-700 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* STATUS FILTER */}
      <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm w-full max-w-xs">
        <span className="text-xs font-medium text-slate-600">Lọc trạng thái:</span>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border bg-slate-50 border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-orange-200"
        >
          <option value="ALL">Tất cả</option>
          <option value={Status.PENDING}>Chưa Nộp</option>
          <option value={Status.CHECKING}>Đang KT</option>
          <option value={Status.REVISION}>Chỉnh Lại</option>
          <option value={Status.APPROVED}>Đã Duyệt</option>
        </select>
      </div>

      {/* TABLE (DESKTOP) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                const hours = Math.floor((editForm.duration || 0) / 60);
                const minutes = (editForm.duration || 0) % 60;

                return (
                  <tr key={session.id} className="group hover:bg-orange-50/30 transition-colors">

                    {/* COL 1 */}
                    <td className="px-6 py-4 align-top w-1/4">
                      <div className="font-bold text-slate-800 text-base mb-1">{session.topic}</div>
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border
                            ${session.department === Department.GENERAL
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : session.department === Department.MEDIA
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : session.department === Department.EVENT
                                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                                  : session.department === Department.ER
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}>
                          {session.department}
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="mt-2 bg-slate-50 p-2 rounded border border-slate-200">
                          <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                            Chỉnh thời lượng
                          </label>

                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type="number"
                                min="0"
                                className="w-full bg-white border border-slate-200 rounded px-1 py-1 text-xs"
                                value={hours}
                                onChange={e => handleChange('duration', (parseInt(e.target.value) || 0) * 60 + minutes)}
                              />
                              <span className="absolute right-1 top-1 text-[10px] text-slate-400">h</span>
                            </div>

                            <div className="relative flex-1">
                              <input
                                type="number"
                                min="0"
                                max="59"
                                className="w-full bg-white border border-slate-200 rounded px-1 py-1 text-xs"
                                value={minutes}
                                onChange={e => handleChange('duration', hours * 60 + (parseInt(e.target.value) || 0))}
                              />
                              <span className="absolute right-1 top-1 text-[10px] text-slate-400">p</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-slate-500 font-medium">
                          <Timer size={12} className="mr-1" />
                          Thời lượng:
                          <span className="text-slate-800 ml-1 font-bold">{formatDuration(session.duration)}</span>
                        </div>
                      )}
                    </td>

                    {/* COL 2 */}
                    <td className="px-6 py-4 align-top w-1/5">
                      <div className="space-y-3">

                        {/* Deadline */}
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold uppercase flex items-center mb-1">
                            <Calendar size={10} className="mr-1" />
                            Deadline Nộp
                          </label>

                          {isEditing ? (
                            <input
                              type="date"
                              className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                              value={editForm.deadline || ''}
                              onChange={e => handleChange('deadline', e.target.value)}
                            />
                          ) : (
                            <div className="text-slate-800 font-medium text-xs flex items-center">
                              {session.deadline ? (
                                <>
                                  {formatDate(session.deadline)}
                                  {checkDeadlineStatus(session.deadline, session.status)}
                                </>
                              ) : (
                                <span className="text-slate-400 italic">Chưa có hạn</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Reviewer */}
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                            Người Duyệt
                          </label>
                          {isEditing ? (
                            <select
                              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs"
                              value={editForm.reviewerName}
                              onChange={e => handleChange('reviewerName', e.target.value)}
                            >
                              <option value="">Chọn người duyệt...</option>
                              {potentialReviewers.map(m => (
                                <option key={m.id} value={m.name}>
                                  {m.name} ({m.role})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="text-slate-600 text-xs">{session.reviewerName}</div>
                          )}
                        </div>

                        {/* Trainer */}
                        <div>
                          <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                            Trainer
                          </label>
                          {isEditing ? (
                            <input
                              type="text"
                              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-xs"
                              value={editForm.trainerName || ''}
                              onChange={e => handleChange('trainerName', e.target.value)}
                              placeholder="Tên Trainer..."
                            />
                          ) : (
                            <div className="text-slate-800 text-sm font-medium">
                              {session.trainerName || (
                                <span className="text-slate-400 italic text-xs">Chưa phân công</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* COL 3 */}
                    <td className="px-6 py-4 align-top w-1/4">
                      <div className="space-y-3">

                        <div>
                          <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                            Link Giáo Án
                          </label>

                          {isEditing ? (
                            <input
                              type="text"
                              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 text-sm"
                              value={editForm.materialsLink || ''}
                              onChange={e => handleChange('materialsLink', e.target.value)}
                              placeholder="https://docs.google.com..."
                            />
                          ) : session.materialsLink ? (
                            <a
                              href={session.materialsLink}
                              target="_blank"
                              className="inline-flex items-center text-blue-600 hover:underline font-medium text-sm"
                            >
                              <ExternalLink size={14} className="mr-1.5" /> Mở Tài Liệu
                            </a>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Chưa nộp link</span>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                            Yêu cầu tối thiểu
                          </label>

                          <div className="text-slate-600 text-xs mb-2 bg-slate-50 p-2 rounded border border-slate-100">
                            {session.requirements || 'Chưa có yêu cầu cụ thể'}
                          </div>

                          <button
                            onClick={() => openAiHelper(session.topic, session.requirements)}
                            className="inline-flex items-center text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100"
                          >
                            <Sparkles size={12} className="mr-1.5" /> AI Gợi ý Outline
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4 align-top w-1/6">
                      {isEditing ? (
                        <div className="relative">
                          <select
                            className="w-full bg-white border border-slate-200 rounded-md pl-3 pr-8 py-2 text-sm"
                            value={editForm.status}
                            onChange={e => handleChange('status', e.target.value)}
                          >
                            {Object.values(Status).map(s => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            className="absolute right-2 top-2.5 text-slate-400"
                            size={16}
                          />
                        </div>
                      ) : (
                        getStatusBadge(session.status)
                      )}
                    </td>

                    {/* ACTION */}
                    <td className="px-6 py-4 align-middle text-center w-24">
                      {isEditing ? (
                        <button
                          onClick={handleSaveClick}
                          className="w-9 h-9 flex items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100 hover:scale-110 transition-all"
                        >
                          <Save size={17} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEditClick(session)}
                          className="w-9 h-9 flex items-center justify-center rounded-full bg-white border text-slate-400 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-all"
                        >
                          <Edit2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <ListFilter size={40} className="mb-2 opacity-20" />
                      <p>Không có giáo án nào trong mục này.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* ---------------------------------------------------------
         MOBILE CARD UI (SIÊU ĐẸP + RẤT DỄ XEM)
       --------------------------------------------------------- */}
      <div className="md:hidden space-y-4">
        {filteredSessions.map(session => {
          const isEditing = editingId === session.id;
          const hours = Math.floor((editForm.duration || 0) / 60);
          const minutes = (editForm.duration || 0) % 60;

          return (
            <div
              key={session.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3"
            >

              {/* TITLE */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-800 text-base">
                    {session.topic}
                  </div>

                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border 
                    ${session.department === Department.GENERAL
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : session.department === Department.MEDIA
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : session.department === Department.EVENT
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : session.department === Department.ER
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {session.department}
                  </span>
                </div>

                {/* ACTION */}
                <div>
                  {isEditing ? (
                    <button
                      onClick={handleSaveClick}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-green-50 text-green-600"
                    >
                      <Save size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEditClick(session)}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* STATUS */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                Trạng thái
                </label>

            {isEditing ? (
              <div className="relative">
                <select
                  className="w-full bg-white border border-slate-200 rounded-md px-2 py-2 text-xs"
                  value={editForm.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  {Object.values(Status).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown
                    className="absolute right-2 top-2.5 text-slate-400 pointer-events-none"
                    size={15}
                  />
                </div>
              ) : (
                getStatusBadge(session.status)
              )}
              </div>


              {/* DEADLINE */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Deadline
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-2 text-xs"
                    value={editForm.deadline || ''}
                    onChange={e => handleChange('deadline', e.target.value)}
                  />
                ) : (
                  <div className="text-sm text-slate-800 font-medium">
                    {session.deadline ? formatDate(session.deadline) : 'Chưa có hạn'}
                  </div>
                )}
              </div>

              {/* REVIEWER */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Người duyệt
                </label>
                {isEditing ? (
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-2 text-xs"
                    value={editForm.reviewerName}
                    onChange={e => handleChange('reviewerName', e.target.value)}
                  >
                    <option value="">Chọn người duyệt...</option>
                    {potentialReviewers.map(m => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.role})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-slate-700">
                    {session.reviewerName || 'Chưa chọn'}
                  </div>
                )}
              </div>

              {/* MATERIALS */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Link Giáo Án
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-2 text-xs"
                    value={editForm.materialsLink || ''}
                    onChange={e => handleChange('materialsLink', e.target.value)}
                  />
                ) : session.materialsLink ? (
                  <a
                    href={session.materialsLink}
                    target="_blank"
                    className="text-blue-600 text-sm underline"
                  >
                    Mở tài liệu
                  </a>
                ) : (
                  <span className="text-sm text-slate-400 italic">Chưa nộp</span>
                )}
              </div>

              {/* REQUIREMENTS */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Yêu cầu tối thiểu
                </label>
                <div className="text-xs bg-slate-50 border border-slate-100 rounded p-2 text-slate-700">
                  {session.requirements || 'Chưa có yêu cầu cụ thể'}
                </div>

                <button
                  onClick={() => openAiHelper(session.topic, session.requirements)}
                  className="mt-2 inline-flex items-center text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100"
                >
                  <Sparkles size={12} className="mr-1" /> AI Gợi ý
                </button>
              </div>

              {/* TRAINER */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Trainer
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-2 text-xs"
                    value={editForm.trainerName || ''}
                    onChange={e => handleChange('trainerName', e.target.value)}
                    placeholder="Tên trainer..."
                  />
                ) : (
                  <div className="text-sm text-slate-700">
                    {session.trainerName || 'Chưa phân công'}
                  </div>
                )}
              </div>

              {/* TIME */}
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Thời lượng
                </label>

                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      className="w-full bg-white border border-slate-200 rounded px-2 py-2 text-xs"
                      value={hours}
                      onChange={e =>
                        handleChange('duration', (parseInt(e.target.value) || 0) * 60 + minutes)
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      max="59"
                      className="w-full bg-white border border-slate-200 rounded px-2 py-2 text-xs"
                      value={minutes}
                      onChange={e =>
                        handleChange('duration', hours * 60 + (parseInt(e.target.value) || 0))
                      }
                    />
                  </div>
                ) : (
                  <div className="flex items-center text-sm text-slate-700">
                    <Timer size={12} className="mr-1" /> {formatDuration(session.duration)}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">
            <ListFilter size={40} className="mx-auto mb-3 opacity-20" />
            Không có giáo án nào.
          </div>
        )}
      </div>

      {/* GEMINI ASSISTANT */}
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
