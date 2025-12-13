"use client"

import { ChevronLeft, QrCode, RefreshCw, CheckCircle, MapPin } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function AttendanceQRPage() {
    const [timeLeft, setTimeLeft] = useState(30)
    const [qrState, setQrState] = useState("active") // active, scanned

    useEffect(() => {
        if (qrState === 'active') {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) return 30
                    return prev - 1
                })
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [qrState])

    return (
        <div className="bg-gray-900 min-h-screen pb-24 font-sans text-white">
            {/* Header */}
            <div className="bg-transparent p-4 flex items-center gap-4 sticky top-0 z-10">
                <Link href="/studentapp">
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </Link>
                <h1 className="text-lg font-bold">Mark Attendance</h1>
            </div>

            <div className="p-5 flex flex-col items-center justify-center min-h-[80vh]">

                <div className="w-full max-w-sm bg-white rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl shadow-indigo-500/20">
                    <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500 animate-pulse"></div>

                    <h2 className="text-gray-800 font-bold text-xl mb-1">Scan to Mark</h2>
                    <p className="text-gray-400 text-sm mb-8">Show this QR code to the faculty</p>

                    <div className="relative w-64 h-64 mx-auto mb-8 group">
                        <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative bg-white border-4 border-gray-100 rounded-2xl p-4 flex items-center justify-center h-full w-full">
                            {/* Simulated QR Code Pattern */}
                            <div className="w-full h-full grid grid-cols-6 grid-rows-6 gap-1">
                                {[
                                    1, 0, 1, 1, 0, 1,
                                    0, 1, 0, 0, 1, 0,
                                    1, 1, 1, 1, 1, 1,
                                    1, 0, 0, 0, 0, 1,
                                    0, 1, 1, 0, 1, 0,
                                    1, 0, 1, 1, 0, 1,
                                    0, 1, 0, 1, 0, 0,
                                    1, 1, 0, 0, 1, 1,
                                    0, 0, 1, 1, 0, 0,
                                    1, 0, 1, 0, 1, 0,
                                    0, 1, 0, 1, 0, 1,
                                    1, 1, 1, 0, 0, 1
                                ].map((val, i) => (
                                    <div key={i} className={`rounded-sm ${val ? 'bg-gray-900' : 'bg-transparent'}`}></div>
                                ))}
                                {/* Corner markers */}
                                <div className="absolute top-4 left-4 w-12 h-12 border-4 border-gray-900 rounded-lg"></div>
                                <div className="absolute top-4 right-4 w-12 h-12 border-4 border-gray-900 rounded-lg"></div>
                                <div className="absolute bottom-4 left-4 w-12 h-12 border-4 border-gray-900 rounded-lg"></div>
                            </div>
                        </div>

                        {/* Scan Line Animation */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-indigo-600 font-bold bg-indigo-50 py-2 px-4 rounded-full mx-auto w-max">
                        <RefreshCw className={`w-4 h-4 ${timeLeft < 10 ? 'animate-spin' : ''}`} />
                        <span>Refreshing in {timeLeft}s</span>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="flex items-center gap-3 text-left">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-medium">Current Location</p>
                                <p className="text-sm font-bold text-gray-800">LH-101, CS Block</p>
                            </div>
                            <div className="ml-auto">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <p className="mt-8 text-gray-500 text-xs text-center max-w-xs">
                    This QR code is valid for one-time use only. Do not share screenshots.
                </p>
            </div>
        </div>
    )
}
