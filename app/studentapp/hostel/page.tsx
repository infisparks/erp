"use client"

import { ChevronLeft, Utensils, AlertCircle, Calendar, BedDouble } from "lucide-react"
import Link from "next/link"

export default function HostelPage() {
    const menu = {
        breakfast: "Idli Sambar, Coffee",
        lunch: "Rice, Dal, Mixed Veg, Curd",
        snacks: "Samosa, Tea",
        dinner: "Chapati, Paneer Butter Masala, Milk"
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-24 font-sans text-gray-900">
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex items-center gap-4 sticky top-0 z-10 shadow-md">
                <Link href="/studentapp">
                    <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </Link>
                <h1 className="text-lg font-bold">Hostel & Mess</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* Room Info */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                            <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Room Number</p>
                            <h2 className="text-3xl font-bold">B-304</h2>
                        </div>
                        <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                            <BedDouble className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm relative z-10">
                        <div>
                            <p className="text-indigo-200 text-xs">Block</p>
                            <p className="font-semibold">Boys Hostel 2</p>
                        </div>
                        <div>
                            <p className="text-indigo-200 text-xs">Warden</p>
                            <p className="font-semibold">Mr. R. Sharma</p>
                        </div>
                    </div>
                </div>

                {/* Mess Menu */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-orange-50 flex justify-between items-center">
                        <h3 className="font-bold text-orange-800 flex items-center gap-2">
                            <Utensils className="w-5 h-5" /> Today's Menu
                        </h3>
                        <span className="text-xs font-bold text-orange-600 bg-white px-2 py-1 rounded-md">Mon, 12 Dec</span>
                    </div>
                    <div className="p-4 space-y-4">
                        {Object.entries(menu).map(([meal, items]) => (
                            <div key={meal} className="flex gap-4">
                                <div className="w-20 shrink-0">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{meal}</p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-800">{items}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-700 text-xs">Complaint</span>
                    </button>
                    <button className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-700 text-xs">Leave Request</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
