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
  // State for sessions, edited session, and editing mode
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedSession, setEditedSession] = useState<TrainingSession | null>(null);
  const [swapMode, setSwapMode] = useState(false);
  const [swapSource, setSwapSource] = useState<string | null>(null);

  // View mode (list or calendar view)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(() => {
    return (localStorage.getItem('viewMode') as 'list' | 'calendar') || 'list';
  });

  // Current date to display
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);  // Default to current month
  });

  // Modal edit state
  const [editModal, setEditModal] = useState<{ open: boolean; session?: TrainingSession | null }>({
    open: false,
    session: null,
  });
  const [tempSession, setTempSession] = useState<TrainingSession | null>(null);

  // Fetch sessions when component mounts
  useEffect(() => {
    const loaded = getSessions().sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });
    setSessions(loaded);
  }, []);

  // Helper function to format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  // Helper function to calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, duration: number) => {
    if (!startTime || isNaN(duration)) return '';
    const [hour, minute] = startTime.split(':').map(Number);
    const totalMinutes = hour * 60 + minute + duration;
    const endHour = Math.floor(totalMinutes / 60) % 24;
    const endMinute = totalMinutes % 60;
    return `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
  };

  // Handle changes in the session edit form
  const handleEditChange = (field: keyof TrainingSession, value: any) => {
    if (editedSession) {
      setEditedSession({ ...editedSession, [field]: value });
    }
  };

  // Handle save changes in session
  const handleSave = (id: string) => {
    if (editedSession && editedSession.id === id) {
      updateSession(editedSession);
      setSessions(prev => prev.map(s => (s.id === id ? editedSession : s)));
      setEditedSession(null);
      setEditingId(null);
    }
  };

  // Handle click on edit button
  const handleEditClick = (session: TrainingSession) => {
    if (editingId === session.id) {
      handleSave(session.id);
    } else {
      setEditingId(session.id);
      setEditedSession({ ...session });
    }
  };

  // Handle selection for swapping sessions
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

  // --------------------------
  // Calendar view helpers
  // --------------------------
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => {
    let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1;  // Adjust for Monday as first day of week
  };

  // Handle edit modal actions
  const openEditModal = (session: TrainingSession) => {
    setTempSession({ ...session });
    setEditModal({ open: true, session });
  };

  const handleModalChange = (field: keyof TrainingSession, value: any) => {
    if (tempSession) setTempSession({ ...tempSession, [field]: value });
  };

  // Save changes from modal
  const handleSaveModal = () => {
    if (tempSession) {
      updateSession(tempSession);
      setSessions(prev => prev.map(s => (s.id === tempSession.id ? tempSession : s)));
    }
    setEditModal({ open: false, session: null });
    setTempSession(null);
  };

  // Close the edit modal
  const handleCloseModal = () => {
    setEditModal({ open: false, session: null });
    setTempSession(null);
  };

  // ================== CALENDAR VIEW ==================
const renderCalendar = () => {
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  // Ô trống đầu tháng
  for (let i = 0; i < firstDay; i++) {
    days.push(
      <div
        key={`empty-${i}`}
        className="h-32 bg-slate-50 border border-slate-100/50 md:h-40"
      ></div>
    );
  }

  // Lặp từng ngày trong tháng
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const daySessions = sessions.filter((s) => s.date === dateStr);

    const isToday =
      day === new Date().getDate() &&
      currentDate.getMonth() === new Date().getMonth();

    days.push(
      <div
        key={day}
        className={`min-h-[10rem] md:min-h-[12rem] bg-white border border-slate-200 p-1.5 md:p-2 hover:bg-slate-50 relative overflow-y-auto ${
          isToday ? "bg-orange-50/40" : ""
        }`}
      >
        {/* Ngày */}
        <div
          className={`text-xs md:text-sm font-semibold mb-1 w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full ${
            isToday ? "bg-orange-500 text-white" : "text-slate-700"
          }`}
        >
          {day}
        </div>

        {/* Danh sách session */}
        <div className="flex flex-col gap-1">
          {daySessions.map((session) => {
            const heightPx = Math.max(session.duration, 28); // min-height

            return (
              <div
                key={session.id}
                className={`rounded-lg px-2 py-1 text-[10px] md:text-xs shadow-sm border-l-4 overflow-hidden cursor-pointer`}
                style={{
                  height: `${heightPx}px`,
                  minHeight: "28px",
                  backgroundColor:
                    session.department === Department.MEDIA
                      ? "#F3E8FF"
                      : session.department === Department.EVENT
                      ? "#FFEAD5"
                      : session.department === Department.ER
                      ? "#D1FAE5"
                      : "#DBEAFE",
                  borderColor:
                    session.department === Department.MEDIA
                      ? "#A855F7"
                      : session.department === Department.EVENT
                      ? "#F97316"
                      : session.department === Department.ER
                      ? "#10B981"
                      : "#3B82F6",
                }}
                onClick={() => openEditModal(session)}
              >
                <div className="font-bold truncate">
                  {session.startTime} –{" "}
                  {calculateEndTime(session.startTime, session.duration)}
                  {"  "}
                  <span className="opacity-70">({session.duration}’)</span>
                </div>

                <div className="truncate">{session.topic}</div>

                <div className="truncate flex items-center opacity-70 text-[9px]">
                  <User size={8} className="mr-1" />
                  {session.trainerName || "No Trainer"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header tháng */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-3">
        <div className="flex items-center justify-between p-4 border-b bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">
            Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
          </h3>

          <div className="flex space-x-2">
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1
                  )
                )
              }
              className="p-2 rounded-lg hover:bg-white text-slate-600"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1
                  )
                )
              }
              className="p-2 rounded-lg hover:bg-white text-slate-600"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Header days */}
        <div className="grid grid-cols-7 text-center bg-slate-50 border-b">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
            <div
              key={d}
              className="py-2 text-[10px] md:text-xs font-bold text-slate-500"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 bg-slate-200 gap-px">
          {days}
        </div>
      </div>

      {/* MODAL Chỉnh sửa */}
      {editModal.open && tempSession && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-[320px] p-5 space-y-3">
            <h3 className="text-lg font-bold">Chỉnh sửa Training</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600">
                  Giờ bắt đầu
                </label>
                <input
                  type="time"
                  value={tempSession.startTime}
                  onChange={(e) =>
                    handleModalChange("startTime", e.target.value)
                  }
                  className="w-full border rounded p-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600">
                  Thời lượng (phút)
                </label>
                <input
                  type="number"
                  value={tempSession.duration}
                  onChange={(e) =>
                    handleModalChange("duration", Number(e.target.value))
                  }
                  className="w-full border rounded p-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-slate-200 rounded-lg text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ================== LIST VIEW ==================
const renderDaySchedule = (dateStr: string) => {
  const daySessions = sessions.filter((s) => s.date === dateStr);
  const dateObj = new Date(dateStr);
  const dayName = new Intl.DateTimeFormat("vi-VN", { weekday: "long" }).format(
    dateObj
  );
  const dateFormatted = formatDate(dateStr);

  return (
    <div key={dateStr} className="mb-10">
      <div className="sticky top-0 z-10 bg-slate-100/80 backdrop-blur py-3 px-1 border-b">
        <h3 className="text-lg font-bold text-slate-800">
          {dayName} - {dateFormatted}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {daySessions.map((session) => {
          const isEditing = editingId === session.id;
          const currentData = isEditing ? editedSession : session;

          return (
            <div
              key={session.id}
              className={`relative bg-white rounded-xl border ${
                isEditing
                  ? "border-green-500 ring-1 ring-green-200"
                  : "border-slate-200 hover:border-orange-300"
              }`}
            >
              <div className="p-5">
                {/* Time */}
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-slate-800 flex items-center">
                    <Clock size={18} className="mr-1 text-slate-400" />
                    {isEditing ? (
                      <input
                        type="time"
                        value={currentData!.startTime}
                        onChange={(e) =>
                          handleEditChange("startTime", e.target.value)
                        }
                        className="border rounded px-2 py-1"
                      />
                    ) : (
                      <span>
                        {session.startTime} –{" "}
                        {calculateEndTime(
                          session.startTime,
                          session.duration
                        )}{" "}
                        ({session.duration}')
                      </span>
                    )}
                  </div>

                  {/* Department */}
                  <span
                    className={`px-2 py-1 text-[10px] font-bold rounded-full border ${
                      session.department === Department.MEDIA
                        ? "bg-purple-50 text-purple-700 border-purple-300"
                        : session.department === Department.EVENT
                        ? "bg-orange-50 text-orange-700 border-orange-300"
                        : session.department === Department.ER
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-blue-50 text-blue-700 border-blue-300"
                    }`}
                  >
                    {session.department}
                  </span>
                </div>

                {/* Topic */}
                <div className="font-bold text-lg mb-1">{session.topic}</div>

                {/* Trainer */}
                <div className="flex items-center text-sm text-slate-600 mb-2">
                  <User size={14} className="mr-1" />
                  {session.trainerName || "Chưa có Trainer"}
                </div>

                {/* Location */}
                <div className="flex items-center text-sm text-slate-700 border-t pt-3 mt-3">
                  <MapPin size={14} className="mr-1 text-slate-400" />
                  {session.locationType}{" "}
                  {session.locationDetail && `• ${session.locationDetail}`}
                </div>

                {/* Edit button */}
                {!swapMode && (
                  <button
                    onClick={() => handleEditClick(session)}
                    className={`mt-4 w-full px-3 py-2 text-sm rounded-lg ${
                      isEditing
                        ? "bg-green-600 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {isEditing ? "Lưu" : "Sửa"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const uniqueDates = Array.from(new Set(sessions.map((s) => s.date))).sort();

// FINAL RETURN
return (
  <div className="space-y-6 pb-24">
    {/* HEADER */}
    <div className="bg-white rounded-2xl p-4 border shadow-sm">
      <h2 className="text-xl font-bold text-slate-800">Lịch Training</h2>
      <p className="text-sm text-slate-500">Xem và quản lý lịch trình</p>

      {/* View mode buttons */}
      <div className="flex mt-4 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => {
            setViewMode("list");
            localStorage.setItem("viewMode", "list");
          }}
          className={`flex-1 py-2 rounded-lg ${
            viewMode === "list" ? "bg-white shadow text-slate-800" : ""
          }`}
        >
          <List size={16} className="inline-block mr-1" />
          Danh sách
        </button>

        <button
          onClick={() => {
            setViewMode("calendar");
            localStorage.setItem("viewMode", "calendar");
          }}
          className={`flex-1 py-2 rounded-lg ${
            viewMode === "calendar" ? "bg-white shadow text-slate-800" : ""
          }`}
        >
          <CalendarIcon size={16} className="inline-block mr-1" />
          Lịch tháng
        </button>
      </div>
    </div>

    {/* CONTENT */}
    {viewMode === "calendar"
      ? renderCalendar()
      : uniqueDates.map((date) => renderDaySchedule(date))}
  </div>
);
  
export default ScheduleView;
