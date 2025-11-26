
import React, { useState, useEffect } from 'react';
import { TrainingSession, LocationType } from '../types';
import { getSessions, updateSession } from '../services/dataService';
import { Calendar as CalendarIcon, MapPin, Clock, ArrowRightLeft, User, Users, List, ChevronLeft, ChevronRight, Hourglass } from 'lucide-react';

const ScheduleView: React.FC = () => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [swapMode, setSwapMode] = useState(false);
  const [swapSource, setSwapSource] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date(2024, 11, 1)); // December 2024

  useEffect(() => {
    // Sort by date then time
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

  const handleUpdate = (id: string, field: keyof TrainingSession, value: any) => {
    const updatedSessions = sessions.map(s => {
        if (s.id === id) {
            const updated = { ...s, [field]: value };
            updateSession(updated);
            return updated;
        }
        return s;
    });
    setSessions(updatedSessions);
  };

  const handleSwapSelect = (id: string) => {
      if (!swapSource) {
          setSwapSource(id);
      } else {
          // Perform swap logic
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
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    // 0 = Sunday, 1 = Monday, ...
    let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Convert to Monday start (0 = Monday, 6 = Sunday)
    return day === 0 ? 6 : day - 1;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50 border border-slate-100/50"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const daySessions = sessions.filter(s => s.date === dateStr);
      const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth();

      days.push(
        <div key={day} className={`min-h-[9rem] bg-white border border-slate-100 p-1.5 transition-colors hover:bg-slate-50 relative group ${isToday ? 'bg-orange-50/30' : ''}`}>
          <div className={`text-sm font-semibold mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-orange-500 text-white' : 'text-slate-700'}`}>
            {day}
          </div>
          <div className="space-y-1.5">
            {daySessions.map(session => (
              <div 
                key={session.id}
                className={`text-[10px] px-2 py-1.5 rounded border-l-2 truncate cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-md hover:z-10 relative
                  ${session.department === 'Ban Media' 
                    ? 'bg-purple-50 text-purple-700 border-purple-500' 
                    : session.department === 'Ban Event'
                      ? 'bg-orange-50 text-orange-700 border-orange-500'
                      : 'bg-blue-50 text-blue-700 border-blue-500'
                  }
                `}
                title={`${session.startTime} - ${session.topic} - ${session.trainerName} - ${session.locationDetail}`}
              >
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800 capitalize">
                    Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
                </h3>
                <div className="flex space-x-1">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-colors"><ChevronLeft size={20}/></button>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-1.5 hover:bg-white rounded-lg text-slate-500 transition-colors"><ChevronRight size={20}/></button>
                </div>
            </div>
            
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/50">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => (
                    <div key={d} className="py-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wide">
                        {d}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 bg-slate-100 gap-px border-l border-slate-100">
                {days}
            </div>
        </div>
    );
  };

  const renderDaySchedule = (dateStr: string) => {
    const daySessions = sessions.filter(s => s.date === dateStr);
    
    // Format label using Date object and manual formatting
    const dateObj = new Date(dateStr);
    const dayName = new Intl.DateTimeFormat('vi-VN', { weekday: 'long' }).format(dateObj);
    const dateFormatted = formatDate(dateStr);
    
    // Generate subtitle based on departments present
    const depts = Array.from(new Set(daySessions.map(s => s.department))).join(', ');
    const label = `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} - ${dateFormatted}`;

    return (
        <div key={dateStr} className="mb-10 relative animate-in slide-in-from-bottom-4 duration-500">
            <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur py-4 mb-4 flex items-center border-b border-slate-200">
                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg font-bold text-sm mr-3 border border-orange-200">
                    {dateFormatted}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">
                        {label}
                    </h3>
                    {depts && <p className="text-xs text-slate-500 font-medium truncate max-w-[300px] md:max-w-none">Training: {depts}</p>}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {daySessions.map(session => {
                    const isSwapSelected = swapSource === session.id;
                    const isSwapTarget = swapMode && !swapSource;
                    const isEditing = editingId === session.id;

                    return (
                        <div 
                            key={session.id} 
                            onClick={() => swapMode ? handleSwapSelect(session.id) : null}
                            className={`
                                relative group overflow-hidden bg-white rounded-2xl border transition-all duration-200
                                ${isSwapSelected 
                                    ? 'border-blue-500 ring-2 ring-blue-200 shadow-xl scale-[1.02] z-20' 
                                    : 'border-slate-200 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/5'
                                }
                                ${isSwapTarget ? 'cursor-pointer hover:bg-blue-50/50' : ''}
                            `}
                        >
                            {/* Decorative side bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${session.department === 'Ban Media' ? 'bg-purple-500' : session.department === 'Ban Event' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>

                            <div className="p-5 pl-7">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center text-slate-800 font-bold text-lg">
                                        <Clock size={18} className="mr-2 text-slate-400"/>
                                        {isEditing ? (
                                            <input 
                                                type="time" 
                                                value={session.startTime}
                                                onChange={(e) => handleUpdate(session.id, 'startTime', e.target.value)}
                                                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm focus:border-orange-500 outline-none w-24"
                                            />
                                        ) : (
                                            <span>{session.startTime} <span className="text-sm font-normal text-slate-400 ml-1">({session.duration}')</span></span>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                                        session.department === 'Ban Media' ? 'bg-purple-50 text-purple-700' : 
                                        session.department === 'Ban Event' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
                                    }`}>
                                        {session.department}
                                    </span>
                                </div>

                                <h4 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1" title={session.topic}>{session.topic}</h4>
                                
                                <div className="flex items-center text-sm text-slate-500 mb-4">
                                    <User size={14} className="mr-1.5" />
                                    <span className="truncate max-w-[200px]">{session.trainerName || 'Chưa có Trainer'}</span>
                                </div>

                                <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <div className="flex items-center text-sm font-medium text-slate-700">
                                        <div className={`p-1.5 rounded-full mr-2 ${session.locationType === LocationType.HALL ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {session.locationType === LocationType.HALL ? <Users size={14}/> : <MapPin size={14}/>}
                                        </div>
                                        {isEditing ? (
                                            <div className="flex flex-col gap-2">
                                                <select 
                                                    value={session.locationType}
                                                    onChange={(e) => handleUpdate(session.id, 'locationType', e.target.value)}
                                                    className="bg-slate-50 border rounded p-1 text-xs"
                                                >
                                                    <option value={LocationType.CLASSROOM}>{LocationType.CLASSROOM}</option>
                                                    <option value={LocationType.HALL}>{LocationType.HALL}</option>
                                                </select>
                                                {session.locationType === LocationType.HALL ? (
                                                    <select
                                                        value={session.locationDetail}
                                                        onChange={(e) => handleUpdate(session.id, 'locationDetail', e.target.value)}
                                                        className="bg-slate-50 border rounded p-1 text-xs w-24"
                                                    >
                                                        <option value="Hall A">Hall A</option>
                                                        <option value="Hall B">Hall B</option>
                                                    </select>
                                                ) : (
                                                    <input 
                                                        type="text"
                                                        placeholder="Số phòng..."
                                                        value={session.locationDetail}
                                                        onChange={(e) => handleUpdate(session.id, 'locationDetail', e.target.value)}
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
                                            onClick={() => setEditingId(editingId === session.id ? null : session.id)}
                                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                                                editingId === session.id 
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                        >
                                            {editingId === session.id ? 'Lưu' : 'Sửa'}
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

  // Get unique dates for List View
  const uniqueDates = Array.from(new Set(sessions.map(s => s.date))).sort() as string[];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 sticky top-20 md:top-0 z-20">
        <div>
            <h2 className="text-xl font-bold text-slate-800">Lịch Training</h2>
            <p className="text-sm text-slate-500">Xem và quản lý lịch trình chi tiết</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-slate-100 p-1 rounded-xl">
            <button 
                onClick={() => { setViewMode('list'); setSwapMode(false); }}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <List size={16} className="mr-2"/> Danh Sách
            </button>
            <button 
                onClick={() => { setViewMode('calendar'); setSwapMode(false); }}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <CalendarIcon size={16} className="mr-2"/> Lịch Tháng
            </button>
        </div>

        {viewMode === 'list' && (
            <button 
                onClick={() => {
                    setSwapMode(!swapMode);
                    setSwapSource(null);
                }}
                className={`flex items-center px-5 py-2.5 rounded-xl transition-all font-bold text-sm shadow-sm ml-auto
                    ${swapMode 
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }
                `}
            >
                <ArrowRightLeft size={18} className={`mr-2 transition-transform ${swapMode ? 'rotate-180' : ''}`}/>
                {swapMode ? 'Đang bật Đổi lịch' : 'Đổi lịch'}
            </button>
        )}
      </div>

      {swapMode && viewMode === 'list' && (
          <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl text-sm flex items-center justify-center animate-in fade-in slide-in-from-top-2">
             <div className="bg-white p-2 rounded-full mr-3 shadow-sm text-blue-600">
                <ArrowRightLeft size={16} />
             </div>
             {swapSource 
                ? <span className="font-medium">Bước 2: Chọn slot thứ hai để hoán đổi vị trí.</span>
                : <span className="font-medium">Bước 1: Chọn slot đầu tiên bạn muốn đổi lịch.</span>
             }
          </div>
      )}

      <div className="pb-20">
        {viewMode === 'list' ? (
            uniqueDates.length > 0 ? (
                uniqueDates.map(date => renderDaySchedule(date))
            ) : (
                <div className="text-center py-20 text-slate-400">Chưa có lịch training nào.</div>
            )
        ) : (
            renderCalendar()
        )}
      </div>
    </div>
  );
};

export default ScheduleView;
