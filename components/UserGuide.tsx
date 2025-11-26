
import React from 'react';
import { Shield, BookOpen, User, Settings, Edit, Calendar, CheckCircle2, Clock, MapPin, ExternalLink } from 'lucide-react';

const UserGuide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Intro */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-8 text-white shadow-lg">
          <h2 className="text-3xl font-bold mb-2">Hướng Dẫn Sử Dụng Hệ Thống</h2>
          <p className="opacity-90">Tài liệu chi tiết về quy trình training, phân quyền và cách sử dụng các tính năng cho Cóc Sài Gòn.</p>
      </div>

      {/* Workflow - 5 Steps (Requested Specific Feature) */}
      <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-800 flex items-center">
              <BookOpen className="mr-3 text-orange-600" /> Quy Trình Triển Khai Giáo Án (5 Bước)
          </h3>
          <div className="grid gap-6 md:grid-cols-1 relative">
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200 hidden md:block"></div>
              
              <div className="relative pl-0 md:pl-16">
                  <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-slate-900 rounded-full items-center justify-center text-white font-bold border-4 border-white shadow-md z-10">1</div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                         <span className="md:hidden bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                         <h4 className="font-bold text-slate-800 text-lg">Khởi tạo yêu cầu (Manager/Admin)</h4>
                      </div>
                      <p className="text-slate-600 text-sm">Mentor, Trưởng ban/ Phó ban đăng nhập vào <strong>CMS Admin</strong> {'>'} <strong>Quản lý Khung Giáo Án</strong>. Tại đây, tạo các "Slot Training" mới, điền rõ: Tên bài, Ngày giờ, Địa điểm và quan trọng nhất là <strong>Yêu cầu nội dung (Requirements)</strong> để team có cơ sở soạn bài.</p>
                  </div>
              </div>

              <div className="relative pl-0 md:pl-16">
                  <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-blue-600 rounded-full items-center justify-center text-white font-bold border-4 border-white shadow-md z-10">2</div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                         <span className="md:hidden bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                         <h4 className="font-bold text-slate-800 text-lg">Phân công nhân sự</h4>
                      </div>
                      <p className="text-slate-600 text-sm">Trong lúc tạo hoặc sửa Slot Training, Manager chọn đích danh <strong>Người Duyệt (Reviewer)</strong> và nhập tên <strong>Người Trainer</strong> dự kiến. Thiết lập <strong>Deadline</strong> nộp giáo án.</p>
                  </div>
              </div>

              <div className="relative pl-0 md:pl-16">
                  <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-purple-600 rounded-full items-center justify-center text-white font-bold border-4 border-white shadow-md z-10">3</div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                         <span className="md:hidden bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                         <h4 className="font-bold text-slate-800 text-lg">Soạn & Nộp giáo án (Thành viên)</h4>
                      </div>
                      <p className="text-slate-600 text-sm">
                          Thành viên truy cập mục <strong>Quản Lý Giáo Án</strong> ngoài trang chủ (không cần đăng nhập Admin).
                          <br/>- Tìm bài training của mình.
                          <br/>- Bấm nút <strong>Chỉnh sửa</strong> (Icon bút chì).
                          <br/>- Dán link tài liệu (Google Slide/Doc) vào ô "Link Giáo Án".
                          <br/>- Đổi trạng thái sang <strong>"Đang Kiểm Tra"</strong>.
                          <br/>- <em>(Có thể dùng tính năng AI Gợi ý Outline để tham khảo ý tưởng).</em>
                      </p>
                  </div>
              </div>

              <div className="relative pl-0 md:pl-16">
                  <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-orange-500 rounded-full items-center justify-center text-white font-bold border-4 border-white shadow-md z-10">4</div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                         <span className="md:hidden bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                         <h4 className="font-bold text-slate-800 text-lg">Kiểm tra & Phản hồi (Reviewer)</h4>
                      </div>
                      <p className="text-slate-600 text-sm">
                          Người Duyệt vào xem Link Giáo án.
                          <br/>- Nếu cần sửa: Đổi trạng thái sang <strong>"Chỉnh Lại"</strong> và nhắn tin trực tiếp cho thành viên (hoặc ghi chú vào file).
                          <br/>- Thành viên sửa xong thì nộp lại (lặp lại bước 3).
                      </p>
                  </div>
              </div>

              <div className="relative pl-0 md:pl-16">
                  <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-green-500 rounded-full items-center justify-center text-white font-bold border-4 border-white shadow-md z-10">5</div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-2">
                         <span className="md:hidden bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">5</span>
                         <h4 className="font-bold text-slate-800 text-lg">Phê duyệt (Approved)</h4>
                      </div>
                      <p className="text-slate-600 text-sm">Khi giáo án đã đạt yêu cầu, Người Duyệt đổi trạng thái sang <strong>"Đã Duyệt"</strong>. Quy trình hoàn tất, sẵn sàng cho buổi Training.</p>
                  </div>
              </div>
          </div>
      </div>

      {/* Feature Details */}
      <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center border-b pb-2">
                  <Calendar className="mr-2 text-slate-500"/> Chi tiết: Lịch Training
              </h3>
              <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>Mục này giúp mọi người xem tổng quan thời gian biểu.</p>
                  <ul className="list-disc pl-5 space-y-1">
                      <li><strong>Chế độ Danh sách:</strong> Xem chi tiết từng ngày, từng giờ.</li>
                      <li><strong>Chế độ Lịch tháng:</strong> Xem cái nhìn bao quát cả tháng 12.</li>
                      <li><strong>Đổi lịch:</strong> Bấm nút "Đổi lịch" {'>'} Chọn Slot A {'>'} Chọn Slot B để hoán đổi thời gian cho nhau (dành cho trường hợp trùng lịch bận đột xuất).</li>
                  </ul>
              </div>
          </div>

          <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center border-b pb-2">
                  <User className="mr-2 text-slate-500"/> Chi tiết: Ban Điều Hành
              </h3>
              <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                  <p>Nơi hiển thị thông tin liên lạc của các anh chị Mentor, Chủ nhiệm.</p>
                  <ul className="list-disc pl-5 space-y-1">
                      <li>Bấm vào Email để gửi mail nhanh.</li>
                      <li>Danh sách này được quản lý bởi Super Admin.</li>
                  </ul>
              </div>
          </div>
      </div>

      {/* Admin Roles */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
             <Shield className="mr-2 text-slate-800"/> Phân Quyền Quản Trị
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
              <div>
                  <h4 className="font-bold text-yellow-600 text-sm uppercase mb-2">1. Super Admin</h4>
                  <p className="text-xs text-slate-500 mb-2">(Email: thanhtailai2003@gmail.com)</p>
                  <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1">
                      <li>Toàn quyền hệ thống.</li>
                      <li>Cấu hình Logo, Tên web.</li>
                      <li>Thêm/Xóa nhân sự Ban điều hành.</li>
                      <li>Quản lý Master Data các bài training.</li>
                  </ul>
              </div>
              <div>
                  <h4 className="font-bold text-blue-600 text-sm uppercase mb-2">2. Manager (Mentor/Trưởng Ban)</h4>
                  <p className="text-xs text-slate-500 mb-2">(Email nằm trong DS Ban Điều Hành)</p>
                  <ul className="text-sm text-slate-700 list-disc pl-5 space-y-1">
                      <li>Chỉ truy cập được tab <strong>"Quản lý Khung Giáo Án"</strong>.</li>
                      <li>Được phép Thêm/Sửa/Xóa các slot training.</li>
                      <li>Không nhìn thấy cấu hình hệ thống và danh sách nhân sự.</li>
                  </ul>
              </div>
          </div>
      </div>

    </div>
  );
};

export default UserGuide;
