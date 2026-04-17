"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
// import Sidebar from "@/components/sidebar"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Users, BookOpen, FileText, TrendingUp } from "lucide-react"

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        router.push("/")
      } else {
        setUser(authUser)
      }
      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  const stats = [
    {
      icon: Users,
      label: "Total Students",
      value: "1,234",
      change: "+12%",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: BookOpen,
      label: "Courses",
      value: "45",
      change: "+5%",
      color: "from-purple-500 to-pink-500",
    },
    {
      icon: Users,
      label: "Teachers",
      value: "89",
      change: "+3%",
      color: "from-green-500 to-emerald-500",
    },
    {
      icon: FileText,
      label: "Applications",
      value: "156",
      change: "+18%",
      color: "from-orange-500 to-red-500",
    },
  ]

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* <Sidebar user={user} /> */}

      <main className="flex-1  overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
            <p className="text-slate-600">Welcome back, {user?.email}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105"
              >
                <div className={`bg-gradient-to-br ${stat.color} rounded-lg p-3 w-fit mb-4`}>
                  <stat.icon size={24} className="text-white" />
                </div>
                <h3 className="text-slate-600 text-sm font-medium">{stat.label}</h3>
                <div className="flex items-end justify-between mt-2">
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-green-600 text-sm font-semibold">{stat.change}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="text-blue-600" size={24} />
              <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
            </div>
            <p className="text-slate-600">No recent activities</p>
          </div>
        </div>
      </main>
    </div>
  )
}
