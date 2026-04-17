"use client"

import React, { useState, useMemo } from "react"
import {
  LayoutDashboard, Wallet, Search, Bell, Filter, Download,
  ArrowUpRight, DollarSign, Users, ChevronDown, ChevronLeft,
  ChevronRight, RefreshCw, XCircle, FileText, Calendar,
  CheckCircle2, AlertCircle, PieChart, BarChart3, TrendingUp,
  Landmark, ArrowRight, Activity, BookOpen
} from "lucide-react"

// --- TYPES ---
type ViewState = "dashboard" | "outstanding" | "analytics" | "student-detail"

interface StudentFeeRecord {
  id: string; rollNo: string; name: string; branch: string;
  year: string; quota: string; totalFees: number; feesPaid: number;
  balStudent: number; balScholarship: number; totalBal: number;
  remark: string; status: "Paid" | "Partial" | "Pending"; lastPaymentDate?: string
}

const FIRST_NAMES = ["Aarav","Vihaan","Aditya","Sai","Arjun","Reyansh","Muhammad","Rohan","Ishaan","Vivaan","Diya","Saanvi","Ananya","Aadhya","Pari","Fatima","Zoya","Kiara","Myra","Riya","Kabir","Neel","Atharv","Shivansh","Ayaan","Dhruv","Krishna","Ishita","Kavya","Mira"]
const LAST_NAMES = ["Sharma","Patel","Verma","Khan","Singh","Das","Nair","Mehta","Chopra","Desai","Joshi","Ansari","Shaikh","Reddy","Gupta","Malhotra","Bhat","Iyer","Kulkarni","Jadhav","Siddiqui","Mishra","Gowda","Fernandes","More","Kaur","Dhawan","Saxena","Rao","Pillai"]
const BRANCHES = ["Computer Engg", "Civil Engg", "Mech Engg", "EXTC Engg", "IT Engg", "AI & DS"]

const generateName = () => {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]
  const middle = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
  return `${last} ${first} ${middle}`.toUpperCase()
}

const generateOutstandingData = (): StudentFeeRecord[] => {
  const years = ["First Year", "Second Year", "Third Year", "Final Year"]
  const quotas = ["Open", "OBC", "EBC", "SC", "ST", "VJNT", "TFWS"]
  const data: StudentFeeRecord[] = []
  for (let i = 1; i <= 80; i++) {
    const year = years[Math.floor(Math.random() * years.length)]
    const quota = quotas[Math.floor(Math.random() * quotas.length)]
    const branch = BRANCHES[Math.floor(Math.random() * BRANCHES.length)]
    const totalFees = quota === "Open" ? 120000 : quota === "OBC" ? 60000 : quota === "TFWS" ? 15000 : 90000
    const rand = Math.random()
    let feesPaid = 0, status: "Paid"|"Partial"|"Pending" = "Pending", lastPaymentDate = "-"
    if (rand > 0.65) { feesPaid = totalFees; status = "Paid"; lastPaymentDate = `2025-0${Math.floor(Math.random()*8+1)}-${Math.floor(Math.random()*28+1).toString().padStart(2,'0')}` }
    else if (rand > 0.3) { feesPaid = Math.floor(Math.random() * (totalFees - 5000)); status = "Partial"; lastPaymentDate = `2025-0${Math.floor(Math.random()*8+1)}-${Math.floor(Math.random()*28+1).toString().padStart(2,'0')}` }
    const totalBal = totalFees - feesPaid
    const balScholarship = quota === "Open" ? 0 : Math.floor(totalBal * 0.6)
    const balStudent = totalBal - balScholarship
    data.push({ id: i.toString(), rollNo: `25${branch.substring(0,2).toUpperCase()}${i.toString().padStart(3,'0')}`, name: generateName(), branch, year, quota, totalFees, feesPaid, balStudent, balScholarship, totalBal, remark: totalBal > 0 ? "Follow up required" : "", status, lastPaymentDate })
  }
  return data
}

const OUTSTANDING_DATA = generateOutstandingData()

// ─── STAT CARD ─────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, trend, accent, sub }: any) => (
  <div className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 group">
    <div className="flex items-start justify-between mb-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon size={22} />
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          <ArrowUpRight size={10} /> {trend}
        </span>
      )}
    </div>
    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">{title}</p>
    <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
    {sub && <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{sub}</p>}
  </div>
)

