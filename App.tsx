import React, { useState, useEffect } from 'react';
import { ViewState, Status, AdminUser, AppConfig, AdminRole } from './types';
import {
  getSessions,
  getAppConfig,
  getBoardMembers,
  subscribeDataChanges,
  waitForFirestoreReady,
} from './services/dataService';
import BoardInfo from './components/BoardInfo';
import CurriculumManager from './components/CurriculumManager';
import ScheduleView from './components/ScheduleView';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import UserGuide from './components/UserGuide';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Info,
  CheckCircle2,
  FileText,
  TrendingUp,
  Clock,
  Settings,
  ShieldBan,
  LogOut,
  BookMarked,
} from 'lucide-react';

const SUPER_ADMIN_EMAIL = 'thanhtailai2003@gmail.com';

const App: React.FC = () => {
  // ✅ Giữ lại view người dùng chọn lần cuối
  const [view, setView] = useState<ViewState>(() => {
    const savedView = localStorage.getItem('currentView');
    return (savedView as ViewState) || 'dashboard';
  });

  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });
  const [appConfig, setAppConfig] = useState<AppConfig>({
    logoUrl: 'default',
    title: 'Cóc Sài Gòn',
    subtitle: 'TRAINING MANAGER',
    welcomeTitle: '',
    welcomeDescription: '',
  });

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);  // To track if data is still loading
  const [statusFilter, setStatusFilter] = useState<Status | 'ALL'>('ALL'); // Lọc theo tình trạng
  const [sessions, setSessions] = useState([]);

  // 🔥 Mới thêm vào: Load data ngay lập tức từ Firestore khi trang reload
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true); // Set loading to true when data is being fetched

      await waitForFirestoreReady(); // Ensure Firestore is ready

      // Fetch the latest sessions and app config directly from Firestore
      const sessions = getSessions();

      // Sắp xếp lại dữ liệu sau khi lấy từ Firestore (sắp xếp theo Deadline)
      const sortedSessions = sessions.sort((a, b) => {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });

      const approved = sortedSessions.filter((s) => s.status === Status.APPROVED).length;
      const pending = sortedSessions.filter((s) => s.status === Status.PENDING).length;

      setStats({
        total: sortedSessions.length,
        approved,
        pending,
      });
      
      setAppConfig(getAppConfig());

      // Cập nhật sessions với dữ liệu đã sắp xếp
      setSessions(sortedSessions);
      setIsLoading(false); // Once data is fetched, set loading to false
    };

    loadData(); // Execute the data loading function
  }, []); // Only run this once when the component is mounted (on reload)

  // ✅ Lưu lại view mỗi khi người dùng đổi trang
  useEffect(() => {
    localStorage.setItem('currentView', view);
  }, [view]);

  const handleAdminLogin = (user: AdminUser) => {
    let role: AdminRole | undefined;
    if (user.email === SUPER_ADMIN_EMAIL) role = 'SUPER_ADMIN';
    else {
      const boardMembers = getBoardMembers();
      const isMember = boardMembers.find((m) => m.email === user.email);
      if (isMember) role = 'MANAGER';
    }
    setAdminUser({ ...user, roleType: role });
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    setView('dashboard');
  };

  const navItems = [
    { id: 'dashboard', label: 'Tổng Quan', icon: <LayoutDashboard size={20} /> },
    { id: 'curriculum', label: 'Quản Lý Giáo Án', icon: <BookOpen size={20} /> },
    { id: 'schedule', label: 'Lịch Training', icon: <Calendar size={20} /> },
    { id: 'board', label: 'BCN & BDH', icon: <Info size={20} /> },
    { id: 'guide', label: 'Hướng Dẫn Sử Dụng', icon: <BookMarked size={20} /> },
  ];

  const renderLogo = (size: 'sm' | 'md' = 'md') => {
    const isDefault = appConfig.logoUrl === 'default' || !appConfig.logoUrl;
    const dimension = size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl';
    if (isDefault)
      return (
        <div
          className={`${dimension} bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-orange-500/30`}
        >
          {appConfig.title.charAt(0)}
        </div>
      );
    return (
      <img
        src={appConfig.logoUrl}
        alt="Logo"
        className={`${dimension} object-contain bg-white shadow-md border border-slate-100`}
      />
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center p-10">Đang tải dữ liệu...</div>  // Show loading state until data is loaded
      );
    }

    // Lọc dữ liệu theo tình trạng
    const filteredSessions = statusFilter === 'ALL'
      ? sessions
      : sessions.filter((session) => session.status === statusFilter);

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Nút lọc theo tình trạng */}
        <div className="flex space-x-4">
          {Object.values(Status).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`${
                statusFilter === status
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-orange-50'
              } px-4 py-2 rounded-xl`}
            >
              {status === 'ALL' ? 'Tất cả' : status}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:shadow-md">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Tổng giáo án</p>
              <p className="text-2xl font-bold text-slate-800">{filteredSessions.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:shadow-md">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Đã duyệt</p>
              <p className="text-2xl font-bold text-slate-800">
                {filteredSessions.filter((s) => s.status === Status.APPROVED).length}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:shadow-md">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Tiến độ hoàn thành</p>
              <p className="text-2xl font-bold text-slate-800">
                {filteredSessions.length > 0
                  ? Math.round(
                      (filteredSessions.filter((s) => s.status === Status.APPROVED).length /
                        filteredSessions.length) *
                        100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>

        {/* Render danh sách giáo án */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {filteredSessions.map((session) => (
            <div key={session.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3>{session.topic}</h3>
              <p>{session.status}</p>
              {/* Add other session details here */}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans" onSubmit={(e) => e.preventDefault()}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 h-screen fixed top-0 left-0 z-30">
        <div className="p-8 flex items-center">
          <div className="mr-3">{renderLogo()}</div>
          <div>
            <h1 className="font-bold text-xl text-slate-800 leading-tight">{appConfig.title}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{appConfig.subtitle}</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <p className="px-4 text-xs font-bold text-slate-400 uppercase mb-2">Menu</p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`group flex items-center w-full px-4 py-3.5 rounded-xl font-medium text-sm ${
                view === item.id
                  ? 'bg-orange-50 text-orange-600 shadow-sm ring-1 ring-orange-100'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className={`mr-3 ${view === item.id ? 'text-orange-600' : 'text-slate-400'}`}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-2">
          <button
            onClick={() => setView('admin')}
            className={`w-full flex items-center px-4 py-3 rounded-xl font-medium text-sm ${
              view === 'admin' ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings size={18} className="mr-3" /> {adminUser ? 'CMS Admin' : 'Quản Trị Viên'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-72 p-4 md:p-10 pt-24 md:pt-10 max-w-7xl mx-auto w-full">
        <div>{renderContent()}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] flex justify-around py-2 md:hidden z-40">
        {[{ id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Home' },
          { id: 'curriculum', icon: <BookOpen size={20} />, label: 'Giáo án' },
          { id: 'schedule', icon: <Calendar size={20} />, label: 'Lịch' },
          { id: 'board', icon: <Info size={20} />, label: 'BCN' },
          { id: 'guide', icon: <BookMarked size={20} />, label: 'Hướng dẫn' },
          { id: 'admin', icon: <Settings size={20} />, label: 'Admin' }].map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as ViewState)}
            className={`flex flex-col items-center text-xs font-medium ${view === item.id ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {item.icon}
            <span className="mt-1">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default App;
