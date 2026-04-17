"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, CreditCard, QrCode, CheckCircle2, UserCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: Home, label: "Home", href: "/student/dashboard" },
  { icon: CreditCard, label: "Fees", href: "/student/fees" },
  { icon: QrCode, label: "ID", href: "/student/identity", special: true },
  { icon: CheckCircle2, label: "Registration", href: "/student/registration" },
  { icon: UserCircle, label: "Profile", href: "/student/profile" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] lg:hidden">
      <div className="flex items-center justify-around px-2 py-3 max-w-lg mx-auto relative">
        {navItems.map(({ icon: Icon, label, href, special }) => {
          const isActive = pathname === href
          
          return (
            <Link 
              key={href} 
              href={href} 
              className="flex flex-col items-center gap-1.5 flex-1 relative group"
            >
              {special ? (
                <div className="relative -mt-10">
                  <div className="absolute inset-0 bg-[#1A3A6B] blur-xl opacity-20 scale-110" />
                  <div className="relative w-14 h-14 bg-gradient-to-br from-[#1A3A6B] to-[#2E75C7] rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(26,58,107,0.3)] border-4 border-white active:scale-90 transition-all duration-200">
                    <Icon size={24} className="text-white" strokeWidth={2.5} />
                  </div>
                </div>
              ) : (
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 relative",
                  isActive ? "bg-[#F0F4F8]" : "bg-transparent group-active:bg-gray-50"
                )}>
                  <Icon 
                    size={22} 
                    className={cn(
                      "transition-all duration-300",
                      isActive ? "text-[#1A3A6B] stroke-[2.5px]" : "text-gray-400 group-hover:text-gray-500"
                    )} 
                  />
                </div>
              )}
              
              <span className={cn(
                "text-[10px] font-bold tracking-tight transition-colors duration-300",
                isActive ? "text-[#1A3A6B]" : "text-gray-400"
              )}>
                {label}
              </span>

              {isActive && !special && (
                <div className="absolute bottom-[-4px] w-4 h-0.5 bg-[#1A3A6B] rounded-full animate-in slide-in-from-bottom-1 duration-300" />
              )}
            </Link>
          )
        })}
      </div>
      {/* Bottom safe area for mobile notch */}
      <div className="h-[env(safe-area-inset-bottom)] bg-white" />
    </div>
  )
}
