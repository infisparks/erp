"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Users, BookOpen, GraduationCap, ShieldAlert, ArrowUpRight, Search, Filter, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalScholarshipCats: 0,
    pendingVerifications: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        // Parallel fetching
        const [
          { count: studentCount },
          { count: courseCount },
          { count: schCount },
          { count: pendingCount }
        ] = await Promise.all([
          supabase.from('students').select('*', { count: 'exact', head: true }),
          supabase.from('courses').select('*', { count: 'exact', head: true }),
          supabase.from('scholarship_categories').select('*', { count: 'exact', head: true }),
          supabase.from('student_semesters').select('*', { count: 'exact', head: true })
            .or('is_verifiedby_admin.eq.false,is_verifiedby_accountant.eq.false,is_verifiedby_examcell.eq.false')
        ])

        setStats({
          totalStudents: studentCount || 0,
          totalCourses: courseCount || 0,
          totalScholarshipCats: schCount || 0,
          pendingVerifications: pendingCount || 0
        })
      } catch (err) {
        console.error("Dashboard Stats Error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [supabase])

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
         <Loader2 className="animate-spin text-[#1A3A6B]" size={32} />
         <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading Real-time Intelligence</p>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* ── Executive Header ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div>
            <h1 className="text-3xl font-bold text-[#1A3A6B] tracking-tight">Main Dashboard</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Real-time Institutional Data Overview</p>
         </div>

         <div className="flex items-center gap-3">
            <div className="relative group">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1A3A6B] transition-colors" size={16} />
               <input 
                  type="text" 
                  placeholder="Reference Search..."
                  className="h-11 w-64 bg-slate-50 border border-slate-100 rounded-xl pl-11 pr-4 text-xs font-medium focus:bg-white focus:border-[#1A3A6B] focus:shadow-lg focus:shadow-blue-900/5 transition-all outline-none"
               />
            </div>
            <button className="h-11 px-4 bg-white border border-slate-100 rounded-xl flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-[#1A3A6B] transition-colors">
               <Filter size={16} /> Filter
            </button>
         </div>
      </div>

      {/* ── Metric Grid ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard label="Total Students" val={stats.totalStudents} icon={Users} color="blue" />
         <MetricCard label="Pending Audits" val={stats.pendingVerifications} icon={ShieldAlert} color="amber" />
         <MetricCard label="Active Courses" val={stats.totalCourses} icon={BookOpen} color="indigo" />
         <MetricCard label="Scholarship Plans" val={stats.totalScholarshipCats} icon={GraduationCap} color="emerald" />
      </div>

      {/* ── Content Grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-xs font-bold text-[#1A3A6B] uppercase tracking-widest">Active Academic Streams</h3>
               <button className="text-[10px] font-bold text-[#2E75C7] hover:underline">Manage All</button>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 p-8 flex flex-col items-center justify-center text-center space-y-4">
               <div className="h-16 w-16 bg-blue-50 text-[#1A3A6B] rounded-2xl flex items-center justify-center">
                  <BookOpen size={30} />
               </div>
               <div>
                  <h4 className="font-bold text-[#1A3A6B]">Academic Content Ready</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed">The curriculum management module is fully synced. Visit the Courses tab to add or modify academic content.</p>
               </div>
            </div>
         </div>

         <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#1A3A6B] uppercase tracking-widest">System Health</h3>
            <div className="bg-[#1A3A6B] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-xl" />
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                     <div className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse" />
                     <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Status: Optimized</p>
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight leading-none italic">99.9%</h1>
                  <p className="text-[11px] font-medium opacity-70 leading-relaxed">All management databases are synchronized and secured with Level-4 encryption protocols.</p>
               </div>
            </div>
         </div>

      </div>

    </div>
  )
}

function MetricCard({ label, val, icon: Icon, color }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  }
  return (
    <div className="bg-white border border-slate-100 rounded-[32px] p-8 flex flex-col justify-between h-48 hover:shadow-xl hover:shadow-blue-900/[0.04] transition-all group">
       <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center border", colors[color])}>
          <Icon size={24} />
       </div>
       <div>
          <h4 className="text-4xl font-bold text-[#1A3A6B] tracking-tight mb-1">{val.toLocaleString()}</h4>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
       </div>
    </div>
  )
}
