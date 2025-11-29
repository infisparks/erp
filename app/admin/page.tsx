"use client"

import React, { useState, useMemo } from "react"
import {
  LayoutDashboard,
  Wallet,
  Search,
  Bell,
  Filter,
  Download,
  ArrowUpRight,
  DollarSign,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  XCircle,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  PieChart,
  BarChart3,
  TrendingUp,
  Landmark
} from "lucide-react"

// --- TYPES ---

type ViewState = "dashboard" | "outstanding" | "analytics" | "student-detail"

interface StudentFeeRecord {
  id: string
  rollNo: string
  name: string
  branch: string // Added Branch for Analytics
  year: string
  quota: string
  totalFees: number
  feesPaid: number
  balStudent: number
  balScholarship: number
  totalBal: number
  remark: string
  status: "Paid" | "Partial" | "Pending"
  lastPaymentDate?: string
}

// --- REALISTIC DATA GENERATOR ---

const FIRST_NAMES = [
  "Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Reyansh", "Muhammad", "Rohan", "Ishaan", "Vivaan", 
  "Diya", "Saanvi", "Ananya", "Aadhya", "Pari", "Fatima", "Zoya", "Kiara", "Myra", "Riya",
  "Kabir", "Neel", "Atharv", "Shivansh", "Ayaan", "Dhruv", "Krishna", "Ishita", "Kavya", "Mira"
]

const LAST_NAMES = [
  "Sharma", "Patel", "Verma", "Khan", "Singh", "Das", "Nair", "Mehta", "Chopra", "Desai", 
  "Joshi", "Ansari", "Shaikh", "Reddy", "Gupta", "Malhotra", "Bhat", "Iyer", "Kulkarni", "Jadhav",
  "Siddiqui", "Mishra", "Gowda", "Fernandes", "More", "Kaur", "Dhawan", "Saxena", "Rao", "Pillai"
]

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

  // Generate 80 records for better analytics density
  for (let i = 1; i <= 80; i++) {
    const year = years[Math.floor(Math.random() * years.length)]
    const quota = quotas[Math.floor(Math.random() * quotas.length)]
    const branch = BRANCHES[Math.floor(Math.random() * BRANCHES.length)]
    
    // Fee structure variations
    const totalFees = quota === "Open" ? 120000 : quota === "OBC" ? 60000 : quota === "TFWS" ? 15000 : 90000
    
    const rand = Math.random()
    let feesPaid = 0
    let status: "Paid" | "Partial" | "Pending" = "Pending"
    let lastPaymentDate = "-"

    if (rand > 0.65) {
      feesPaid = totalFees
      status = "Paid"
      lastPaymentDate = `2025-${Math.floor(Math.random() * 8 + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 28 + 1).toString().padStart(2, '0')}`
    } else if (rand > 0.3) {
      feesPaid = Math.floor(Math.random() * (totalFees - 5000))
      status = "Partial"
      lastPaymentDate = `2025-${Math.floor(Math.random() * 8 + 1).toString().padStart(2, '0')}-${Math.floor(Math.random() * 28 + 1).toString().padStart(2, '0')}`
    } else {
      feesPaid = 0
      status = "Pending"
    }

    const totalBal = totalFees - feesPaid
    const balScholarship = quota === "Open" ? 0 : Math.floor(totalBal * 0.6)
    const balStudent = totalBal - balScholarship

    data.push({
      id: i.toString(),
      rollNo: `25${branch.substring(0,2).toUpperCase()}${i.toString().padStart(3, '0')}`,
      name: generateName(),
      branch,
      year,
      quota,
      totalFees,
      feesPaid,
      balStudent,
      balScholarship,
      totalBal,
      remark: totalBal > 0 ? "Follow up required" : "",
      status,
      lastPaymentDate
    })
  }
  return data
}

const OUTSTANDING_DATA = generateOutstandingData()

// --- COMPONENT: STAT CARD ---
const StatCard = ({ title, value, icon: Icon, trend, color, subtext }: any) => (
  <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 p-6 flex flex-col justify-between h-full hover:shadow-md transition-shadow duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-${color.replace('bg-', '')}-600`}>
        <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}-600`} />
      </div>
      {trend && (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
          {trend.startsWith('+') ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
          {trend}
        </span>
      )}
    </div>
    <div>
      <h3 className="text-3xl font-bold text-slate-800 tracking-tight mb-1">{value}</h3>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      {subtext && <p className="text-xs text-slate-400 mt-3 flex items-center gap-1"><Calendar className="h-3 w-3"/> {subtext}</p>}
    </div>
  </div>
)

