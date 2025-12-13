"use client"

import { ChevronLeft, Book, Search, Clock, Calendar } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function LibraryPage() {
    const [activeTab, setActiveTab] = useState("issued")

    const issuedBooks = [
        { id: 1, title: "Introduction to Algorithms", author: "Thomas H. Cormen", dueDate: "15 Dec 2024", cover: "bg-red-100", status: "Due Soon" },
        { id: 2, title: "Clean Code", author: "Robert C. Martin", dueDate: "20 Dec 2024", cover: "bg-blue-100", status: "Active" },
    ]

    const history = [
        { id: 3, title: "Design Patterns", author: "Erich Gamma", returnedDate: "10 Nov 2024", cover: "bg-green-100" },
        { id: 4, title: "The Pragmatic Programmer", author: "Andrew Hunt", returnedDate: "05 Oct 2024", cover: "bg-yellow-100" },
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
                <h1 className="text-lg font-bold">Digital Library</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search for books, journals..."
                        className="w-full bg-white pl-10 pr-4 py-3 rounded-xl shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>

                {/* Tabs */}
                <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                    <button
                        onClick={() => setActiveTab("issued")}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === "issued" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        Issued Books
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === "history" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        History
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {activeTab === "issued" ? (
                        issuedBooks.map((book) => (
                            <div key={book.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
                                <div className={`w-20 h-28 rounded-lg shrink-0 ${book.cover} flex items-center justify-center`}>
                                    <Book className="w-8 h-8 text-gray-400 opacity-50" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm line-clamp-2">{book.title}</h3>
                                        <p className="text-xs text-gray-500 mt-1">{book.author}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                                            <Calendar className="w-3 h-3" /> Due: {book.dueDate}
                                        </div>
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${book.status === "Due Soon" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                                            }`}>
                                            {book.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        history.map((book) => (
                            <div key={book.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 opacity-75">
                                <div className={`w-20 h-28 rounded-lg shrink-0 ${book.cover} flex items-center justify-center`}>
                                    <Book className="w-8 h-8 text-gray-400 opacity-50" />
                                </div>
                                <div className="flex-1 flex flex-col justify-between py-1">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm line-clamp-2">{book.title}</h3>
                                        <p className="text-xs text-gray-500 mt-1">{book.author}</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Clock className="w-3 h-3" /> Returned: {book.returnedDate}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