// ─── PAGINATION ─────────────────────────────────────────────
const Pagination = ({ totalItems, itemsPerPage, currentPage, onPageChange, startIndex, endIndex }: any) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
      <p className="text-xs text-slate-500">Showing <span className="font-bold text-slate-700">{Math.min(startIndex+1,totalItems)}</span>–<span className="font-bold text-slate-700">{Math.min(endIndex,totalItems)}</span> of <span className="font-bold text-slate-700">{totalItems}</span></p>
      <div className="flex gap-1">
        <button onClick={() => onPageChange(currentPage-1)} disabled={currentPage===1} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 text-xs font-bold"><ChevronLeft size={14}/></button>
        {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
          let p = i+1; if(totalPages>5 && currentPage>3) p = currentPage-2+i; if(p>totalPages) return null
          return <button key={p} onClick={() => onPageChange(p)} className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${currentPage===p ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>{p}</button>
        })}
        <button onClick={() => onPageChange(currentPage+1)} disabled={currentPage===totalPages} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 text-xs font-bold"><ChevronRight size={14}/></button>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<ViewState>("dashboard")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedYear, setSelectedYear] = useState("All")
  const [selectedQuota, setSelectedQuota] = useState("All")
  const [selectedStatus, setSelectedStatus] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useMemo(() => { setCurrentPage(1) }, [searchQuery, selectedYear, selectedQuota, selectedStatus])

  const filteredOutstanding = useMemo(() =>
    OUTSTANDING_DATA.filter(s =>
      (selectedYear === "All" || s.year === selectedYear) &&
      (selectedQuota === "All" || s.quota === selectedQuota) &&
      (selectedStatus === "All" || s.status === selectedStatus) &&
      (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()))
    ), [searchQuery, selectedYear, selectedQuota, selectedStatus])

  const paginatedOutstanding = filteredOutstanding.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage)
  const clearFilters = () => { setSelectedYear("All"); setSelectedQuota("All"); setSelectedStatus("All"); setSearchQuery("") }

  const analyticsData = useMemo(() => {
    const totalFees = OUTSTANDING_DATA.reduce((a,c) => a+c.totalFees, 0)
    const collectedFees = OUTSTANDING_DATA.reduce((a,c) => a+c.feesPaid, 0)
    const pendingFees = OUTSTANDING_DATA.reduce((a,c) => a+c.totalBal, 0)
    const pendingScholarship = OUTSTANDING_DATA.reduce((a,c) => a+c.balScholarship, 0)
    const pendingStudent = OUTSTANDING_DATA.reduce((a,c) => a+c.balStudent, 0)
    const branchStats = BRANCHES.map(branch => {
      const bs = OUTSTANDING_DATA.filter(s => s.branch === branch)
      return { branch, total: bs.reduce((a,s) => a+s.totalFees,0), collected: bs.reduce((a,s) => a+s.feesPaid,0), pending: bs.reduce((a,s) => a+s.totalBal,0) }
    }).sort((a,b) => b.pending-a.pending)
    return { totalFees, collectedFees, pendingFees, pendingScholarship, pendingStudent, branchStats }
  }, [])

  // ─── VIEWS ─────────────────────────────────────────────────

  const DashboardView = () => {
    const recentTxns = OUTSTANDING_DATA.filter(s => s.feesPaid > 0).slice(0, 6)
    const collRatio = ((analyticsData.collectedFees / analyticsData.totalFees) * 100).toFixed(1)
    return (
      <div className="space-y-8 pb-10 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial Overview</h2>
            <p className="text-slate-400 text-sm mt-0.5">Academic year 2025–26 · Real-time metrics</p>
          </div>
          <div className="flex gap-3">
            <button className="h-10 px-4 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-colors">
              <Download size={15} /> Export
            </button>
            <button className="h-10 px-4 bg-emerald-600 text-white text-sm font-semibold rounded-xl flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-colors">
              <RefreshCw size={15} /> Sync
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <StatCard title="Total Collected" value={`₹ ${(analyticsData.collectedFees/100000).toFixed(2)} L`} icon={Wallet} trend="+12%" accent="bg-emerald-50 text-emerald-600" sub="Target: ₹ 5 Crore" />
          <StatCard title="Outstanding" value={`₹ ${(analyticsData.pendingFees/100000).toFixed(2)} L`} icon={DollarSign} trend="-5.2%" accent="bg-rose-50 text-rose-500" sub="Across all years" />
          <StatCard title="Scholarship Due" value={`₹ ${(analyticsData.pendingScholarship/100000).toFixed(2)} L`} icon={Landmark} accent="bg-amber-50 text-amber-600" sub="Govt. receivables" />
          <StatCard title="Active Students" value={OUTSTANDING_DATA.length.toString()} icon={Users} trend="+2%" accent="bg-blue-50 text-blue-600" sub="Enrolled 2025–26" />
        </div>

        {/* Collection Progress Banner */}
        <div className="bg-gradient-to-r from-[#0F1923] to-[#1a2f45] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 text-white overflow-hidden relative">
          <div className="relative z-10 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Annual Collection Progress</p>
            <div className="flex items-end gap-3 mb-3">
              <span className="text-4xl font-black tracking-tight">{collRatio}%</span>
              <span className="text-white/40 text-sm font-medium mb-1">of ₹{(analyticsData.totalFees/10000000).toFixed(2)} Cr target</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${collRatio}%` }} />
            </div>
          </div>
          <button onClick={() => setActiveView('outstanding')} className="h-10 px-5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm font-bold transition-all flex items-center gap-2 z-10">
            View Ledger <ArrowRight size={15} />
          </button>
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Recent Collections Table */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Recent Collections</h3>
                <p className="text-xs text-slate-400 mt-0.5">Latest fee payments received</p>
              </div>
              <button onClick={() => setActiveView('outstanding')} className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">Full Ledger <ArrowRight size={13} /></button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Student</th>
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">Branch</th>
                    <th className="px-6 py-3.5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-6 py-3.5 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentTxns.map(s => (
                    <tr key={s.id} className="group hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => { setSearchQuery(s.rollNo); setActiveView('student-detail') }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{s.name.charAt(0)}</div>
                          <div>
                            <p className="font-semibold text-slate-700 group-hover:text-emerald-600 transition-colors text-[13px]">{s.name.split(' ').slice(0,2).join(' ')}</p>
                            <p className="text-[10px] font-mono text-slate-400">{s.rollNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[12px] text-slate-500">{s.branch}</td>
                      <td className="px-6 py-4 text-center"><span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">Paid</span></td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600 text-[13px]">₹ {s.feesPaid.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <h3 className="font-bold text-slate-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Ledger", icon: Wallet, action: () => setActiveView('outstanding') },
                  { label: "Search", icon: Search, action: () => setActiveView('student-detail') },
                  { label: "Analytics", icon: BarChart3, action: () => setActiveView('analytics') },
                  { label: "Reports", icon: FileText, action: () => {} },
                ].map(item => (
                  <button key={item.label} onClick={item.action} className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-100 rounded-xl text-slate-500 hover:text-emerald-600 transition-all group">
                    <item.icon size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[11px] font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#0F1923] rounded-2xl p-5 text-white relative overflow-hidden">
              <AlertCircle size={20} className="text-amber-400 mb-3" />
              <h4 className="font-bold text-sm mb-1">Pending Approvals</h4>
              <p className="text-xs text-white/40 mb-4">12 scholarship records need review</p>
              <button onClick={() => setActiveView('outstanding')} className="w-full h-9 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2">
                Review Now <ArrowRight size={13} />
              </button>
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const AnalyticsView = () => {
    const collRatio = ((analyticsData.collectedFees / analyticsData.totalFees) * 100).toFixed(1)
    const schRatio = ((analyticsData.pendingScholarship / analyticsData.pendingFees) * 100).toFixed(1)
    return (
      <div className="space-y-8 pb-10 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fee Analytics</h2>
            <p className="text-slate-400 text-sm mt-0.5">Comprehensive college-wide financial breakdown</p>
          </div>
          <button className="h-10 px-4 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl flex items-center gap-2 hover:bg-slate-50">
            <Download size={15} /> Export
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: "Collection Ratio", value: `${collRatio}%`, sub: "of total fees applicable", icon: PieChart, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Scholarship Dependency", value: `${schRatio}%`, sub: "of total outstanding", icon: Landmark, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Student Liability", value: `₹ ${(analyticsData.pendingStudent/100000).toFixed(2)} L`, sub: "directly collectible", icon: TrendingUp, color: "text-rose-600", bg: "bg-rose-50" },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center gap-5">
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${c.bg} flex-shrink-0`}>
                <c.icon size={24} className={c.color} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{c.label}</p>
                <p className="text-2xl font-black text-slate-800">{c.value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Department-wise Fee Summary</h3>
            <p className="text-xs text-slate-400 mt-0.5">Sorted by outstanding balance</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  {["Department","Total Fees","Collected","Pending","Progress"].map(h => (
                    <th key={h} className={`px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 ${h==='Department'?'text-left':'text-right'} ${h==='Progress'?'text-center':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {analyticsData.branchStats.map((stat, i) => {
                  const pct = (stat.collected / stat.total) * 100
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800 text-[13px]">{stat.branch}</td>
                      <td className="px-6 py-4 text-right text-slate-500 text-[13px]">₹ {stat.total.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-emerald-600 font-semibold text-[13px]">₹ {stat.collected.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-rose-500 font-semibold text-[13px]">₹ {stat.pending.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 justify-center">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[120px]">
                            <div className={`h-full rounded-full ${pct>75?'bg-emerald-500':pct>40?'bg-blue-500':'bg-amber-500'}`} style={{width:`${pct}%`}} />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 w-10 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const OutstandingView = () => (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden animate-in fade-in duration-300">
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Outstanding Fees Ledger</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage student fee balances and scholarship claims</p>
        </div>
        <div className="flex gap-2">
          <button onClick={clearFilters} className="h-9 px-4 border border-slate-200 text-slate-500 text-[12px] font-semibold rounded-xl flex items-center gap-1.5 hover:bg-slate-50"><XCircle size={14}/> Clear</button>
          <button className="h-9 px-4 bg-emerald-600 text-white text-[12px] font-bold rounded-xl flex items-center gap-1.5 hover:bg-emerald-700 shadow-sm shadow-emerald-200"><Download size={14}/> Export CSV</button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-slate-100 bg-slate-50/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input type="text" placeholder="Name or Roll No..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 h-9 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
        </div>
        {[
          { val: selectedYear, set: setSelectedYear, opts: ["All","First Year","Second Year","Third Year","Final Year"], placeholder: "All Years" },
          { val: selectedQuota, set: setSelectedQuota, opts: ["All","Open","OBC","EBC","SC","ST","VJNT","TFWS"], placeholder: "All Quotas" },
          { val: selectedStatus, set: setSelectedStatus, opts: ["All","Paid","Partial","Pending"], placeholder: "All Statuses" },
        ].map((f, i) => (
          <div key={i} className="relative">
            <select value={f.val} onChange={e => f.set(e.target.value)} className="w-full h-9 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
              {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {["Student","Year / Branch","Total","Paid","Bal (Student)","Bal (Govt)","Total Bal",""].map(h => (
                <th key={h} className={`px-6 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 ${h==='Student'||h===''?'text-left':'text-right'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedOutstanding.map(s => (
              <tr key={s.id} className="group hover:bg-emerald-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">{s.name.charAt(0)}</div>
                    <div>
                      <p className="font-semibold text-slate-700 group-hover:text-emerald-700 cursor-pointer text-[13px]" onClick={() => { setSearchQuery(s.rollNo); setActiveView('student-detail') }}>{s.name.split(' ').slice(0,2).join(' ')}</p>
                      <p className="text-[10px] font-mono text-slate-400">{s.rollNo}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-[13px] text-slate-600">{s.year}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full mt-1 inline-block">{s.branch}</span>
                </td>
                <td className="px-6 py-4 text-right text-slate-500 text-[13px]">₹ {s.totalFees.toLocaleString()}</td>
                <td className="px-6 py-4 text-right text-emerald-600 font-semibold text-[13px]">{s.feesPaid>0?`₹ ${s.feesPaid.toLocaleString()}`:'-'}</td>
                <td className="px-6 py-4 text-right text-rose-500 font-semibold text-[13px]">{s.balStudent>0?`₹ ${s.balStudent.toLocaleString()}`:'-'}</td>
                <td className="px-6 py-4 text-right text-amber-600 text-[13px]">{s.balScholarship>0?`₹ ${s.balScholarship.toLocaleString()}`:'-'}</td>
                <td className="px-6 py-4 text-right font-bold text-slate-800 text-[13px]">₹ {s.totalBal.toLocaleString()}</td>
                <td className="px-6 py-4"><button onClick={() => { setSearchQuery(s.rollNo); setActiveView('student-detail') }} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><ArrowUpRight size={14}/></button></td>
              </tr>
            ))}
            {paginatedOutstanding.length === 0 && (
              <tr><td colSpan={8} className="py-20 text-center">
                <p className="text-slate-400 font-medium text-sm">No records match your filters.</p>
                <button onClick={clearFilters} className="mt-3 text-emerald-600 text-xs font-bold hover:underline">Reset filters</button>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination totalItems={filteredOutstanding.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} startIndex={(currentPage-1)*itemsPerPage} endIndex={currentPage*itemsPerPage} />
    </div>
  )

  const StudentDetailView = () => {
    const student = searchQuery
      ? OUTSTANDING_DATA.find(s => s.rollNo.includes(searchQuery) || s.name.includes(searchQuery.toUpperCase()))
      : OUTSTANDING_DATA.find(s => s.status === 'Pending') || OUTSTANDING_DATA[0]
    if (!student) return <div className="text-center py-20 text-slate-400"><p>Student not found for "{searchQuery}"</p></div>
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-10 animate-in fade-in duration-500">
        <button onClick={() => setActiveView('outstanding')} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
          <ChevronLeft size={16} /> Back to Ledger
        </button>
        <div className="bg-[#0F1923] rounded-2xl overflow-hidden text-white relative">
          <div className="px-8 py-8 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-3xl font-black">{student.name.charAt(0)}</div>
              <div>
                <h2 className="text-2xl font-black tracking-tight">{student.name}</h2>
                <div className="flex items-center gap-3 text-white/50 text-sm mt-1">
                  <span className="font-mono bg-white/10 px-2.5 py-0.5 rounded-lg">{student.rollNo}</span>
                  <span>·</span><span>{student.year}</span><span>·</span><span>{student.branch}</span>
                </div>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl border text-sm font-bold flex items-center gap-2 ${student.status==='Paid'?'bg-emerald-500/20 border-emerald-500/30 text-emerald-300':student.status==='Partial'?'bg-amber-500/20 border-amber-500/30 text-amber-300':'bg-rose-500/20 border-rose-500/30 text-rose-300'}`}>
              {student.status==='Paid'?<CheckCircle2 size={16}/>:<AlertCircle size={16}/>} {student.status}
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">Financial Breakdown</h3></div>
            <div className="p-6 space-y-4">
              {[
                { label: "Total Applicable Fees", val: `₹ ${student.totalFees.toLocaleString()}`, color: "text-slate-800" },
                { label: "Fees Paid", val: `- ₹ ${student.feesPaid.toLocaleString()}`, color: "text-emerald-600" },
                { label: "Student Liability", val: `₹ ${student.balStudent.toLocaleString()}`, color: "text-rose-500" },
                { label: "Scholarship Claim (Govt)", val: `₹ ${student.balScholarship.toLocaleString()}`, color: "text-amber-600" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-3 border-b border-slate-50">
                  <span className="text-sm text-slate-500 font-medium">{row.label}</span>
                  <span className={`font-bold text-sm ${row.color}`}>{row.val}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-slate-700">Net Payable</span>
                <span className="text-2xl font-black text-slate-900">₹ {student.totalBal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-3">
              <h4 className="font-bold text-slate-700 text-sm">Actions</h4>
              <button className="w-full h-10 bg-emerald-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors">
                <DollarSign size={16} /> Collect Fee
              </button>
              <button className="w-full h-10 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50">
                <Download size={16} /> Download Invoice
              </button>
              <button className="w-full h-10 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-slate-50">
                <Bell size={16} /> Send Reminder
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3">
              <h4 className="font-bold text-slate-500 text-[10px] uppercase tracking-widest">Quick Info</h4>
              {[
                { k: "Quota", v: student.quota },
                { k: "Last Payment", v: student.lastPaymentDate || "-" },
                { k: "Scholarship", v: student.balScholarship > 0 ? "Eligible" : "None" },
              ].map(r => (
                <div key={r.k} className="flex justify-between text-[13px]">
                  <span className="text-slate-400">{r.k}</span>
                  <span className="font-semibold text-slate-700">{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── TAB BAR ─────────────────────────────────────────────
  const TABS = [
    { key: "dashboard", label: "Overview", icon: LayoutDashboard },
    { key: "outstanding", label: "Fee Ledger", icon: Wallet },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
    { key: "student-detail", label: "Student", icon: Users },
  ] as const

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-2xl p-1.5 w-fit shadow-sm">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key as ViewState)}
            className={`flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-bold transition-all ${activeView===tab.key ? 'bg-[#0F1923] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeView === 'dashboard' && <DashboardView />}
      {activeView === 'outstanding' && <OutstandingView />}
      {activeView === 'analytics' && <AnalyticsView />}
      {activeView === 'student-detail' && <StudentDetailView />}
    </div>
  )
}