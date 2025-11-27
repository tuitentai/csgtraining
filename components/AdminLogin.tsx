import React, { useState } from 'react';
import { AdminUser } from '../types';
import { Lock, Loader2, Mail, ShieldAlert } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../services/firebaseService';  // Import Firebase Auth

interface Props {
  onLogin: (user: AdminUser) => void;
}

const AdminLogin: React.FC<Props> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Thay đổi từ email thủ công sang đăng nhập Firebase
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sign-in using Google
      const res = await signInWithPopup(auth, provider);
      const u = res.user;
      
      // Lấy thông tin người dùng và call onLogin
      onLogin({
        email: (u.email || '').toLowerCase(),
        name: u.displayName || 'User',
        avatar: u.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || 'User')}&background=0f172a&color=fff`
      });
    } catch (err) {
      console.error(err);
      alert('Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-slate-900 p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 ring-4 ring-slate-800 border-2 border-slate-700">
                <Lock className="text-orange-500" size={28} />
            </div>
            <h2 className="text-xl font-bold text-white">Admin Portal</h2>
            <p className="text-slate-400 text-sm mt-1">Hệ thống quản trị tập trung</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
              <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Google Email</label>
                  <div className="relative group">
                      <Mail className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-orange-500 transition-colors" size={18}/>
                      <input 
                        type="email"
                        required
                        placeholder="example@cocsaigon.vn"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-800 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all font-medium"
                      />
                  </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-slate-900/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:shadow-none"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin mr-2" size={20} />
                ) : null}
                {isLoading ? 'Đang xác thực...' : 'Đăng Nhập với Google'}
              </button>
          </form>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
            <ShieldAlert className="text-blue-600 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-blue-800 leading-relaxed">
                <span className="font-bold">Lưu ý phân quyền:</span>
                <br/>
                Các <span className="font-bold">Mentor, Trưởng Ban, Phó Ban</span> vui lòng sử dụng email đã cung cấp cho Cóc Sài Gòn để đăng nhập và chỉnh sửa.
                <br/>
                <span className="opacity-75 mt-1 block text-[10px]">(Mọi vấn đề liên hệ em Tài)</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminLogin;
