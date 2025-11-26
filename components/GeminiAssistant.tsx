import React, { useState } from 'react';
import { generateTrainingOutline } from '../services/geminiService';
import { Sparkles, X, Loader2, Copy, MessageSquare } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTopic: string;
  initialRequirements: string;
}

const GeminiAssistant: React.FC<Props> = ({ isOpen, onClose, initialTopic, initialRequirements }) => {
  const [topic, setTopic] = useState(initialTopic);
  const [reqs, setReqs] = useState(initialRequirements);
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setTopic(initialTopic);
      setReqs(initialRequirements);
      setResult('');
    }
  }, [isOpen, initialTopic, initialRequirements]);

  const handleGenerate = async () => {
    if (!process.env.API_KEY) {
        setResult("Vui lòng cấu hình API_KEY trong file môi trường để sử dụng tính năng này.");
        return;
    }
    setLoading(true);
    const text = await generateTrainingOutline(topic, reqs);
    setResult(text);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
          <div className="flex items-center text-slate-800">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white mr-3 shadow-lg shadow-purple-500/20">
                <Sparkles size={20} />
            </div>
            <div>
                <h3 className="font-bold text-lg leading-tight">AI Trợ Lý Giáo Trình</h3>
                <p className="text-xs text-slate-500">Powered by Gemini</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
            <div className="grid gap-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Chủ đề Training</label>
                    <input 
                        type="text" 
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all"
                        placeholder="Nhập chủ đề..."
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Yêu cầu & Mục tiêu</label>
                    <textarea 
                        value={reqs}
                        onChange={(e) => setReqs(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 h-24 text-slate-800 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-50 outline-none transition-all resize-none"
                        placeholder="Nhập các yêu cầu cần có trong buổi training..."
                    />
                </div>
            </div>

            {result && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 bg-slate-100/50 flex justify-between items-center">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center">
                        <MessageSquare size={14} className="mr-2 text-purple-600"/> Gợi ý từ Gemini
                    </h4>
                    <button 
                        onClick={() => navigator.clipboard.writeText(result)}
                        className="text-xs flex items-center font-medium text-slate-500 hover:text-purple-600 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm hover:shadow transition-all"
                    >
                        <Copy size={12} className="mr-1.5"/> Sao chép
                    </button>
                </div>
                <div className="p-5 prose prose-sm prose-slate max-w-none bg-white">
                  <div className="whitespace-pre-line leading-relaxed text-slate-600">
                      {result}
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl mr-3 transition-colors"
          >
            Đóng
          </button>
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 hover:shadow-lg disabled:opacity-70 disabled:hover:shadow-none transition-all"
          >
            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : <Sparkles className="mr-2 text-purple-300" size={18}/>}
            {loading ? 'Đang suy nghĩ...' : 'Tạo Outline'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiAssistant;