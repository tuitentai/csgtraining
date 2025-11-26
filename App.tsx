
import React, { useState, useEffect } from 'react';
import { ViewState, Status, AdminUser, AppConfig, AdminRole } from './types';
import { getSessions, getAppConfig, getBoardMembers } from './services/dataService';
import BoardInfo from './components/BoardInfo';
import CurriculumManager from './components/CurriculumManager';
import ScheduleView from './components/ScheduleView';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import UserGuide from './components/UserGuide';
import { LayoutDashboard, BookOpen, Calendar, Info, Menu, X, CheckCircle2, FileText, TrendingUp, Clock, Settings, ShieldBan, LogOut, BookMarked } from 'lucide-react';

const SUPER_ADMIN_EMAIL = 'thanhtailai2003@gmail.com';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });
  const [appConfig, setAppConfig] = useState<AppConfig>({ logoUrl: 'default', title: 'Cóc Sài Gòn', subtitle: 'TRAINING MANAGER', welcomeTitle: '', welcomeDescription: '' });
  
  // Admin State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    // Calculate simple stats for dashboard
    const sessions = getSessions();
    const approved = sessions.filter(s => s.status === Status.APPROVED).length;
    const pending = sessions.filter(s => s.status === Status.PENDING).length;
    setStats({
        total: sessions.length,
        approved,
        pending
    });
    
    // Load config
    setAppConfig(getAppConfig());
  }, [view]); // Recalculate when view changes

  const handleAdminLogin = (user: AdminUser) => {
    // Determine Role
    let role: AdminRole | undefined = undefined;
    
    // 1. Check Super Admin
    if (user.email === SUPER_ADMIN_EMAIL) {
        role = 'SUPER_ADMIN';
    } else {
        // 2. Check if user is a Board Member
        const boardMembers = getBoardMembers();
        const isMember = boardMembers.find(m => m.email === user.email);
        if (isMember) {
            role = 'MANAGER';
        }
    }

    if (role) {
        setAdminUser({ ...user, roleType: role });
    } else {
        // Logged in but unauthorized
        setAdminUser({ ...user, roleType: undefined });
    }
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
      
      if (isDefault) {
          return (
            <div className={`${dimension} bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-orange-500/30`}>
                {appConfig.title.charAt(0)}
            </div>
          );
      }
      return (
          <img src={appConfig.logoUrl} alt="Logo" className={`${dimension} object-contain bg-white shadow-md border border-slate-100`} />
      );
  };

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 text-white shadow-xl">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-yellow-300 opacity-20 rounded-full blur-2xl"></div>
                
                <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="hidden md:block shrink-0">
                         {appConfig.logoUrl !== 'default' && appConfig.logoUrl ? (
                             <img src={appConfig.logoUrl} alt="Logo" className="w-24 h-24 object-contain bg-white/90 backdrop-blur rounded-2xl p-2 shadow-lg"/>
                         ) : (
                             <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-4xl font-bold">
                                 {appConfig.title.charAt(0)}
                             </div>
                         )}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">{appConfig.welcomeTitle || `Xin chào ${appConfig.title}! 👋`}</h1>
                        <p className="text-orange-50 text-lg max-w-2xl opacity-90 font-light whitespace-pre-line leading-relaxed">
                            {appConfig.welcomeDescription || 'Hệ thống quản lý đào tạo chuyên nghiệp.'}
                        </p>
                        <div className="mt-8 flex flex-wrap gap-4">
                            <button 
                                onClick={() => setView('curriculum')}
                                className="bg-white text-orange-600 px-6 py-3 rounded-full font-bold shadow-lg shadow-orange-900/20 hover:bg-orange-50 hover:scale-105 transition-all active:scale-95"
                            >
                                Soạn Giáo Án Ngay
                            </button>
                            <button 
                                onClick={() => setView('schedule')}
                                className="bg-orange-800/30 backdrop-blur-sm border border-white/20 text-white px-6 py-3 rounded-full font-bold hover:bg-orange-800/40 transition-all"
                            >
                                Xem Lịch Training
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Tổng giáo án</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Đã duyệt</p>
                        <p className="text-2xl font-bold text-slate-800">{stats.approved}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4 hover:shadow-md transition-shadow">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Tiến độ hoàn thành</p>
                        <p className="text-2xl font-bold text-slate-800">
                            {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}%
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                     <BoardInfo />
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <Clock className="mr-2 text-orange-500" size={20}/> Sự kiện sắp tới
                    </h3>
                    <div className="space-y-4">
                         <div className="flex gap-4 items-start p-3 rounded-lg bg-slate-50">
                            <div className="bg-white border border-slate-200 rounded-lg p-2 text-center min-w-[60px]">
                                <span className="block text-xs font-bold text-orange-600 uppercase">Tháng 12</span>
                                <span className="block text-xl font-bold text-slate-800">06</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-800 text-sm">Training Ban Media</h4>
                                <p className="text-xs text-slate-500 mt-1">13:30 - 17:00 • Phòng Học</p>
                            </div>
                         </div>
                         <div className="flex gap-4 items-start p-3 rounded-lg bg-slate-50">
                            <div className="bg-white border border-slate-200 rounded-lg p-2 text-center min-w-[60px]">
                                <span className="block text-xs font-bold text-orange-600 uppercase">Tháng 12</span>
                                <span className="block text-xl font-bold text-slate-800">07</span>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-800 text-sm">Training Ban Event & ER</h4>
                                <p className="text-xs text-slate-500 mt-1">08:00 - 17:00 • Hall A & B</p>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
          </div>
        );
      case 'curriculum':
        return <CurriculumManager />;
      case 'schedule':
        return <ScheduleView />;
      case 'board':
        return <BoardInfo />;
      case 'guide':
        return <UserGuide />;
      case 'admin':
        if (!adminUser) {
            return <AdminLogin onLogin={handleAdminLogin} />;
        }
        
        // Access Control Check
        if (!adminUser.roleType) {
            return (
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 animate-in zoom-in-95">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <ShieldBan className="text-red-600" size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Truy cập bị từ chối</h2>
                    <p className="text-slate-500 text-center max-w-md mb-8">
                        Tài khoản <span className="font-bold text-slate-800">{adminUser.email}</span> không nằm trong danh sách Ban Điều Hành hoặc không có quyền quản trị.
                    </p>
                    <button 
                        onClick={handleAdminLogout}
                        className="flex items-center px-6 py-3 bg-white border border-slate-200 shadow-sm text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="mr-2" size={18} /> Đăng xuất
                    </button>
                </div>
            );
        }
        return <AdminPanel user={adminUser} onLogout={handleAdminLogout} />;
      default:
        return <div className="text-center p-10">404 - Not Found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-200 h-screen fixed top-0 left-0 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 flex items-center">
           <div className="mr-3">
               {renderLogo()}
           </div>
           <div>
               <h1 className="font-bold text-xl text-slate-800 leading-tight line-clamp-1">{appConfig.title}</h1>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{appConfig.subtitle}</p>
           </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Menu</p>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewState)}
              className={`group flex items-center w-full px-4 py-3.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                view === item.id 
                ? 'bg-orange-50 text-orange-600 shadow-sm ring-1 ring-orange-100' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className={`mr-3 transition-colors ${view === item.id ? 'text-orange-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {item.icon}
              </span>
              {item.label}
              {view === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-500"></div>}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-100 space-y-2">
            <button 
                onClick={() => setView('admin')}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                    view === 'admin' 
                    ? 'bg-slate-800 text-white shadow-lg' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
            >
                <Settings size={18} className="mr-3"/> 
                {adminUser && adminUser.email === SUPER_ADMIN_EMAIL ? 'CMS Admin' : 'Quản Trị Viên'}
            </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed w-full bg-white/80 backdrop-blur-md z-40 border-b border-slate-200 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center">
            <div className="mr-2">{renderLogo('sm')}</div>
            <span className="font-bold text-slate-800">{appConfig.title}</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-600 bg-slate-50 rounded-lg">
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-sm md:hidden pt-20" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-white mx-4 p-4 space-y-2 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-200" onClick={e => e.stopPropagation()}>
             {navItems.map(item => (
                <button
                key={item.id}
                onClick={() => {
                    setView(item.id as ViewState);
                    setIsMobileMenuOpen(false);
                }}
                className={`flex items-center w-full px-4 py-4 rounded-xl font-medium ${
                    view === item.id ? 'bg-orange-50 text-orange-600' : 'text-slate-700'
                }`}
                >
                <span className="mr-4">{item.icon}</span>
                {item.label}
                </button>
            ))}
            <div className="border-t border-slate-100 my-2 pt-2">
                <button
                    onClick={() => {
                        setView('admin');
                        setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full px-4 py-4 rounded-xl font-medium ${
                        view === 'admin' ? 'bg-slate-800 text-white' : 'text-slate-700'
                    }`}
                >
                    <span className="mr-4"><Settings size={20}/></span>
                    Quản Trị Viên
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-10 pt-24 md:pt-10 transition-all duration-300 max-w-7xl mx-auto w-full">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
