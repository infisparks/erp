"use client"

import { ChevronLeft, HelpCircle, MessageSquare, Phone, Mail, ChevronRight } from "lucide-react"
import Link from "next/link"

export default function HelpdeskPage() {
    const faqs = [
        "How do I reset my portal password?",
        "What is the procedure for fee refund?",
        "How to apply for a bonafide certificate?",
        "Where can I find the academic calendar?"
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
                <h1 className="text-lg font-bold">Helpdesk & Support</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* Search */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                        <HelpCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">How can we help you?</h2>
                    <p className="text-sm text-gray-500 mb-6">Search our knowledge base or contact support directly.</p>
                    <input
                        type="text"
                        placeholder="Search for help..."
                        className="w-full bg-gray-50 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>

                {/* Quick Contact */}
                <div className="grid grid-cols-2 gap-4">
                    <button className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                            <Phone className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-700 text-xs">Call Admin</span>
                    </button>
                    <button className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                            <Mail className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-gray-700 text-xs">Email Support</span>
                    </button>
                </div>

                {/* Raise Ticket */}
                <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">Have a specific issue?</h3>
                        <p className="text-indigo-200 text-xs mt-1">Raise a grievance ticket and track status.</p>
                    </div>
                    <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm">
                        Raise Ticket
                    </button>
                </div>

                {/* FAQs */}
                <div>
                    <h3 className="font-bold text-gray-800 mb-3">Frequently Asked Questions</h3>
                    <div className="space-y-2">
                        {faqs.map((faq, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50">
                                <span className="text-sm text-gray-600 font-medium">{faq}</span>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
