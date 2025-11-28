import React, { useState, useEffect } from 'react';
import { TrainingSession, LocationType, Department } from '../types';
import { getSessions, updateSession } from '../services/dataService';
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  ArrowRightLeft,
  User,
  Users,
  List,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const ScheduleView: React.FC = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedSession, setEditedSession] = useState<TrainingSession | null>(null);

  const [swapMode, setSwapMode] = useState(false);
  const [swapSource, setSwapSource] = useState<string | null>(null);

  // Giữ chế độ list / calendar
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(() => {
    return (localStorage.getItem('viewMode') as 'list' | 'calendar') || 'list';
  });

  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // === Bottom Sheet (Mobile Full Info) ===
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetSession, setSheetSession] = useState<TrainingSession | null>(null);

  // Modal edit nhanh (đã có)
  const [editModal, setEditModal] = useState<{ open: boolean; session?: TrainingSession | null }>({
    open: false,
    session: null,
  });
  const [tempSession, setTempSession] = useState<TrainingSession | null>(null);

  useEffect(() => {
    const loaded = getSessions().sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
    setSessions(loaded);
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const calculateEndTime = (startTime: string, duration: number) => {
    if (!startTime || isNaN(duration)) return '';
    const [hour, minute] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + duration;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  };

  // ======================== CALENDAR LOGIC ========================
  const getDaysInMonth = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) => {
    let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  // ======================== BOTTOM SHEET TRIGGER ========================
  const openBottomSheet = (session: TrainingSession) => {
    setSheetSession(session);
    setSheetOpen(true);
  };

  // ======================== CALENDAR VIEW ========================
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);

    const days = [];

    // Ô rỗng đầu tháng
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="h-32 bg-slate-50 border border-slate-100/50"
        ></div>
      );
    }

    // Từng ngày trong tháng
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const daySessions = sessions.filter(s => s.date === dateStr);

      const isToday =
        day === new Date().getDate() &&
        currentDate.getMonth() === new Date().getMonth();

      days.push(
        <div
          key={day}
          className={`min-h-[10rem] bg-white border border-slate-200 p-2 relative ${
            isToday ? 'bg-orange-50/40' : ''
          }`}
        >
          {/* NGÀY */}
          <div
            className={`text-sm font-semibold mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
              isToday ? 'bg-orange-500 text-white' : 'text-slate-700'
            }`}
          >
            {day}
          </div>

          {/* COMPACT ITEM CHO MOBILE */}
          <div className="space-y-1.5">
            {daySessions.map(session => (
              <div
                key={session.id}
                onClick={() => openBottomSheet(session)}
                className={`
                  text-[11px] px-2 py-2 rounded-md border-l-4 shadow-sm
                  cursor-pointer active:scale-[0.98] transition
                  ${
                    session.department === Department.MEDIA
                      ? 'bg-purple-50 border-purple-500 text-purple-800'
                      : session.department === Department.EVENT
                      ? 'bg-orange-50 border-orange-500 text-orange-800'
                      : session.department === Department.ER
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-blue-50 border-blue-500 text-blue-800'
                  }
                `}
              >
                {/* ⏱ THỜI GIAN (chỉ giữ gọn) */}
                <div className="font-semibold">
                  {session.startTime} – {calculateEndTime(session.startTime, session.duration)}{' '}
                  ({session.duration}')
                </div>

                {/* CHỈ MOBILE HIỆN ÍT THÔI */}
                <div className="truncate text-[10px] opacity-80">{session.topic}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <>
        {/* HEADER tháng */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-slate-50">
            <h3 className="text-lg font-bold">
              Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
            </h3>

            <div className="flex space-x-1">
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
                  )
                }
                className="p-1.5 hover:bg-white rounded-lg text-slate-500"
              >
                <ChevronLeft size={20} />
              </button>

              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
                  )
                }
                className="p-1.5 hover:bg-white rounded-lg text-slate-500"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* HEADER thứ */}
          <div className="grid grid-cols-7 bg-slate-50 border-b">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
              <div key={d} className="py-2 text-center text-xs font-bold text-slate-400 uppercase">
                {d}
              </div>
            ))}
          </div>

          {/* GRID */}
          <div className="grid grid-cols-7 bg-slate-100 gap-px border-l border-slate-100">
            {days}
          </div>
        </div>
      </>
    );
  };
  // ======================== BOTTOM SHEET ========================
  const BottomSheet = () => {
    if (!sheetOpen || !sheetSession) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex justify-center items-end bg-black/40"
        onClick={() => setSheetOpen(false)}
      >
        <div
          className="bg-white w-full rounded-t-3xl p-6 pb-10 shadow-xl animate-slideUp"
          onClick={e => e.stopPropagation()}
        >
          <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4"></div>

          <h3 className="text-lg font-bold text-slate-900 mb-3">
            {sheetSession.topic}
          </h3>

          <div className="space-y-3 text-[15px]">
            {/* TIME */}
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-500" />
              <span className="font-semibold">
                {sheetSession.startTime} –{' '}
                {calculateEndTime(sheetSession.startTime, sheetSession.duration)}
              </span>
              <span className="text-slate-500 ml-1">
                ({sheetSession.duration}')
              </span>
            </div>

            {/* TRAINER */}
            <div className="flex items-center gap-2">
              <User size={16} className="text-slate-500" />
              <span>
                {sheetSession.trainerName || 'Chưa có Trainer'}
              </span>
            </div>

            {/* LOCATION */}
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-slate-500" />
              <span>
                {sheetSession.locationType}{' '}
                {sheetSession.locationDetail && `• ${sheetSession.locationDetail}`}
              </span>
            </div>

            {/* DEPARTMENT */}
            <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-500" />
              <span className="font-semibold">{sheetSession.department}</span>
            </div>

            {/* DATE */}
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} className="text-slate-500" />
              <span>{formatDate(sheetSession.date)}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setTempSession({ ...sheetSession });
              setEditModal({ open: true, session: sheetSession });
            }}
            className="mt-6 w-full py-3 bg-blue-600 text-white text-center rounded-xl font-semibold active:scale-95 transition"
          >
            Chỉnh sửa Training
          </button>
        </div>
      </div>
    );
  };

  // ======================== EDIT MODAL (CŨ + GIỮ NGUYÊN) ========================
  const openEditModal = (session: TrainingSession) => {
    setTempSession({ ...session });
    setEditModal({ open: true, session });
  };

  const handleModalChange = (field: keyof TrainingSession, value: any) => {
    if (tempSession) setTempSession({ ...tempSession, [field]: value });
  };

  const handleSaveModal = () => {
    if (tempSession) {
      updateSession(tempSession);
      setSessions(prev =>
        prev.map(s => (s.id === tempSession.id ? tempSession : s))
      );
    }
    setEditModal({ open: false, session: null });
    setSheetOpen(false);
    setTempSession(null);
  };

  const handleCloseModal = () => {
    setEditModal({ open: false, session: null });
    setTempSession(null);
  };

  const EditModal = () => {
    if (!editModal.open || !tempSession) return null;

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg w-[340px] p-5 space-y-3">
          <h3 className="text-lg font-bold text-slate-800 mb-2">
            Chỉnh sửa Training
          </h3>

          <div className="space-y-2 text-sm">
            {/* TIME */}
            <label className="block text-slate-600 font-medium">
              Giờ bắt đầu
            </label>
            <input
              type="time"
              value={tempSession.startTime}
              onChange={e =>
                handleModalChange('startTime', e.target.value)
              }
              className="w-full border rounded p-2 text-sm"
            />

            {/* DURATION */}
            <label className="block text-slate-600 font-medium mt-2">
              Thời lượng (phút)
            </label>
            <input
              type="number"
              value={tempSession.duration}
              onChange={e =>
                handleModalChange('duration', Number(e.target.value))
              }
              className="w-full border rounded p-2 text-sm"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300"
            >
              Hủy
            </button>

            <button
              onClick={handleSaveModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    );
  };
  // ======================== LIST VIEW ========================
  const renderDaySchedule = (dateStr: string) => {
    const daySessions = sessions.filter(s => s.date === dateStr);
    const dateObj = new Date(dateStr);
    const dayName = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(dateObj);
    const dateFormatted = formatDate(dateStr);
    const depts = Array.from(new Set(daySessions.map(s => s.department))).join(', ');
    const label = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} - ${dateFormatted}`;

    return (
      <div key={dateStr} className="mb-10 relative">
        <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur py-4 mb-4 flex items-center border-b border-slate-200">
          <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg font-bold text-sm mr-3 border border-orange-200">
            {dateFormatted}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">{label}</h3>
            {depts && <p className="text-xs text-slate-500 font-medium">Training: {depts}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {daySessions.map(session => {
            const isEditing = editingId === session.id;
            const currentData = isEditing && editedSession ? editedSession : session;

            const deptColor =
              session.department === Department.MEDIA
                ? 'border-l-4 border-l-purple-400'
                : session.department === Department.EVENT
                ? 'border-l-4 border-l-orange-400'
                : session.department === Department.ER
                ? 'border-l-4 border-l-emerald-400'
                : 'border-l-4 border-l-blue-400';

            return (
              <div
                key={session.id}
                className={`relative bg-white rounded-2xl border transition-all ${deptColor} ${
                  isEditing ? 'border-green-500 ring-1 ring-green-200' : 'border-slate-200 hover:border-orange-200'
                }`}
              >
                <div className="p-5 pl-7">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center text-slate-800 font-bold text-lg">
                      <Clock size={18} className="mr-2 text-slate-400" />
                      {isEditing ? (
                        <input
                          type="time"
                          value={currentData.startTime}
                          onChange={e => handleEditChange('startTime', e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm w-24 focus:border-orange-500"
                        />
                      ) : (
                        <span className="flex items-center">
                          <span>{session.startTime}</span>
                          <span className="mx-1 text-slate-400">–</span>
                          <span>{calculateEndTime(session.startTime, session.duration)}</span>
                          <span className="text-sm font-normal text-slate-400 ml-1">
                            ({session.duration}')
                          </span>
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${
                        session.department === Department.GENERAL
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

                  {isEditing && (
                    <div className="text-[10px] text-slate-500 mb-2">
                      Kết thúc: {calculateEndTime(currentData.startTime, currentData.duration)}
                    </div>
                  )}

                  <h4 className="font-bold text-slate-800 text-lg mb-1">{session.topic}</h4>

                  <div className="flex items-center text-sm text-slate-500 mb-4">
                    <User size={14} className="mr-1.5" />
                    <span>{session.trainerName || 'Chưa có Trainer'}</span>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center text-sm font-medium text-slate-700">
                      <div
                        className={`p-1.5 rounded-full mr-2 ${
                          currentData.locationType === LocationType.HALL
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {currentData.locationType === LocationType.HALL ? <Users size={14} /> : <MapPin size={14} />}
                      </div>
                      <span>
                        {session.locationType} {session.locationDetail && `• ${session.locationDetail}`}
                      </span>
                    </div>

                    {!swapMode && (
                      <button
                        onClick={() => handleEditClick(session)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                          isEditing
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isEditing ? 'Lưu' : 'Sửa'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ======================== MAIN RETURN ========================
  const uniqueDates = Array.from(new Set(sessions.map(s => s.date))).sort() as string[];

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Lịch Training</h2>
          <p className="text-sm text-slate-500">Xem và quản lý lịch trình chi tiết</p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-100 p-1 rounded-xl">
          {/* LIST MODE */}
          <button
            onClick={() => {
              setViewMode('list');
              localStorage.setItem('viewMode', 'list');
              setSwapMode(false);
            }}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            <List size={16} className="mr-2" /> Danh Sách
          </button>

          {/* CALENDAR MODE */}
          <button
            onClick={() => {
              setViewMode('calendar');
              localStorage.setItem('viewMode', 'calendar');
              setSwapMode(false);
            }}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              viewMode === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            <CalendarIcon size={16} className="mr-2" /> Lịch Tháng
          </button>
        </div>

        {/* SWAP BUTTON */}
        {viewMode === 'list' && (
          <button
            onClick={() => {
              setSwapMode(!swapMode);
              setSwapSource(null);
            }}
            className={`flex items-center px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm ml-auto ${
              swapMode ? 'bg-blue-600 text-white ring-4 ring-blue-100' : 'bg-white border text-slate-700'
            }`}
          >
            <ArrowRightLeft size={18} className={`mr-2 ${swapMode ? 'rotate-180' : ''}`} />
            {swapMode ? 'Đang bật Đổi lịch' : 'Đổi lịch'}
          </button>
        )}
      </div>

      {swapMode && viewMode === 'list' && (
        <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl text-sm flex items-center justify-center">
          <div className="bg-white p-2 rounded-full mr-3 shadow-sm text-blue-600">
            <ArrowRightLeft size={16} />
          </div>
          {swapSource
            ? 'Bước 2: Chọn slot thứ hai để hoán đổi vị trí.'
            : 'Bước 1: Chọn slot đầu tiên bạn muốn đổi lịch.'}
        </div>
      )}

      {/* BODY */}
      <div className="pb-20">
        {viewMode === 'list'
          ? uniqueDates.length > 0
            ? uniqueDates.map(date => renderDaySchedule(date))
            : <div className="text-center py-20 text-slate-400">Chưa có lịch training nào.</div>
          : renderCalendar()}
      </div>

      {/* BOTTOM SHEET */}
      <BottomSheet />

      {/* EDIT MODAL */}
      <EditModal />
    </div>
  );
};

export default ScheduleView;
