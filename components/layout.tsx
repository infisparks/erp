"use client"

import type React from "react"
import Sidebar from "@/components/sidebar"
import { useState } from "react"
import { usePathname } from "next/navigation"

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isStudentApp = pathname?.startsWith("/studentapp")
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (isStudentApp) {
    return <main className="min-h-screen bg-gray-50">{children}</main>
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}