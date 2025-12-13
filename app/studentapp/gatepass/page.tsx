"use client"

import { ChevronLeft, QrCode, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function GatePassPage() {
    const [activeTab, setActiveTab] = useState("active")

    const passes = [
        {
            id: "GP-2024-001",
            type: "Outing",
            reason: "Medical Appointment",
            outTime: "10:00 AM",
            inTime: "02:00 PM",
            date: "14 Dec 2024",
            status: "Approved",
            approver: "Warden"
        },
        {
            id: "GP-2024-002",
            type: "Home Visit",
            reason: "Family Function",
            outTime: "05:00 PM",
            inTime: "08:00 AM (Mon)",
            date: "20 Dec 2024",
            status: "Pending",
            approver: "HOD"
        }
    ]

    return (
        <div className="bg-gray-50 min-h-screen pb-24 font-sans text-gray-900">
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex items-center gap-4 sticky top-0 z-10 shadow-md">
                <Link href="/studentapp">
                    <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </Link>
                <h1 className="text-lg font-bold">Digital Gate Pass</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* New Pass Button */}
                <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                    <QrCode className="w-5 h-5" /> Request New Pass
                </button>

                {/* Active Pass Card */}
                {activeTab === 'active' && (
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-indigo-100 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-green-500"></div>
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Active Pass</h3>
                        <div className="w-48 h-48 bg-gray-900 mx-auto rounded-xl flex items-center justify-center mb-4">
                            <QrCode className="w-24 h-24 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-1">GP-2024-001</h2>
                        <p className="text-sm text-green-600 font-bold bg-green-50 inline-block px-3 py-1 rounded-full mb-4">Approved</p>

                        <div className="grid grid-cols-2 gap-4 text-left bg-gray-50 p-4 rounded-xl">
                            <div>
                                <p className="text-xs text-gray-400">Out Time</p>
                                <p className="font-bold text-gray-800">10:00 AM</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">In Time</p>
                                <p className="font-bold text-gray-800">02:00 PM</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-xs text-gray-400">Reason</p>
                                <p className="font-bold text-gray-800">Medical Appointment</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* History List */}
                <div>
                    <h3 className="font-bold text-gray-800 mb-3">Recent Requests</h3>
                    <div className="space-y-3">
                        {passes.map((pass) => (
                            <div key={pass.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-gray-800 text-sm">{pass.type}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${pass.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>{pass.status}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">{pass.date}</p>
                                </div>
                                <ChevronLeft className="w-4 h-4 text-gray-300 rotate-180" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
