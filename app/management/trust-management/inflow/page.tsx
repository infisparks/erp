"use client"

import React, { useState, useEffect, useTransition } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save } from "lucide-react"

// --- Type Definitions ---
interface Trust {
  id: string
  name: string
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
// Page: Add Funds (Inflow)
// ---------------------------------
export default function AddFundsInflowPage() {
  const [supabase] = useState(() => getSupabaseClient())
  const [trusts, setTrusts] = useState<Trust[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // --- Form State ---
  const [trustId, setTrustId] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")

  // --- Data Fetching ---
  const fetchTrusts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("trusts")
      .select("id, name, current_balance")
      .order("name", { ascending: true })

    if (error) {
      toast.error("Failed to fetch trusts.", { description: error.message })
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
    const numAmount = parseFloat(amount)

    if (!trustId || !numAmount || numAmount <= 0) {
      toast.error("Please select a trust and enter a valid positive amount.")
      return
    }

    startTransition(async () => {
      const { error } = await supabase.rpc("add_trust_inflow", {
        p_trust_id: trustId,
        p_amount: numAmount,
        p_notes: notes,
      })

      if (error) {
        toast.error("Failed to add funds.", { description: error.message })
      } else {
        toast.success(
          `Successfully added ${formatCurrency(numAmount)} to the trust.`,
        )
        setTrustId("")
        setAmount("")
        setNotes("")
        fetchTrusts() // Refresh list
      }
    })
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add Funds to a Trust (Inflow)</CardTitle>
        <CardDescription>
          Record new funds received by a trust. This will increase the
          trust's available balance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inflow-trust">Select Trust*</Label>
              <Select value={trustId} onValueChange={setTrustId}>
                <SelectTrigger id="inflow-trust">
                  <SelectValue placeholder="Select a trust..." />
                </SelectTrigger>
                <SelectContent>
                  {trusts.map(trust => (
                    <SelectItem key={trust.id} value={trust.id}>
                      {trust.name} ({formatCurrency(trust.current_balance)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inflow-amount">Amount Received*</Label>
              <Input
                id="inflow-amount"
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inflow-notes">Notes</Label>
              <Textarea
                id="inflow-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g., Donation from John Doe, Cheque #12345"
              />
            </div>

            <Button type="submit" disabled={isPending || !trustId || !amount}>
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Add Funds
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}