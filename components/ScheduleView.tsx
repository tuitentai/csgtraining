import React, { useState, useEffect } from 'react';
import { TrainingSession, LocationType, Department } from '../types';
import { getSessions, updateSession } from '../services/dataService';
import { Calendar as CalendarIcon, MapPin, Clock, ArrowRightLeft, User, Users, List, ChevronLeft, ChevronRight } from 'lucide-react';

const ScheduleView: React.FC = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedSession, setEditedSession] = useState<TrainingSession | null>(null);
  const [swapMode, setSwapMode] = useState(false);
  const [swapSource, setSwapSource] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 1)); // December 2024

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
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  // 🕒 Tính giờ kết thúc dựa trên giờ bắt đầu + thời lượng
  const calculateEndTime = (startTime: string, duration: number) => {
    if (!startTime || isNaN(duration)) return '';
    const [hour, minute] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + duration;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  };

  const handleEditChange = (field: keyof TrainingSession, value: any) => {
    if (editedSession) {
      setEditedSession({ ...editedSession, [field]: value });
    }
  };

  const handleSave = (id: string) => {
    if (editedSession && editedSession.id === id) {
      updateSession(editedSession);
      setSessions(prev => prev.map(s => (s.id === id ? editedSession : s)));
      setEditedSession(null);
      setEditingId(null);
    }
  };

  const handleEditClick = (session: TrainingSession) => {
    if (editingId === session.id) {
      handleSave(session.id);
    } else {
      setEditingId(session.id);
      setEditedSession({ ...session });
    }
  };

  const handleSwapSelect = (id: string) => {
    if (!swapSource) {
      setSwapSource(id);
    } else {
      const sourceIdx = sessions.findIndex(s => s.id === swapSource);
      const targetIdx = sessions.findIndex(s => s.id === id);

      if (sourceIdx !== -1 && targetIdx !== -1) {
        const sourceSession = { ...sessions[sourceIdx] };
        const targetSession = { ...sessions[targetIdx] };

        const tempDate = sourceSession.date;
        const tempTime = sourceSession.startTime;

        sourceSession.date = targetSession.date;
        sourceSession.startTime = targetSession.startTime;

        targetSession.date = tempDate;
        targetSession.startTime = tempTime;

        updateSession(sourceSession);
        updateSession(targetSession);

        const newSessions = getSessions().sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.startTime.localeCompare(b.startTime);
        });
        setSessions(newSessions);
      }
      setSwapSource(null);
      setSwapMode(false);
    }
  };

  // Calendar Logic
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => {
    let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50 border border-slate-100/50"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const daySessions = sessions.filter(s => s.date === dateStr);
      const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();

      days.push(
        <div key={day} className={`min-h-[9rem] bg-white border border-slate-100 p-1.5 hover:bg-slate-50 relative group ${isToday ? 'bg-orange-50/30' : ''}`}>
          <div className={`text-sm font-semibold mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-orange-500 text-white' : 'text-slate-700'}`}>
            {day}
          </div>
          <div className="space-y-1.5">
            {daySessions.map(session => (
              <div key={session.id}
                className={`text-[10px] px-2 py-1.5 rounded border-l-2 truncate
                  ${
                    session.department === Department.MEDIA
                      ? 'bg-purple-50 text-purple-700 border-purple-500'
                      : session.department === Department.EVENT
                      ? 'bg-orange-50 text-orange-700 border-orange-500'
                      : session.department === Department.ER
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-500'
                      : 'bg-blue-50 text-blue-700 border-blue-500'
                  }`}
                title={`${session.startTime} - ${session.topic}`}>
                <div className="font-bold flex justify-between items-center mb-0.5">
                    <span>{session.startTime}</span>
                    <span className="opacity-90 text-[9px] bg-white/50 px-1 rounded ml-1 truncate max-w-[50%]">
                        {session.locationDetail || (session.locationType === LocationType.HALL ? 'Hall' : 'P.?')}
                    </span>
                </div>
                <div className="truncate font-medium mb-0.5">{session.topic}</div>
                <div className="truncate opacity-75 text-[9px] flex items-center">
                    <User size={8} className="mr-0.5"/> {session.trainerName || 'No Trainer'}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}</h3>
          <div className="flex space-x-1">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-1.5 hover:bg-white rounded-lg text-slate-500"><ChevronLeft size={20}/></button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-1.5 hover:bg-white rounded-lg text-slate-500"><ChevronRight size={20}/></button>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
          {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
            <div key={d} className="py-2 text-center text-xs font-bold text-slate-400 uppercase">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-slate-100 gap-px border-l border-slate-100">
          {days}
        </div>
      </div>
    );
  };

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
          <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg font-bold text-sm mr-3 border border-orange-200">{dateFormatted}</div>
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
                          onChange={(e) => handleEditChange('startTime', e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm w-24 focus:border-orange-500"
                        />
                      ) : (
                        <span className="flex items-center">
                          <span className="font-bold text-slate-800">{session.startTime}</span>
                          <span className="mx-1 text-slate-400">–</span>
                          <span className="font-bold text-slate-800">
                            {calculateEndTime(session.startTime, session.duration)}
                          </span>
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
                        {currentData.locationType === LocationType.HALL ? (
                          <Users size={14} />
                        ) : (
                          <MapPin size={14} />
                        )}
                      </div>
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <select
                            value={currentData.locationType}
                            onChange={(e) => handleEditChange('locationType', e.target.value)}
                            className="bg-slate-50 border rounded p-1 text-xs"
                          >
                            <option value={LocationType.CLASSROOM}>{LocationType.CLASSROOM}</option>
                            <option value={LocationType.HALL}>{LocationType.HALL}</option>
                          </select>
                          {currentData.locationType === LocationType.HALL ? (
                            <select
                              value={currentData.locationDetail}
                              onChange={(e) => handleEditChange('locationDetail', e.target.value)}
                              className="bg-slate-50 border rounded p-1 text-xs w-24"
                            >
                              <option value="Hall A">Hall A</option>
                              <option value="Hall B">Hall B</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder="Số phòng..."
                              value={currentData.locationDetail}
                              onChange={(e) => handleEditChange('locationDetail', e.target.value)}
                              className="bg-slate-50 border rounded p-1 text-xs w-24"
                            />
                          )}
                        </div>
                      ) : (
                        <span>
                          {session.locationType} {session.locationDetail && `• ${session.locationDetail}`}
                        </span>
                      )}
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

  const uniqueDates = Array.from(new Set(sessions.map(s => s.date))).sort() as string[];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Lịch Training</h2>
          <p className="text-sm text-slate-500">Xem và quản lý lịch trình chi tiết</p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => {
              setViewMode('list');
              setSwapMode(false);
            }}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            <List size={16} className="mr-2" /> Danh Sách
          </button>
          <button
            onClick={() => {
              setViewMode('calendar');
              setSwapMode(false);
            }}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
              viewMode === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
            }`}
          >
            <CalendarIcon size={16} className="mr-2" /> Lịch Tháng
          </button>
        </div>

        {viewMode === 'list' && (
          <button
            onClick={() => {
              setSwapMode(!swapMode);
              setSwapSource(null);
            }}
            className={`flex items-center px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm ml-auto ${
              swapMode
                ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                : 'bg-white border text-slate-700'
            }`}
          >
            <ArrowRightLeft
              size={18}
              className={`mr-2 ${swapMode ? 'rotate-180' : ''}`}
            />
            {swapMode ? "Đang bật Đổi lịch" : "Đổi lịch"}
          </button>
        )}
      </div>

      {swapMode && viewMode === 'list' && (
        <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl text-sm flex items-center justify-center">
          <div className="bg-white p-2 rounded-full mr-3 shadow-sm text-blue-600">
            <ArrowRightLeft size={16} />
          </div>
          {swapSource
            ? "Bước 2: Chọn slot thứ hai để hoán đổi vị trí."
            : "Bước 1: Chọn slot đầu tiên bạn muốn đổi lịch."}
        </div>
      )}

      <div className="pb-20">
        {viewMode === 'list'
          ? uniqueDates.length > 0
            ? uniqueDates.map(date => renderDaySchedule(date))
            : (
              <div className="text-center py-20 text-slate-400">
                Chưa có lịch training nào.
              </div>
            )
          : renderCalendar()}
      </div>
    </div>
  );
};

export default ScheduleView;
