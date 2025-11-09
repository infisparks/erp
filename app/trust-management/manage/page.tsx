"use client"

import React, { useState, useEffect, useTransition } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Loader2, Save, AlertTriangle } from "lucide-react"

// --- Type Definitions ---
interface Trust {
  id: string
  name: string
  details: string | null
  current_balance: number
}

// Helper: Format Currency
const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "N/A"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount)
}

// ---------------------------------
// Page: Manage Trusts
// ---------------------------------
export default function ManageTrustsPage() {
  const [supabase] = useState(() => getSupabaseClient())
  const [trusts, setTrusts] = useState<Trust[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // --- Form State ---
  const [name, setName] = useState("")
  const [details, setDetails] = useState("")

  // --- Data Fetching ---
  const fetchTrusts = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from("trusts")
      .select("*")
      .order("name", { ascending: true })

    if (error) {
      toast.error("Failed to fetch trusts.", { description: error.message })
      setError(error.message)
    } else {
      setTrusts(data as Trust[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTrusts()
  }, [supabase])

  // --- Form Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) {
      toast.error("Trust name is required.")
      return
    }

    startTransition(async () => {
      const { error } = await supabase
        .from("trusts")
        .insert({ name: name, details: details })

      if (error) {
        toast.error("Failed to create trust.", { description: error.message })
      } else {
        toast.success(`Trust "${name}" created successfully.`)
        setName("")
        setDetails("")
        fetchTrusts() // Refresh list
      }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* --- Create Form --- */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Create New Trust</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trust-name">Trust Name*</Label>
                <Input
                  id="trust-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g., Anjuman-I-Islam Trust"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trust-details">Details</Label>
                <Textarea
                  id="trust-details"
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="Contact info, purpose, etc."
                />
              </div>
              <Button type="submit" disabled={isPending || !name}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Trust
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* --- Trusts List --- */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Existing Trusts</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <p className="text-destructive text-sm">Failed to load trusts.</p>
            ) : (
              <div className="border rounded-lg max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted">
                    <TableRow>
                      <TableHead>Trust Name</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">
                        Available Balance
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trusts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center h-24">
                          No trusts found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      trusts.map(trust => (
                        <TableRow key={trust.id}>
                          <TableCell className="font-medium">
                            {trust.name}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                            {trust.details}
                          </TableCell>
                          <TableCell className="text-right font-bold text-lg text-primary">
                            {formatCurrency(trust.current_balance)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}