// --- COMPONENT: PAGINATION ---
const Pagination = ({ 
  totalItems, 
  itemsPerPage, 
  currentPage, 
  onPageChange,
  startIndex,
  endIndex 
}: { 
  totalItems: number, 
  itemsPerPage: number, 
  currentPage: number, 
  onPageChange: (page: number) => void,
  startIndex: number,
  endIndex: number
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white">
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{Math.min(startIndex + 1, totalItems)}</span> to <span className="font-semibold text-slate-700">{Math.min(endIndex, totalItems)}</span> of <span className="font-semibold text-slate-700">{totalItems}</span> results
          </p>
        </div>
        <div className="flex gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </button>
            <div className="hidden md:flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                }
                if (pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`relative inline-flex items-center justify-center w-9 h-9 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </button>
        </div>
      </div>
    </div>
  )
}

// --- MAIN COMPONENT ---

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<ViewState>("dashboard")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Outstanding Fees Filters
  const [selectedYear, setSelectedYear] = useState("All")
  const [selectedQuota, setSelectedQuota] = useState("All")
  const [selectedStatus, setSelectedStatus] = useState("All")
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Reset pagination when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedYear, selectedQuota, selectedStatus])

  // --- FILTER LOGIC ---
  const filteredOutstanding = useMemo(() => {
    return OUTSTANDING_DATA.filter(student => 
      (selectedYear === "All" || student.year === selectedYear) &&
      (selectedQuota === "All" || student.quota === selectedQuota) &&
      (selectedStatus === "All" || student.status === selectedStatus) &&
      (student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
       student.rollNo.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [searchQuery, selectedYear, selectedQuota, selectedStatus])

  // Pagination Logic
  const paginatedOutstanding = filteredOutstanding.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Clear Filters Handler
  const clearFilters = () => {
    setSelectedYear("All")
    setSelectedQuota("All")
    setSelectedStatus("All")
    setSearchQuery("")
  }

  // --- AGGREGATION LOGIC FOR ANALYTICS ---
  const analyticsData = useMemo(() => {
    const totalFees = OUTSTANDING_DATA.reduce((acc, curr) => acc + curr.totalFees, 0)
    const collectedFees = OUTSTANDING_DATA.reduce((acc, curr) => acc + curr.feesPaid, 0)
    const pendingFees = OUTSTANDING_DATA.reduce((acc, curr) => acc + curr.totalBal, 0)
    const pendingScholarship = OUTSTANDING_DATA.reduce((acc, curr) => acc + curr.balScholarship, 0)
    const pendingStudent = OUTSTANDING_DATA.reduce((acc, curr) => acc + curr.balStudent, 0)

    // Branch-wise stats
    const branchStats = BRANCHES.map(branch => {
      const branchStudents = OUTSTANDING_DATA.filter(s => s.branch === branch)
      const branchTotal = branchStudents.reduce((acc, s) => acc + s.totalFees, 0)
      const branchCollected = branchStudents.reduce((acc, s) => acc + s.feesPaid, 0)
      const branchPending = branchStudents.reduce((acc, s) => acc + s.totalBal, 0)
      return { branch, total: branchTotal, collected: branchCollected, pending: branchPending }
    }).sort((a, b) => b.pending - a.pending) // Sort by highest pending

    return { totalFees, collectedFees, pendingFees, pendingScholarship, pendingStudent, branchStats }
  }, [])

  // --- VIEW COMPONENTS ---

  const DashboardOverview = () => {
    const recentTxns = OUTSTANDING_DATA.filter(s => s.feesPaid > 0).slice(0, 5)

    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Financial Overview</h2>
            <p className="text-slate-500">Track key metrics and fee collection status.</p>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
               <Download className="h-4 w-4" /> Download Report
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
               <RefreshCw className="h-4 w-4" /> Sync Data
             </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Collection" 
            value={`₹ ${(analyticsData.collectedFees / 100000).toFixed(2)} L`} 
            icon={Wallet} 
            trend="+12%" 
            color="bg-emerald-100 text-emerald-600" 
            subtext="Target: ₹ 5 Cr"
          />
          <StatCard 
            title="Total Outstanding" 
            value={`₹ ${(analyticsData.pendingFees / 100000).toFixed(2)} L`} 
            icon={DollarSign} 
            trend="+5.2%" 
            color="bg-rose-100 text-rose-600"
            subtext="Across all years"
          />
          <StatCard 
            title="Scholarship Due" 
            value={`₹ ${(analyticsData.pendingScholarship / 100000).toFixed(2)} L`} 
            icon={Landmark} 
            trend="+0%" 
            color="bg-orange-100 text-orange-600"
            subtext="Govt. Receivables" 
          />
          <StatCard 
            title="Active Students" 
            value={OUTSTANDING_DATA.length.toString()} 
            icon={Users} 
            trend="+2%" 
            color="bg-blue-100 text-blue-600"
            subtext="Enrolled 2025-26" 
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Table */}
          <div className="xl:col-span-2 bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                 <h3 className="font-bold text-lg text-slate-800">Recent Collections</h3>
                 <p className="text-sm text-slate-500">Latest fee payments received</p>
              </div>
              <button 
                className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center transition-colors" 
                onClick={() => setActiveView('outstanding')}
              >
                View Ledger <ArrowUpRight className="h-4 w-4 ml-1" />
              </button>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Branch</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Paid Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTxns.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => { setSearchQuery(student.rollNo); setActiveView('student-detail') }}>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">{student.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{student.rollNo}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{student.lastPaymentDate}</td>
                      <td className="px-6 py-4 text-slate-600">{student.branch}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Success
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-emerald-600">+ ₹ {student.feesPaid.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side Actions */}
          <div className="space-y-6">
             <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-2">Pending Actions</h3>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors cursor-pointer" onClick={() => setActiveView('outstanding')}>
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-orange-500/20 rounded-lg"><AlertCircle className="h-5 w-5 text-orange-400" /></div>
                         <div>
                           <p className="font-medium text-sm">Verify Scholarship Data</p>
                           <p className="text-xs text-slate-300">12 Pending Approvals</p>
                         </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>
                {/* Decorative circle */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
             </div>

             <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 p-6">
                <h3 className="font-bold text-slate-800 mb-4">Quick Navigation</h3>
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={() => setActiveView('outstanding')} className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-100 flex flex-col items-center justify-center gap-2 text-slate-600">
                      <Wallet className="h-6 w-6" />
                      <span className="text-xs font-semibold">Ledger</span>
                   </button>
                   <button onClick={() => setActiveView('student-detail')} className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-100 flex flex-col items-center justify-center gap-2 text-slate-600">
                      <Search className="h-6 w-6" />
                      <span className="text-xs font-semibold">Search</span>
                   </button>
                   <button onClick={() => setActiveView('analytics')} className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-100 flex flex-col items-center justify-center gap-2 text-slate-600">
                      <BarChart3 className="h-6 w-6" />
                      <span className="text-xs font-semibold">Analytics</span>
                   </button>
                   <button className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-slate-100 flex flex-col items-center justify-center gap-2 text-slate-600">
                      <FileText className="h-6 w-6" />
                      <span className="text-xs font-semibold">Reports</span>
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    )
  }

  const AnalyticsView = () => {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Fee Analytics & Summary</h2>
            <p className="text-slate-500">Comprehensive view of college-wide financial data.</p>
          </div>
          <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
               <Download className="h-4 w-4" /> Export Summary
             </button>
          </div>
        </div>

        {/* Top Level Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <PieChart className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Collection Ratio</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2">
              {((analyticsData.collectedFees / analyticsData.totalFees) * 100).toFixed(1)}%
            </h3>
            <p className="text-xs text-slate-400 mt-1">of Total Fees Applicable</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
              <Landmark className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Scholarship Dependency</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2">
              {((analyticsData.pendingScholarship / analyticsData.pendingFees) * 100).toFixed(1)}%
            </h3>
             <p className="text-xs text-slate-400 mt-1">of Total Outstanding</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-rose-600" />
            </div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Student Liability</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2">
              ₹ {(analyticsData.pendingStudent / 100000).toFixed(2)} L
            </h3>
             <p className="text-xs text-slate-400 mt-1">Directly Collectible from Students</p>
          </div>
        </div>

        {/* Department Wise Table */}
        <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
               <h3 className="font-bold text-lg text-slate-800">Department Wise Fee Summary</h3>
               <p className="text-sm text-slate-500">Breakdown of collections by engineering branches</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white text-slate-500 font-semibold border-b border-slate-200 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4 text-right">Total Fees</th>
                    <th className="px-6 py-4 text-right">Collected</th>
                    <th className="px-6 py-4 text-right">Pending</th>
                    <th className="px-6 py-4 text-center">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analyticsData.branchStats.map((stat, index) => {
                     const progress = (stat.collected / stat.total) * 100;
                     return (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-700">{stat.branch}</td>
                        <td className="px-6 py-4 text-right text-slate-600">₹ {stat.total.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-emerald-600 font-medium">₹ {stat.collected.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right text-rose-600 font-medium">₹ {stat.pending.toLocaleString()}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-3">
                             <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${progress > 75 ? 'bg-emerald-500' : progress > 40 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${progress}%` }}></div>
                             </div>
                             <span className="text-xs font-bold text-slate-500 w-8">{progress.toFixed(0)}%</span>
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

  const OutstandingFeesView = () => (
    <div className="bg-white rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-200 flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-hidden">
      {/* FILTER BAR */}
      <div className="p-6 border-b border-slate-200 bg-white space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Outstanding Fees Ledger</h2>
            <p className="text-sm text-slate-500 mt-1">Manage student fee balances and scholarship claims.</p>
          </div>
          <div className="flex gap-3">
            <button className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center gap-2 transition-colors" onClick={clearFilters}>
              <XCircle className="h-4 w-4" /> Clear Filters
            </button>
            <button className="h-10 px-4 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 shadow-sm shadow-emerald-200 transition-colors">
              <Download className="h-4 w-4" /> Export CSV
            </button>
          </div>
        </div>
        
        {/* Responsive Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="group">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Search Student</label>
             <div className="relative">
               <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
               <input 
                 type="text" 
                 placeholder="Name or Roll No..." 
                 className="w-full pl-9 pr-4 h-10 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all outline-none"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
          </div>
          
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Academic Year</label>
            <div className="relative">
               <select 
                 className="w-full pl-3 pr-8 h-10 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none cursor-pointer outline-none transition-all"
                 value={selectedYear}
                 onChange={(e) => setSelectedYear(e.target.value)}
               >
                 <option value="All">All Years</option>
                 <option value="First Year">First Year</option>
                 <option value="Second Year">Second Year</option>
                 <option value="Third Year">Third Year</option>
                 <option value="Final Year">Final Year</option>
               </select>
               <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Quota Category</label>
             <div className="relative">
               <select 
                 className="w-full pl-3 pr-8 h-10 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none cursor-pointer outline-none transition-all"
                 value={selectedQuota}
                 onChange={(e) => setSelectedQuota(e.target.value)}
               >
                 <option value="All">All Quotas</option>
                 <option value="Open">Open</option>
                 <option value="OBC">OBC</option>
                 <option value="EBC">EBC</option>
                 <option value="SC">SC</option>
                 <option value="ST">ST</option>
                 <option value="VJNT">VJNT</option>
                 <option value="TFWS">TFWS</option>
               </select>
               <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
             </div>
          </div>

          <div>
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Payment Status</label>
             <div className="relative">
               <select 
                 className="w-full pl-3 pr-8 h-10 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm appearance-none cursor-pointer outline-none transition-all"
                 value={selectedStatus}
                 onChange={(e) => setSelectedStatus(e.target.value)}
               >
                 <option value="All">All Statuses</option>
                 <option value="Paid">Fully Paid</option>
                 <option value="Partial">Partially Paid</option>
                 <option value="Pending">Pending</option>
               </select>
               <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
             </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto bg-slate-50">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-white text-slate-500 font-semibold sticky top-0 z-10 shadow-sm text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 border-b border-slate-200">Student Details</th>
              <th className="px-6 py-4 border-b border-slate-200">Year / Branch</th>
              <th className="px-6 py-4 border-b border-slate-200 text-right">Total Fees</th>
              <th className="px-6 py-4 border-b border-slate-200 text-right">Paid</th>
              <th className="px-6 py-4 border-b border-slate-200 text-right text-rose-600">Bal (Student)</th>
              <th className="px-6 py-4 border-b border-slate-200 text-right text-orange-600">Bal (Govt)</th>
              <th className="px-6 py-4 border-b border-slate-200 text-right">Total Bal</th>
              <th className="px-4 py-4 border-b border-slate-200"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {paginatedOutstanding.map((student) => (
              <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 group-hover:text-blue-600 cursor-pointer transition-colors" onClick={() => { setSearchQuery(student.rollNo); setActiveView('student-detail') }}>
                        {student.name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{student.rollNo}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-slate-700 font-medium">{student.year}</div>
                  <div className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded w-fit mt-1">{student.branch}</div>
                </td>
                <td className="px-6 py-4 text-right text-slate-600">₹ {student.totalFees.toLocaleString()}</td>
                <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                   {student.feesPaid > 0 ? `₹ ${student.feesPaid.toLocaleString()}` : '-'}
                </td>
                <td className="px-6 py-4 text-right font-medium text-rose-600">
                   {student.balStudent > 0 ? `₹ ${student.balStudent.toLocaleString()}` : '-'}
                </td>
                <td className="px-6 py-4 text-right text-orange-600">
                   {student.balScholarship > 0 ? `₹ ${student.balScholarship.toLocaleString()}` : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                   <span className={`font-bold ${student.totalBal > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                     ₹ {student.totalBal.toLocaleString()}
                   </span>
                </td>
                <td className="px-4 py-4 text-right">
                   <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-blue-600 transition-colors" onClick={() => { setSearchQuery(student.rollNo); setActiveView('student-detail') }}>
                     <ArrowUpRight className="h-4 w-4" />
                   </button>
                </td>
              </tr>
            ))}
            {paginatedOutstanding.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-24 text-center text-slate-400 bg-slate-50">
                  <div className="flex flex-col items-center justify-center">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                      <Filter className="h-8 w-8 text-slate-300" />
                    </div>
                    <p className="font-medium text-slate-600">No records found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters.</p>
                    <button onClick={clearFilters} className="mt-4 text-blue-600 text-sm font-medium hover:underline">Reset all filters</button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination 
        totalItems={filteredOutstanding.length}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        startIndex={(currentPage - 1) * itemsPerPage}
        endIndex={currentPage * itemsPerPage}
      />
    </div>
  )

  const StudentDetailView = () => {
    // If no specific search query, default to first pending or first in list
    const student = searchQuery 
      ? OUTSTANDING_DATA.find(s => s.rollNo.includes(searchQuery) || s.name.includes(searchQuery.toUpperCase())) 
      : OUTSTANDING_DATA.find(s => s.status === 'Pending') || OUTSTANDING_DATA[0];

    if (!student) return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-white rounded-xl shadow-sm border border-slate-200">
        <Users className="h-16 w-16 mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-slate-700">Student Not Found</h3>
        <p className="mb-6 text-sm">Could not find a student matching "{searchQuery}"</p>
        <button onClick={() => setActiveView('outstanding')} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors">Return to Ledger</button>
      </div>
    )

    return (
      <div className="max-w-5xl mx-auto animate-in zoom-in-95 duration-300 pb-10">
        <button 
          onClick={() => setActiveView('outstanding')} 
          className="mb-4 flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors px-1"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Ledger
        </button>

        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          {/* Hero Section */}
          <div className="bg-slate-900 px-8 py-8 text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-6">
                 <div className="h-24 w-24 bg-white/10 rounded-full flex items-center justify-center border-4 border-white/20 backdrop-blur-sm text-3xl font-bold">
                   {student.name.charAt(0)}
                 </div>
                 <div>
                   <h1 className="text-2xl font-bold tracking-tight mb-1">{student.name}</h1>
                   <div className="flex items-center gap-3 text-slate-300 text-sm">
                     <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{student.rollNo}</span>
                     <span>•</span>
                     <span>{student.year}</span>
                     <span>•</span>
                     <span>{student.branch}</span>
                   </div>
                 </div>
              </div>
              
              <div className="flex items-center gap-3">
                 <div className={`px-4 py-2 rounded-lg backdrop-blur-md border ${
                    student.status === 'Paid' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-100' :
                    student.status === 'Partial' ? 'bg-amber-500/20 border-amber-500/30 text-amber-100' :
                    'bg-rose-500/20 border-rose-500/30 text-rose-100'
                 }`}>
                   <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                     {student.status === 'Paid' ? <CheckCircle2 className="h-4 w-4"/> : <AlertCircle className="h-4 w-4"/>}
                     Fee Status: {student.status}
                   </span>
                 </div>
              </div>
            </div>
            
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               {/* Left Column: Details */}
               <div className="lg:col-span-2 space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-blue-600" /> Financial Breakdown
                    </h3>
                    
                    <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                       <div className="grid grid-cols-2 divide-x divide-slate-200 border-b border-slate-200">
                          <div className="p-5">
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Applicable Fees</p>
                             <p className="text-xl font-bold text-slate-800">₹ {student.totalFees.toLocaleString()}</p>
                          </div>
                          <div className="p-5 bg-white">
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount Paid</p>
                             <p className="text-xl font-bold text-emerald-600">- ₹ {student.feesPaid.toLocaleString()}</p>
                          </div>
                       </div>
                       
                       <div className="p-5">
                          <div className="flex justify-between items-center mb-4">
                             <p className="text-sm font-medium text-slate-600">Outstanding Balance Breakdown</p>
                             <p className="text-xs text-slate-400">Due Date: 30 Oct 2025</p>
                          </div>
                          
                          <div className="space-y-3">
                             <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                   <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                                   <span className="text-sm font-medium text-slate-700">Student Liability</span>
                                </div>
                                <span className="font-bold text-rose-600">₹ {student.balStudent.toLocaleString()}</span>
                             </div>
                             
                             <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-3">
                                   <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                                   <span className="text-sm font-medium text-slate-700">Scholarship Claim (Govt)</span>
                                </div>
                                <span className="font-bold text-orange-600">₹ {student.balScholarship.toLocaleString()}</span>
                             </div>
                          </div>
                          
                          <div className="mt-6 pt-6 border-t border-slate-200 flex justify-between items-end">
                             <div>
                                <p className="text-sm text-slate-500">Net Payable Amount</p>
                             </div>
                             <div className="text-right">
                                <p className="text-3xl font-black text-slate-900">₹ {student.totalBal.toLocaleString()}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>

               {/* Right Column: Actions */}
               <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                     <h4 className="font-bold text-slate-800 mb-4">Actions</h4>
                     <div className="space-y-3">
                        <button className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                           <DollarSign className="h-4 w-4" /> Collect Fee
                        </button>
                        <button className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                           <Download className="h-4 w-4" /> Download Invoice
                        </button>
                        <button className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                           <Bell className="h-4 w-4" /> Send Reminder
                        </button>
                     </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
                     <h4 className="font-bold text-slate-800 mb-3 text-sm uppercase">Quick Details</h4>
                     <ul className="space-y-3 text-sm">
                        <li className="flex justify-between">
                           <span className="text-slate-500">Last Payment</span>
                           <span className="font-medium text-slate-800">{student.lastPaymentDate}</span>
                        </li>
                        <li className="flex justify-between">
                           <span className="text-slate-500">Scholarship</span>
                           <span className="font-medium text-slate-800">{student.balScholarship > 0 ? "Eligible" : "Not Applied"}</span>
                        </li>
                        <li className="flex justify-between">
                           <span className="text-slate-500">Contact</span>
                           <span className="font-medium text-blue-600 cursor-pointer hover:underline">+91 98765 43210</span>
                        </li>
                     </ul>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 flex flex-col w-full">
      {/* HEADER */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/80">
        <div className="flex items-center gap-4">
           <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-sm">
                {activeView === 'dashboard' ? <LayoutDashboard className="h-4 w-4" /> : 
                 activeView === 'outstanding' ? <Wallet className="h-4 w-4" /> :
                 activeView === 'analytics' ? <BarChart3 className="h-4 w-4" /> :
                 <Search className="h-4 w-4" />
                }
             </div>
             {activeView === 'student-detail' ? 'Student Profile' : 
              activeView === 'outstanding' ? 'Fee Management' :
              activeView === 'analytics' ? 'College Analytics' :
              activeView.charAt(0).toUpperCase() + activeView.slice(1)}
           </h1>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
           {/* Modern Tabs */}
           <div className="hidden md:flex bg-slate-100/80 p-1 rounded-xl border border-slate-200">
              <button 
                onClick={() => setActiveView('dashboard')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeView === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveView('outstanding')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeView === 'outstanding' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Fees
              </button>
              <button 
                onClick={() => setActiveView('analytics')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeView === 'analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Analytics
              </button>
           </div>

           <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white"></span>
              </button>
              
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-xs cursor-pointer hover:scale-105 transition-transform">
                AD
              </div>
           </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth">
           <div className="max-w-7xl mx-auto h-full">
             {activeView === 'dashboard' && <DashboardOverview />}
             {activeView === 'outstanding' && <OutstandingFeesView />}
             {activeView === 'analytics' && <AnalyticsView />}
             {activeView === 'student-detail' && <StudentDetailView />}
           </div>
        </div>
      </main>
    </div>
  )
}