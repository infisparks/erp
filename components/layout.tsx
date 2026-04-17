"use client"

import type React from "react"

export default function Layout({ children }: { children: React.ReactNode }) {
  // Global layout is now a pass-through. 
  // Individual portal layouts (student, management) handle their own sidebars.
  return (
    <main className="min-h-screen">
      {children}
    </main>
  )
}