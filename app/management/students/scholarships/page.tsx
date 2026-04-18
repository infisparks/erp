"use client"

import React, { useState, useEffect } from "react"
import { 
  GraduationCap, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Search, 
  Filter, 
  Eye, 
  ArrowRight,
  Download,
  ShieldCheck,
  User,
  IndianRupee,
  Clock,
  ExternalLink,
  ClipboardList,
  FileText
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function ManagementScholarshipPage() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<any[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [categories, setCategories] = useState<any[]>([])

  const fetchRequests = async () => {
    setLoading(true)
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('student_academic_years')
      .select(`
        *,
        students (
           id,
           fullname,
           email,
           student_mobile_no,
           courses (name)
        )
      `)
      .not('scholarship_application_id', 'is', null)
      .order('created_at', { ascending: false })

    if (data) setRequests(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchRequests()
    ;(async () => {
       const supabase = getSupabaseClient()
       const { data } = await supabase.from('scholarship_categories').select('*')
       if (data) setCategories(data)
    })()
  }, [])

  const filteredRequests = requests.filter(r => {
    const matchesSearch = r.students?.fullname?.toLowerCase().includes(search.toLowerCase()) || 
                          r.scholarship_application_id?.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || r.scholarship_status === filter
    return matchesSearch && matchesFilter
  })

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-emerald-600 outline-none" />
      <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400">Loading Applications</p>
    </div>
  )

  return (
    <div className="space-y-6 font-poppins">
       {/* Compact Header */}
       <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
          <div className="space-y-0.5">
             <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Scholarships <span className="text-emerald-600">Verification</span></h2>
             <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider">MahaDBT Institutional Hub</p>
          </div>
          <div className="flex items-center gap-2">
             <Button variant="outline" className="h-9 px-4 rounded-xl border-slate-200 text-slate-500 font-medium text-[11px] uppercase tracking-wide gap-1.5 hover:bg-slate-50">
                <ShieldCheck size={14} /> Audit Trail
             </Button>
          </div>
       </div>

       {/* Compact Filters */}
       <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex-1 relative group">
             <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
             <Input 
                placeholder="Search Student..." 
                className="h-10 pl-10 rounded-xl border-transparent bg-slate-50/50 focus:bg-white focus:border-slate-200 transition-all text-xs font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
             />
          </div>
          <div className="w-40 relative">
             <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
             <select 
                className="w-full h-10 pl-10 pr-4 rounded-xl border-transparent bg-slate-50/50 appearance-none text-xs font-medium text-slate-600 outline-none focus:bg-white focus:border-slate-200 transition-all cursor-pointer"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
             >
                <option value="all">All States</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
             </select>
          </div>
          <div className="px-4 text-slate-300 text-[9px] font-medium uppercase tracking-widest border-l border-slate-100 h-6 flex items-center">
             {filteredRequests.length} Total
          </div>
       </div>

       {/* Compact Table */}
       <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">Student</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">Year</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">Application</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">Status</th>
                      <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/30 transition-colors group">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                               <div className="h-8 w-8 bg-indigo-50/50 rounded-lg flex items-center justify-center text-indigo-400 shadow-sm">
                                  <User size={14} />
                               </div>
                               <div>
                                  <p className="text-[13px] font-medium text-slate-800 leading-none">{req.students?.fullname}</p>
                                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-1">{req.students?.courses?.name}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <p className="text-[12px] font-medium text-slate-800 leading-none">
                               {req.academic_year_name || "N/A"}
                            </p>
                            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                               {req.academic_year_session || "N/A"}
                            </p>
                         </td>
                         <td className="px-6 py-4">
                             <div className="space-y-0.5">
                               <p className="text-[12px] font-semibold text-slate-700">
                                  {categories.find(c => c.id === req.scholarship_category_id)?.name || "N/A"}
                               </p>
                               <p className="text-[10px] text-slate-400 font-medium">ID: {req.scholarship_application_id}</p>
                             </div>
                         </td>
                         <td className="px-6 py-4">
                            <Badge className={cn(
                               "text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shadow-none",
                               req.scholarship_status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                               req.scholarship_status === 'rejected' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100"
                            )}>
                               {req.scholarship_status}
                            </Badge>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                               <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                                  <Link href={`/management/students/scholarships/${req.id}`}>
                                     <Eye size={16} />
                                  </Link>
                               </Button>
                               <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                                  <Link href={`/management/students/status?student_id=${req.students?.id}`}>
                                     <ClipboardList size={16} />
                                  </Link>
                               </Button>
                            </div>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  )
}
