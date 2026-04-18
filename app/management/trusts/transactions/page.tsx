"use client"

import React, { useState, useEffect, useMemo } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { 
    Shield, History, ArrowLeft, Loader2, ArrowUpRight, 
    ArrowDownLeft, User, Search, Filter, Download, 
    Calendar, Building2, MousePointer2 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import Link from "next/link"

export default function TrustTransactionsPage() {
    const [transactions, setTransactions] = useState<any[]>([])
    const [trusts, setTrusts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    
    // Filters
    const [searchQuery, setSearchQuery] = useState("")
    const [trustFilter, setTrustFilter] = useState("all")
    const [typeFilter, setTypeFilter] = useState("all")

    const supabase = getSupabaseClient()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [transRes, trustsRes] = await Promise.all([
                    supabase.from('trust_transactions')
                        .select('*, trusts(name), students(fullname), courses(name)')
                        .order('created_at', { ascending: false }),
                    supabase.from('trusts').select('id, name').order('name')
                ])
                setTransactions(transRes.data || [])
                setTrusts(trustsRes.data || [])
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const matchesTrust = trustFilter === "all" || tx.trust_id === trustFilter
            const matchesType = typeFilter === "all" || tx.type === typeFilter
            const studentName = tx.students?.fullname?.toLowerCase() || ""
            const notes = tx.notes?.toLowerCase() || ""
            const trustName = tx.trusts?.name?.toLowerCase() || ""
            const matchesSearch = studentName.includes(searchQuery.toLowerCase()) || 
                                 notes.includes(searchQuery.toLowerCase()) ||
                                 trustName.includes(searchQuery.toLowerCase())
            return matchesTrust && matchesType && matchesSearch
        })
    }, [transactions, trustFilter, typeFilter, searchQuery])

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Querying Transaction Ledger</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-slate-100">
                        <Link href="/management/trusts">
                            <ArrowLeft className="h-5 w-5 text-slate-500" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Financial Ledger</h1>
                        <p className="text-slate-500 text-sm font-medium">Detailed audit trail of all trust fund movements.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm" className="rounded-xl border-slate-200 font-semibold h-10 px-4 text-xs">
                      <Download className="h-3.5 w-3.5 mr-2" /> Export Ledger
                   </Button>
                </div>
            </div>

            {/* Compact Filter Bar */}
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input 
                            placeholder="Search student or notes..." 
                            className="pl-9 h-10 rounded-xl border-slate-200 font-medium text-xs focus:ring-4 focus:ring-emerald-50"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div>
                        <Select value={trustFilter} onValueChange={setTrustFilter}>
                            <SelectTrigger className="h-10 rounded-xl border-slate-200 font-bold text-[10px] uppercase tracking-wider px-4">
                                <SelectValue placeholder="All Trusts" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all" className="text-xs font-bold">ALL AUTHORITIES</SelectItem>
                                {trusts.map(t => <SelectItem key={t.id} value={t.id} className="text-xs font-medium">{t.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="h-10 rounded-xl border-slate-200 font-bold text-[10px] uppercase tracking-wider px-4">
                                <SelectValue placeholder="All Movements" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="all" className="text-xs font-bold">ALL MOVEMENTS</SelectItem>
                                <SelectItem value="deposit" className="text-xs font-medium">INFLOW (DEPOSITS)</SelectItem>
                                <SelectItem value="payment" className="text-xs font-medium">OUTFLOW (SPONSORSHIPS)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2 pl-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{filteredTransactions.length} Total Records</p>
                    </div>
                </div>
            </Card>

            {/* Professional Ledger Table */}
            <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 h-14 border-b border-slate-100">
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400 pl-8">Date & Time</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Trust Authority</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Movement</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400">Beneficiary / Remarks</TableHead>
                                <TableHead className="font-bold uppercase text-[10px] tracking-widest text-slate-400 text-right pr-8">Amount (₹)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTransactions.map(tx => (
                                <TableRow key={tx.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                    <TableCell className="pl-8 py-5">
                                       <div className="flex items-center gap-3">
                                          <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center shadow-sm">
                                             <Calendar className="h-4 w-4 text-slate-400" />
                                          </div>
                                          <div>
                                             <p className="font-bold text-slate-900 text-sm">{format(tx.created_at, 'MMM dd, yyyy')}</p>
                                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{format(tx.created_at, 'HH:mm:ss')}</p>
                                          </div>
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <div className="flex items-center gap-2">
                                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                          <p className="font-bold text-slate-700 text-sm">{tx.trusts?.name}</p>
                                       </div>
                                    </TableCell>
                                    <TableCell>
                                       <Badge 
                                          variant="outline"
                                          className={tx.type === 'deposit' 
                                             ? "bg-blue-50 text-blue-700 border-blue-100 rounded-lg px-2 text-[9px] font-bold" 
                                             : "bg-emerald-50 text-emerald-700 border-emerald-100 rounded-lg px-2 text-[9px] font-bold"
                                          }
                                       >
                                          {tx.type === 'deposit' ? <ArrowDownLeft className="h-3 w-3 mr-1" /> : <ArrowUpRight className="h-3 w-3 mr-1" />}
                                          {tx.type === 'deposit' ? 'DEPOSIT' : 'PAYMENT'}
                                       </Badge>
                                    </TableCell>
                                    <TableCell>
                                       {tx.type === 'payment' ? (
                                          <div className="flex items-center gap-2">
                                             <div className="h-7 w-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[9px] font-bold">
                                                {tx.students?.fullname?.[0]}
                                             </div>
                                             <div>
                                                <p className="font-bold text-slate-900 text-xs tracking-tight">{tx.students?.fullname}</p>
                                                <p className="text-[9px] text-slate-400 font-medium uppercase">{tx.courses?.name || 'REGISTRY'}</p>
                                             </div>
                                          </div>
                                       ) : (
                                          <p className="text-[11px] font-medium text-slate-500 italic truncate max-w-[180px]">{tx.notes || 'Ledger Credit'}</p>
                                       )}
                                    </TableCell>
                                    <TableCell className="text-right pr-8">
                                       <div className="flex flex-col items-end">
                                          <p className={tx.type === 'deposit' ? "text-base font-bold text-blue-600" : "text-base font-bold text-slate-900"}>
                                             {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                          </p>
                                          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{tx.type === 'deposit' ? 'CREDIT' : 'DEBIT'}</p>
                                       </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </Card>

            {filteredTransactions.length === 0 && (
                <div className="py-20 flex flex-col items-center gap-3 opacity-30">
                   <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                      <History className="h-8 w-8 text-slate-300" />
                   </div>
                   <p className="font-bold uppercase tracking-[0.2em] text-[10px] text-slate-400">No matching ledger records found</p>
                </div>
            )}
        </div>
    )
}
