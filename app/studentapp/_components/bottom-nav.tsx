"use client"

import { Calendar, CreditCard, Home, User, Book, Briefcase } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function BottomNav() {
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 px-6 py-3 flex justify-between items-center max-w-md mx-auto z-50 pb-safe">
            <Link href="/studentapp" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/studentapp') ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                <Home className={`w-6 h-6 ${isActive('/studentapp') ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-medium">Home</span>
            </Link>
            <Link href="/studentapp/timetable" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/studentapp/timetable') ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                <Calendar className={`w-6 h-6 ${isActive('/studentapp/timetable') ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-medium">Schedule</span>
            </Link>
            <Link href="/studentapp/assignments" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/studentapp/assignments') ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                <Book className={`w-6 h-6 ${isActive('/studentapp/assignments') ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-medium">Tasks</span>
            </Link>
            <Link href="/studentapp/fees" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/studentapp/fees') ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                <CreditCard className={`w-6 h-6 ${isActive('/studentapp/fees') ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-medium">Fees</span>
            </Link>
            <Link href="/studentapp/profile" className={`flex flex-col items-center gap-1 transition-colors ${isActive('/studentapp/profile') ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                <User className={`w-6 h-6 ${isActive('/studentapp/profile') ? 'fill-current' : ''}`} />
                <span className="text-[10px] font-medium">Profile</span>
            </Link>
        </nav>
    )
}
