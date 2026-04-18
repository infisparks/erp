"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { Shield, ArrowLeft, Save, Loader2, Building2, User, Phone, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function AddTrustPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        details: "",
        contact_person: "",
        contact_phone: ""
    })
    
    const supabase = getSupabaseClient()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name) return
        
        setIsSubmitting(true)
        setError(null)
        
        try {
            const { error } = await supabase.from('trusts').insert([formData])
            if (error) throw error
            router.push('/management/trusts?success=Trust registered')
        } catch (err: any) {
            setError(err.message)
            setIsSubmitting(false)
        }
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
                   <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register Trust</h1>
                   <p className="text-slate-500 text-sm font-medium">Add a new sponsoring organization to the registry.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Card className="rounded-3xl border-slate-200 shadow-sm overflow-hidden bg-white">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
                                <Building2 className="text-emerald-400 h-4 w-4" />
                            </div>
                            <div>
                                <CardTitle className="text-base font-bold text-slate-900">Entity Registry</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Institutional Details</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                <Shield className="h-3 w-3 text-slate-400" /> Professional Name*
                            </Label>
                            <Input 
                                placeholder="e.g. Reliance Foundation" 
                                className="h-11 rounded-xl border-slate-200 font-semibold text-slate-900 focus:ring-4 focus:ring-emerald-50"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                    <User className="h-3 w-3 text-slate-400" /> Point of Contact
                                </Label>
                                <Input 
                                    placeholder="Representative Name" 
                                    className="h-11 rounded-xl border-slate-200 font-medium text-sm"
                                    value={formData.contact_person}
                                    onChange={e => setFormData({...formData, contact_person: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                    <Phone className="h-3 w-3 text-slate-400" /> Phone Number
                                </Label>
                                <Input 
                                    placeholder="+91 ..." 
                                    className="h-11 rounded-xl border-slate-200 font-medium text-sm"
                                    value={formData.contact_phone}
                                    onChange={e => setFormData({...formData, contact_phone: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                <Info className="h-3 w-3 text-slate-400" /> Additional Notes
                            </Label>
                            <Textarea 
                                placeholder="Describe mission, focus areas, or internal notes..." 
                                className="min-h-[100px] rounded-xl border-slate-200 font-medium text-sm p-4 focus:ring-4 focus:ring-emerald-50"
                                value={formData.details}
                                onChange={e => setFormData({...formData, details: e.target.value})}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-center gap-3 text-red-900">
                                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                <p className="text-[11px] font-bold uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            disabled={isSubmitting} 
                            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest transition-all active:scale-[0.98]"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Register Authority
                        </Button>
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}
