"use client"

import { ChevronLeft, Search, MapPin, Phone, Tag } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function LostFoundPage() {
    const [activeTab, setActiveTab] = useState("lost")

    const items = [
        { id: 1, title: "Blue Water Bottle", location: "Library, 2nd Floor", date: "Today, 10:00 AM", type: "lost", image: "🧴", contact: "9876543210" },
        { id: 2, title: "Casio Calculator", location: "Lab 3", date: "Yesterday", type: "found", image: "🧮", contact: "Admin Office" },
        { id: 3, title: "Bike Keys (Honda)", location: "Parking Lot", date: "12 Dec", type: "lost", image: "🔑", contact: "9876543211" },
        { id: 4, title: "Black Hoodie", location: "Canteen", date: "10 Dec", type: "found", image: "🧥", contact: "Lost & Found Desk" },
    ]

    const filteredItems = items.filter(item => item.type === activeTab)

    return (
        <div className="bg-gray-50 min-h-screen pb-24 font-sans text-gray-900">
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex items-center gap-4 sticky top-0 z-10 shadow-md">
                <Link href="/studentapp">
                    <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </Link>
                <h1 className="text-lg font-bold">Lost & Found</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* Tabs */}
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex">
                    <button
                        onClick={() => setActiveTab("lost")}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'lost' ? 'bg-red-50 text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Lost Items
                    </button>
                    <button
                        onClick={() => setActiveTab("found")}
                        className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'found' ? 'bg-green-50 text-green-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Found Items
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab} items...`}
                        className="w-full bg-white pl-10 pr-4 py-3 rounded-xl shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {filteredItems.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 group hover:shadow-md transition-all">
                            <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center text-4xl mb-1">
                                {item.image}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800 text-sm line-clamp-1">{item.title}</h3>
                                <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                    <MapPin className="w-3 h-3" /> {item.location}
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                    <Tag className="w-3 h-3" /> {item.date}
                                </div>
                            </div>
                            <button className={`w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 mt-auto ${activeTab === 'lost' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                }`}>
                                <Phone className="w-3 h-3" /> Contact
                            </button>
                        </div>
                    ))}
                </div>

                <button className="fixed bottom-24 right-5 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-500/30 flex items-center justify-center text-2xl hover:scale-110 transition-transform">
                    +
                </button>
            </div>
        </div>
    )
}
