"use client"

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { 
  Shield, Building2, TrendingUp, History, Plus, 
  Search, ArrowUpRight, Loader2, Filter, 
  ExternalLink, IndianRupee, MoreHorizontal
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// --- Types ---
interface Trust {
    id: string;
    name: string;
    details: string | null;
    contact_person: string | null;
    contact_phone: string | null;
    created_at: string;
}

interface TrustTransaction {
    id: string;
    trust_id: string;
    type: 'deposit' | 'payment';
    amount: number;
    notes: string | null;
}

export default function TrustManagementPage() {
    const [trusts, setTrusts] = useState<Trust[]>([])
    const [transactions, setTransactions] = useState<TrustTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    const supabase = getSupabaseClient()

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const [trustsRes, transRes] = await Promise.all([
                    supabase.from('trusts').select('*').order('name'),
                    supabase.from('trust_transactions').select('trust_id, type, amount')
                ])
                setTrusts(trustsRes.data || [])
                setTransactions(transRes.data || [])
            } catch (err: any) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // --- Dynamic Logic ---
    const trustBalances = useMemo(() => {
        const balances: Record<string, number> = {}
        transactions.forEach(tx => {
            const current = balances[tx.trust_id] || 0
            balances[tx.trust_id] = tx.type === 'deposit' ? current + Number(tx.amount) : current - Number(tx.amount)
        })
        return balances
    }, [transactions])

    const stats = useMemo(() => {
        const total = Object.values(trustBalances).reduce((acc, b) => acc + b, 0)
        const outflow = transactions.filter(t => t.type === 'payment').reduce((acc, t) => acc + Number(t.amount), 0)
        return { total, outflow }
    }, [trustBalances, transactions])

    const filteredTrusts = trusts.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Building Registry...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-12">
            
            {/* ── Page Header ────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                   <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Trust Registry</h1>
                   <p className="text-slate-500 text-sm">Centralized sponsorship management & institutional fund auditing.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" className="rounded-xl border-slate-200">
                        <Link href="/management/trusts/transactions">
                           <History className="h-4 w-4 mr-2 text-slate-500" /> View History
                        </Link>
                    </Button>
                    <Button asChild className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg ring-offset-2">
                        <Link href="/management/trusts/add">
                           <Plus className="h-4 w-4 mr-2" /> Register Authority
                        </Link>
                    </Button>
                </div>
            </div>

            {/* ── Quick Stats ────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[2rem] border-slate-200 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-8">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">AGGREGATE LIQUIDITY</p>
                       <p className="text-3xl font-bold text-slate-900 tracking-tight">₹{stats.total.toLocaleString()}</p>
                       <div className="flex items-center gap-2 mt-4">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <p className="text-xs font-semibold text-emerald-600">Stable Reserve Portfolio</p>
                       </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-slate-200 shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-8">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">TOTAL SPONSORSHIPS</p>
                       <p className="text-3xl font-bold text-slate-900 tracking-tight">₹{stats.outflow.toLocaleString()}</p>
                       <div className="mt-4 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-900 w-[70%]" />
                       </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[2rem] border-slate-200 shadow-sm bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-8">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ACTIVE AUTHORITIES</p>
                       <p className="text-3xl font-bold text-slate-900 tracking-tight">{trusts.length}</p>
                       <Button asChild variant="link" className="h-auto p-0 text-xs font-bold mt-4 text-indigo-600">
                          <Link href="/management/trusts/fund">Inject Capital <ArrowUpRight className="h-3 w-3 ml-1" /></Link>
                       </Button>
                    </CardContent>
                </Card>
            </div>

            {/* ── Main Data View ────────────────────────────── */}
            <Card className="rounded-[2.5rem] border-slate-200 shadow-xl overflow-hidden bg-white">
                <CardHeader className="p-8 border-b border-slate-100 pb-12">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-1">
                         <CardTitle className="text-xl font-bold">Manage Authorized Trusts</CardTitle>
                         <CardDescription>Filter and audit institutional sponsorship providers.</CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                         <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                               placeholder="Search authority, person..." 
                               className="h-12 rounded-2xl border-slate-200 pl-11 pr-4 bg-slate-50 focus:bg-white transition-all text-sm font-semibold"
                               value={searchQuery}
                               onChange={(e) => setSearchQuery(e.target.value)}
                            />
                         </div>
                         <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-200">
                            <Filter className="h-4 w-4 text-slate-600" />
                         </Button>
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="h-14 bg-slate-50/50 border-b border-slate-100">
                                <TableHead className="pl-8 font-bold text-[10px] uppercase tracking-widest text-slate-400">Trust Authority</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Point of Contact</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Organization Type</TableHead>
                                <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400 text-right pr-8">Calculated Balance</TableHead>
                                <TableHead className="w-20 pr-8"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTrusts.map(trust => {
                                const balance = trustBalances[trust.id] || 0
                                return (
                                    <TableRow key={trust.id} className="hover:bg-slate-50/50 transition-colors border-slate-100">
                                        <TableCell className="py-6 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                                                    <Building2 className="h-5 w-5 text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 text-sm leading-tight">{trust.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">ID: ...{trust.id.slice(-6)}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                           <div className="space-y-1">
                                              <p className="font-bold text-slate-700 text-xs">{trust.contact_person || 'Organizational'}</p>
                                              <p className="text-[10px] text-slate-500 font-medium">{trust.contact_phone || 'External Registry'}</p>
                                           </div>
                                        </TableCell>
                                        <TableCell>
                                           <Badge variant="secondary" className="bg-slate-100 text-slate-700 rounded-lg px-2 py-0.5 text-[9px] font-bold border-none">INSTITUTIONAL</Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <p className="text-lg font-bold text-slate-900 tracking-tighter">₹{balance.toLocaleString()}</p>
                                            <div className="flex items-center justify-end gap-1 mt-1">
                                               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                               <p className="text-[9px] font-bold text-emerald-600 uppercase">Live Credit</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl border-slate-200">
                                                    <DropdownMenuItem asChild className="cursor-pointer text-xs font-bold py-2">
                                                        <Link href={`/management/trusts/fund?trust_id=${trust.id}`}>
                                                            <TrendingUp className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                                                            Deposit Funds
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild className="cursor-pointer text-xs font-bold py-2">
                                                        <Link href={`/management/trusts/transactions?trust_id=${trust.id}`}>
                                                            <History className="h-3.5 w-3.5 mr-2 text-indigo-600" />
                                                            Audit Ledger
                                                        </Link>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                    {filteredTrusts.length === 0 && (
                       <div className="py-20 text-center space-y-3 opacity-30">
                          <Search className="h-10 w-10 mx-auto text-slate-300" />
                          <p className="font-bold text-xs uppercase tracking-[0.2em] text-slate-400">No matching authorities found</p>
                       </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
