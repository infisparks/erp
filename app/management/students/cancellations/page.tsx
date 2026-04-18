"use client"

import React, { useState, useEffect } from "react"
import { 
  Search, 
  FileText, 
  Download,
  Filter,
  Loader2,
  ShieldCheck,
  ChevronRight
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import Link from "next/link"

// --- UI Components ---
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function CancellationManagement() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const fetchRequests = async () => {
    setLoading(true)
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('cancellation_requests')
      .select(`
        *,
        student:students (
          id,
          fullname,
          registration_no,
          photo_path,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (data) setRequests(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const filteredRequests = dRequests().filter(req => 
    req.student.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.student.registration_no.toLowerCase().includes(searchQuery.toLowerCase())
  ).filter(req => {
    if (activeTab === "all") return true
    return req.status === activeTab
  })

  // Helper to ensure data matches expected structure even if empty
  function dRequests() { return requests || [] }

  return (
    <div className="min-h-screen bg-[#F5F6F8] font-poppins selection:bg-indigo-100 selection:text-indigo-900">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        .font-poppins { font-family: 'Poppins', sans-serif !important; }
      `}</style>

      {/* --- Page Header --- */}
      <div className="p-10 pb-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-[11px] font-bold text-indigo-600 uppercase tracking-[0.2em] mb-1">
                <ShieldCheck size={16} />
                <span>Admission Management</span>
             </div>
             <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Withdrawal Requests</h1>
             <p className="text-[14px] text-slate-500 font-medium">Manage and process student admission cancellations.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="h-12 px-6 rounded-2xl bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs shadow-sm">
                <Download size={16} className="mr-2" />
                Export Ledger
             </Button>
          </div>
        </div>

        {/* --- Toolbar Section --- */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8">
           {/* Navigation Tabs */}
           <div className="flex items-center bg-[#EBEDF2] p-1.5 rounded-2xl w-full lg:w-auto">
              {["all", "pending", "approved", "rejected"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[12px] font-bold tracking-tight transition-all capitalize",
                    activeTab === tab 
                      ? "bg-white text-indigo-600 shadow-sm" 
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {tab === 'all' ? 'All Requests' : tab}
                </button>
              ))}
           </div>

           <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-80">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <Input 
                   placeholder="Search student identity..." 
                   className="h-12 pl-11 bg-white border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all text-[13px] font-medium placeholder:text-slate-400"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
              </div>
              <Button variant="outline" className="h-12 px-5 rounded-2xl bg-white border-slate-200 text-slate-600 font-bold text-xs hover:border-indigo-400 transition-all">
                 <Filter size={16} className="mr-2" />
                 Filter
              </Button>
           </div>
        </div>

        {/* --- Data Table --- */}
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                       <th className="pl-10 pr-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Student Identity</th>
                       <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Year</th>
                       <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Cancellation Reason</th>
                       <th className="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                       <th className="pl-6 pr-10 py-5 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-32 text-center">
                          <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto opacity-40" />
                        </td>
                      </tr>
                    ) : filteredRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-all group">
                         <td className="pl-10 pr-6 py-5">
                            <div className="flex items-center gap-4">
                               <Avatar className="h-12 w-12 border-2 border-white shadow-sm shrink-0">
                                  <AvatarImage src={req.student.photo_path} />
                                  <AvatarFallback className="bg-indigo-50 text-indigo-600 font-bold text-xs">{req.student.fullname[0]}</AvatarFallback>
                               </Avatar>
                               <div className="flex flex-col">
                                  <span className="text-[14px] font-bold text-[#111827] group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{req.student.fullname}</span>
                                  <span className="text-[11px] font-semibold text-slate-400">REG: {req.student.registration_no}</span>
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-5">
                            <span className="text-[13px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{req.cancel_year}</span>
                         </td>
                         <td className="px-6 py-5">
                            <span className="text-[13px] text-slate-600 font-medium line-clamp-1 max-w-[250px]">{req.reason}</span>
                         </td>
                         <td className="px-6 py-5 text-center">
                            <Badge className={cn(
                              "text-[10px] font-bold uppercase px-3 py-1 rounded-lg border",
                              req.status === 'approved' 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                : req.status === 'rejected' 
                                  ? "bg-rose-50 text-rose-700 border-rose-100" 
                                  : "bg-amber-50 text-amber-700 border-amber-100"
                            )}>
                               {req.status}
                            </Badge>
                         </td>
                         <td className="pl-6 pr-10 py-5 text-right">
                            <Button 
                              variant="ghost" 
                              asChild
                              className="text-indigo-600 hover:text-white hover:bg-indigo-600 font-bold text-[11px] h-10 px-5 rounded-xl transition-all shadow-sm"
                            >
                               <Link href={`/management/students/cancellations/${req.id}`} className="flex items-center gap-2">
                                  Deep Review
                                  <ChevronRight size={14} />
                               </Link>
                            </Button>
                         </td>
                      </tr>
                    ))}
                    {!loading && filteredRequests.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">No requests found in this segment</p>
                        </td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  )
}
