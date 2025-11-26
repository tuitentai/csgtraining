import React, { useState } from 'react';
import { AdminUser } from '../types';
import { Lock, Loader2, ShieldAlert } from 'lucide-react';
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../services/firebase";

interface Props {
  onLogin: (user: AdminUser) => void;
}

const AdminLogin: React.FC<Props> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mở popup đăng nhập Google thật
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Gửi dữ liệu user thật về App
      onLogin({
        email: user.email || "",
        name: user.displayName || "Người dùng",
        avatar:
          user.photoURL ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.displayName || "User"
          )}&background=0f172a&color=fff`,
      });
    } catch (error) {
      console.error(error);
      alert("Đăng nhập thất bại. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 ring-4 ring-slate-800 border-2 border-slate-700">
            <Lock className="text-orange-500" size={28} />
          </div>
          <h2 className="text-xl font-bold text-white">Admin Portal</h2>
          <p className="text-slate-400 text-sm mt-1">
            Hệ thống quản trị tập trung
          </p>
        </div>

        {/* Login Form */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center px-6 py-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-slate-900/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Đang xác thực...
                </>
              ) : (
                "Đăng nhập với Google"
              )}
            </button>
          </form>

          {/* Note */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
            <ShieldAlert className="text-blue-600 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-blue-800 leading-relaxed">
              <span className="font-bold">Lưu ý phân quyền:</span>
              <br />
              Các{" "}
              <span className="font-bold">
                Mentor, Trưởng Ban, Phó Ban
              </span>{" "}
              vui lòng sử dụng email đã cung cấp cho Cóc Sài Gòn để đăng nhập và
              chỉnh sửa.
              <br />
              <span className="opacity-75 mt-1 block text-[10px]">
                (Mọi vấn đề liên hệ em Tài)
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
