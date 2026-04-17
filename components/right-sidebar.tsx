"use client"

import { FileText, GraduationCap, Megaphone, Bell, ArrowRight } from "lucide-react"

const announcements = [
  { icon: FileText,      color: "#B45309", bg: "#FFF3E0", title: "Exam Registration", desc: "Sem IV registration open until Oct 19", urgent: true },
  { icon: GraduationCap, color: "#2E75C7", bg: "#E8F2FF", title: "Scholarship",    desc: "Apply before Oct 30 deadline",          urgent: false },
  { icon: Megaphone,     color: "#7C3AED", bg: "#F0EBFF", title: "Holiday Notice",  desc: "Campus closed Oct 22 (Diwali)",          urgent: false },
]

export function RightSidebar() {
  return (
    <aside className="hidden xl:flex w-80 flex-col bg-white border-l border-gray-100 flex-shrink-0 h-screen sticky top-0 overflow-y-auto p-6 transition-all">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[#1A3A6B] font-black text-sm uppercase tracking-widest flex items-center gap-2">
          <Bell size={16} className="text-[#2E75C7]" />
          Announcements
        </h2>
        <span className="bg-red-50 text-red-500 text-[9px] font-black px-2 py-0.5 rounded-full border border-red-100 animate-pulse">
          3 NEW
        </span>
      </div>

      <div className="space-y-4">
        {announcements.map((item, i) => (
          <div key={i} className="group cursor-pointer">
            <div className="bg-[#F8FAFC] hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 rounded-2xl p-4 border border-transparent hover:border-gray-50 transition-all duration-300">
              <div className="flex items-start gap-4 mb-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform" 
                  style={{ backgroundColor: item.bg }}
                >
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
                <div>
                   <h3 className="text-[#1A3A6B] font-bold text-xs leading-tight mb-1 group-hover:text-[#2E75C7] transition-colors">
                    {item.title}
                  </h3>
                   <p className="text-gray-400 text-[10px] font-medium leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-100/50">
                <span className={`text-[8px] font-black uppercase tracking-widest ${item.urgent ? 'text-red-500' : 'text-gray-300'}`}>
                  {item.urgent ? 'Immediate Action' : 'Notice Board'}
                </span>
                <ArrowRight size={12} className="text-gray-200 group-hover:text-[#2E75C7] group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access Card */}
      <div className="mt-8 bg-gradient-to-br from-[#1A3A6B] to-[#2E75C7] rounded-3xl p-5 relative overflow-hidden shadow-2xl shadow-blue-900/20">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl" />
        <h4 className="text-white font-black text-xs uppercase tracking-widest mb-2 relative z-10">Help Desk</h4>
        <p className="text-white/60 text-[10px] font-medium mb-4 leading-relaxed relative z-10">
          Need assistance with your enrollment or fees? Our support team is here.
        </p>
        <button className="w-full py-2.5 bg-white text-[#1A3A6B] rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#F0F4F8] transition-colors relative z-10">
          Open Support Ticket
        </button>
      </div>

      <div className="mt-auto py-4">
        <div className="bg-[#F8FAFC] rounded-2xl p-3 flex items-center justify-between">
          <p className="text-gray-400 text-[8px] font-bold uppercase tracking-[0.2em]">Institutional Status</p>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-600 text-[8px] font-black uppercase">Online</span>
          </span>
        </div>
      </div>
    </aside>
  )
}
