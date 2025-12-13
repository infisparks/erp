"use client"

import { ChevronLeft, CreditCard, Clock, CheckCircle, AlertCircle, History } from "lucide-react"
import Link from "next/link"

export default function FeesPage() {
    const feeDetails = {
        total: 85000,
        paid: 70000,
        pending: 15000,
        dueDate: "15 Apr 2024",
        breakdown: [
            { item: "Tuition Fee", amount: 60000 },
            { item: "Development Fee", amount: 10000 },
            { item: "Library Fee", amount: 5000 },
            { item: "Exam Fee", amount: 2000 },
            { item: "Lab Charges", amount: 8000 },
        ]
    }

    const transactions = [
        { id: "TXN123456", date: "10 Jan 2024", amount: 35000, status: "Success", method: "UPI" },
        { id: "TXN123457", date: "15 Aug 2023", amount: 35000, status: "Success", method: "Net Banking" },
    ]

    return (
        <div className="bg-gray-50 min-h-screen pb-20 font-sans text-gray-900">
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex items-center gap-4 sticky top-0 z-10 shadow-md">
                <Link href="/studentapp">
                    <button className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                </Link>
                <h1 className="text-lg font-bold">Fees & Payments</h1>
            </div>

            <div className="p-5 space-y-6">
                {/* Main Card */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500 opacity-10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-gray-400 text-sm font-medium">Total Pending</p>
                            <h2 className="text-4xl font-bold mt-1">₹ {feeDetails.pending.toLocaleString('en-IN')}</h2>
                        </div>
                        <div className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs font-bold border border-red-500/30 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Due Soon
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400">Due Date</span>
                            <span className="font-semibold">{feeDetails.dueDate}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-indigo-500 h-full rounded-full"
                                style={{ width: `${(feeDetails.paid / feeDetails.total) * 100}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-400">
                            <span>Paid: ₹{feeDetails.paid.toLocaleString('en-IN')}</span>
                            <span>Total: ₹{feeDetails.total.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    <button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-900/40 active:scale-[0.98]">
                        Pay Now
                    </button>
                </div>

                {/* Breakdown */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-indigo-600" /> Fee Breakdown
                        </h3>
                    </div>
                    <div className="p-4 space-y-3">
                        {feeDetails.breakdown.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">{item.item}</span>
                                <span className="font-semibold text-gray-900">₹ {item.amount.toLocaleString('en-IN')}</span>
                            </div>
                        ))}
                        <div className="border-t border-gray-100 pt-3 mt-2 flex justify-between items-center font-bold text-gray-900">
                            <span>Total Amount</span>
                            <span>₹ {feeDetails.total.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div>
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2 px-1">
                        <History className="w-4 h-4 text-gray-500" /> Transaction History
                    </h3>
                    <div className="space-y-3">
                        {transactions.map((txn) => (
                            <div key={txn.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm">₹ {txn.amount.toLocaleString('en-IN')}</h4>
                                        <p className="text-xs text-gray-500">{txn.date} • {txn.method}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                                        {txn.status}
                                    </span>
                                    <p className="text-[10px] text-gray-400 mt-1">#{txn.id}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
