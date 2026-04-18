"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { 
    Shield, ArrowLeft, Save, Loader2, TrendingUp, 
    ArrowRightLeft, IndianRupee, History, Building2 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function FundRefillPage() {
    const [trusts, setTrusts] = useState<any[]>([])
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    
    const [selectedTrustId, setSelectedTrustId] = useState("")
    const [amount, setAmount] = useState("")
    const [notes, setNotes] = useState("")

    const supabase = getSupabaseClient()
    const router = useRouter()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [trustsRes, transRes] = await Promise.all([
                    supabase.from('trusts').select('*').order('name'),
                    supabase.from('trust_transactions').select('trust_id, type, amount')
                ])
                setTrusts(trustsRes.data || [])
                setTransactions(transRes.data || [])
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const trustBalances = useMemo(() => {
        const balances: Record<string, number> = {}
        transactions.forEach(tx => {
            const current = balances[tx.trust_id] || 0
            if (tx.type === 'deposit') {
                balances[tx.trust_id] = current + Number(tx.amount)
            } else {
                balances[tx.trust_id] = current - Number(tx.amount)
            }
        })
        return balances
    }, [transactions])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedTrustId || !amount || parseFloat(amount) <= 0) return
        
        setIsSubmitting(true)
        setError(null)
        
        try {
            const { error } = await supabase.from('trust_transactions').insert([{
                trust_id: selectedTrustId,
                type: 'deposit',
                amount: parseFloat(amount),
                notes: notes || 'Fund refilled'
            }])
            if (error) throw error
            router.push('/management/trusts?success=Fund deposited successfully')
        } catch (err: any) {
            setError(err.message)
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accessing Financial Vault</p>
            </div>
        )
    }

    return (
        <div className="max-w-xl mx-auto py-10 px-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-slate-100">
                    <Link href="/management/trusts">
                        <ArrowLeft className="h-5 w-5 text-slate-500" />
                    </Link>
                </Button>
                <div>
                   <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Deposit Funds</h1>
                   <p className="text-slate-500 text-sm font-medium">Inject capital into an existing trust account.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8 text-center">
                        <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 mb-4 font-bold text-white uppercase text-xs">
                             <TrendingUp className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl font-bold text-slate-900">Capital Injection</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mt-1">Transaction Ledger Sync</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Select Trust Authority</Label>
                            <Select value={selectedTrustId} onValueChange={setSelectedTrustId}>
                                <SelectTrigger className="h-12 rounded-xl border-slate-200 font-semibold text-slate-900">
                                    <SelectValue placeholder="Choose authority..." />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {trusts.map(t => (
                                        <SelectItem key={t.id} value={t.id} className="py-2.5 font-medium">
                                            {t.name} (₹{(trustBalances[t.id] || 0).toLocaleString()})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedTrustId && (
                           <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between animate-in zoom-in-95">
                               <div>
                                  <p className="text-[9px] font-bold text-blue-700 uppercase tracking-widest mb-0.5">Current Liquidity</p>
                                  <p className="text-lg font-bold text-slate-900 tracking-tight">₹{(trustBalances[selectedTrustId] || 0).toLocaleString()}</p>
                               </div>
                               <Badge variant="outline" className="bg-white border-blue-100 text-blue-700 font-bold text-[9px]">ACTIVE LEDGER</Badge>
                           </div>
                        )}

                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Contribution Amount (₹)</Label>
                            <div className="relative">
                               <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                  <IndianRupee className="h-5 w-5 text-slate-400" />
                               </div>
                               <Input 
                                   type="number"
                                   placeholder="0.00" 
                                   className="h-16 rounded-2xl border-slate-200 pl-12 text-2xl font-bold focus:ring-4 focus:ring-blue-50 transition-all text-blue-700"
                                   value={amount}
                                   onChange={e => setAmount(e.target.value)}
                                   required
                               />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Source / Ref. Notes</Label>
                            <Input 
                                placeholder="e.g. CSR Grant / Cheque #1234" 
                                className="h-12 rounded-xl border-slate-200 font-semibold px-4 text-sm"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-red-900 text-[10px] font-bold uppercase text-center tracking-tight">
                                {error}
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            disabled={isSubmitting || !selectedTrustId} 
                            className="w-full h-14 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-lg transition-all active:scale-[0.98]"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Confirm Deposit
                        </Button>
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}
