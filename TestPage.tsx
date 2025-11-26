import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient"; // file bạn đã tạo ở trước đó

export default function TestPage() {
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      // Lấy toàn bộ dữ liệu trong bảng sessions
      const { data, error } = await supabase.from("sessions").select("*");
      if (error) {
        console.error("Lỗi kết nối Supabase:", error);
      } else {
        setSessions(data);
      }
    }

    loadData();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Danh sách buổi training (Test Supabase)</h1>
      {sessions.length === 0 ? (
        <p>Không có dữ liệu hoặc chưa kết nối được.</p>
      ) : (
        <ul>
          {sessions.map((item) => (
            <li key={item.id}>
              <b>{item.title}</b> – {item.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
