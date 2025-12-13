"use client"

import { ChevronLeft, Bus, MapPin, Clock, Phone, Navigation } from "lucide-react"
import Link from "next/link"

export default function TransportPage() {
    const busInfo = {
        route: "Route 12 - South Delhi",
        busNumber: "DL 1PC 2024",
        driver: "Rajesh Kumar",
        phone: "+91 98765 43210",
        eta: "15 mins",
        nextStop: "Green Park Metro",
        status: "On Time"
    }

    const stops = [
        { name: "Hauz Khas", time: "07:30 AM", status: "Departed" },
        { name: "Green Park", time: "07:45 AM", status: "Next" },
        { name: "AIIMS", time: "08:00 AM", status: "Pending" },
        { name: "College Campus", time: "08:30 AM", status: "Pending" },
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
                <h1 className="text-lg font-bold">Transport Tracking</h1>
            </div>

            {/* Map Placeholder */}
            <div className="h-64 bg-gray-200 relative w-full">
                <div className="absolute inset-0 flex items-center justify-center bg-indigo-50/50">
                    <div className="text-center">
                        <MapPin className="w-8 h-8 text-indigo-600 mx-auto mb-2 animate-bounce" />
                        <p className="text-sm font-bold text-gray-500">Live Map View</p>
                    </div>
                </div>

                {/* Floating Status Card */}
                <div className="absolute bottom-4 left-4 right-4 bg-white p-4 rounded-2xl shadow-lg border border-gray-100 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-400 font-medium">Next Stop</p>
                        <h3 className="font-bold text-gray-800">{busInfo.nextStop}</h3>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400 font-medium">ETA</p>
                        <h3 className="font-bold text-indigo-600 text-xl">{busInfo.eta}</h3>
                    </div>
                </div>
            </div>

            <div className="p-5 space-y-6">
                {/* Driver Info */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                            <Bus className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 text-sm">{busInfo.busNumber}</h4>
                            <p className="text-xs text-gray-500">{busInfo.route}</p>
                        </div>
                    </div>
                    <button className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors">
                        <Phone className="w-5 h-5" />
                    </button>
                </div>

                {/* Timeline */}
                <div>
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-indigo-600" /> Route Timeline
                    </h3>
                    <div className="space-y-0 pl-2">
                        {stops.map((stop, index) => (
                            <div key={index} className="flex gap-4 relative pb-8 last:pb-0">
                                {/* Line */}
                                {index !== stops.length - 1 && (
                                    <div className="absolute left-[9px] top-2 bottom-0 w-0.5 bg-gray-200"></div>
                                )}

                                {/* Dot */}
                                <div className={`w-5 h-5 rounded-full border-4 shrink-0 z-10 ${stop.status === 'Departed' ? 'bg-green-500 border-green-100' :
                                        stop.status === 'Next' ? 'bg-indigo-500 border-indigo-100 animate-pulse' :
                                            'bg-gray-300 border-gray-100'
                                    }`}></div>

                                <div className="flex-1 -mt-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`font-bold text-sm ${stop.status === 'Pending' ? 'text-gray-400' : 'text-gray-800'}`}>
                                            {stop.name}
                                        </h4>
                                        <span className="text-xs font-medium text-gray-500">{stop.time}</span>
                                    </div>
                                    <p className={`text-[10px] font-bold mt-0.5 ${stop.status === 'Departed' ? 'text-green-600' :
                                            stop.status === 'Next' ? 'text-indigo-600' : 'text-gray-400'
                                        }`}>
                                        {stop.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
