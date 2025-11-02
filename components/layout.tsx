"use client"

import type React from "react"

// Assuming this is your dedicated, reusable Sidebar component
// and it handles its own internal state/styling.
import Sidebar from "@/components/sidebar" 

import { useState } from "react"
// We don't need Link, Menu, or X here anymore if Sidebar handles the UI.
// import Link from "next/link"
// import { Menu, X } from "lucide-react" 

export default function Layout({ children }: { children: React.ReactNode }) {
  // If your imported Sidebar component manages its own open/close state,
  // you might not need the state here. But keeping it for a general layout structure.
  const [sidebarOpen, setSidebarOpen] = useState(true) 
  
  // NOTE: If your imported Sidebar component is not designed to be controlled
  // via a 'sidebarOpen' prop, you might remove the state and button.
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* 1. Use the imported Sidebar component */}
      <Sidebar />

      {/* 2. Main Content Area */}
      {/* We apply the margin-left to the main content div to make space for the sidebar.
          Adjust 'ml-64' and 'ml-0' based on the Sidebar's width. */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        
        {/* If your Sidebar component does NOT have its own toggle button, 
            you can uncomment this to place it in the main area: */}
        {/* <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        */}

        {/* Content Area - All pages will render here */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}