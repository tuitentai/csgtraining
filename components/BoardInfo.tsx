import React, { useState, useEffect } from 'react';
import { getBoardMembers } from '../services/dataService';
import { BoardMember } from '../types';
import { Users, Mail, ShieldCheck } from 'lucide-react';

const BoardInfo: React.FC = () => {
  const [members, setMembers] = useState<BoardMember[]>([]);

  useEffect(() => {
    setMembers(getBoardMembers());
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 flex items-center">
          <ShieldCheck className="mr-2 text-orange-500" size={24} /> Ban Điều Hành & Ban Chủ Nhiệm
        </h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {members.map((member) => (
            <div key={member.id} className="group relative bg-white border border-slate-100 rounded-xl p-5 hover:shadow-lg hover:shadow-orange-500/5 hover:border-orange-200 transition-all duration-300">
                <div className="flex items-center space-x-4">
                <div className="relative shrink-0">
                    <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 truncate group-hover:text-orange-600 transition-colors">{member.name}</h3>
                    <p className="text-sm text-orange-600 font-medium truncate mb-1">{member.role}</p>
                    <a 
                        href={`mailto:${member.email}`} 
                        title={member.email}
                        className="inline-flex items-center text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 px-2 py-1 -ml-2 rounded-md transition-colors w-full"
                    >
                        <Mail size={12} className="mr-1.5 shrink-0" />
                        <span className="truncate">{member.email}</span>
                    </a>
                </div>
                </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default BoardInfo;