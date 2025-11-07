"use client"

import React, { useState, useEffect, Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSupabaseClient } from '@/lib/supabase/client'
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, ArrowLeft, Printer } from "lucide-react"

// --- Type Definitions ---
interface PaymentDetails {
  id: string;
  student_id: string;
  academic_year: string;
  amount: number;
  fees_type: string | null;
  payment_method: string | null;
  bank_name: string | null;
  cheque_number: string | null;
  transaction_id: string | null;
  trust_name: string | null; 
  trust_id: string | null;   
  notes: string | null;
  created_at: string;
  receipt_no: number; // The sequential receipt number
}

interface StudentDetails {
  id: string;
  fullname: string | null;
  roll_number: string | null; // From student_semesters
  course_name: string | null; // From courses
  academic_year: string; // The year for this receipt
  original_admission_fee: number; // Net Payable
}

// --- Helper function to convert number to words (Indian Rupee format) ---
const toWords = (num: number): string => {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  const inWords = (n: number): string => {
    let str = '';
    if (n === 0) return '';
    if (n < 20) {
      str = a[n];
    } else {
      const digit = n % 10; 
      const tens = Math.floor(n / 10);
      str = b[tens] + (digit ? ' ' + a[digit] : '');
    }
    return str;
  };

  const numStr = num.toFixed(2);
  const [rupees, paise] = numStr.split('.').map(Number);

  let rupeesWords = '';
  if (rupees === 0) {
    rupeesWords = 'Zero';
  } else {
    const crores = Math.floor(rupees / 10000000);
    const lakhs = Math.floor((rupees % 10000000) / 100000);
    const thousands = Math.floor((rupees % 100000) / 1000);
    const hundreds = Math.floor((rupees % 1000) / 100);
    const rest = rupees % 100;

    if (crores) rupeesWords += inWords(crores) + ' Crore ';
    if (lakhs) rupeesWords += inWords(lakhs) + ' Lakh ';
    if (thousands) rupeesWords += inWords(thousands) + ' Thousand ';
    if (hundreds) rupeesWords += inWords(hundreds) + ' Hundred ';
    if (rest) rupeesWords += inWords(rest);
  }

  let paiseWords = '';
  if (paise > 0) {
    paiseWords = ' and ' + inWords(paise) + ' Paise';
  }

  return rupeesWords.trim() + ' Rupees' + paiseWords + ' Only';
};


function ReceiptPage() {
  const supabase = getSupabaseClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('id')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [payment, setPayment] = useState<PaymentDetails | null>(null)
  const [student, setStudent] = useState<StudentDetails | null>(null)
  const [balanceAmount, setBalanceAmount] = useState(0)

  useEffect(() => {
    if (!paymentId) {
      setError("No payment ID provided.")
      setLoading(false)
      return
    }

    const fetchReceiptData = async () => {
      setLoading(true)
      setError(null)

      try {
        // 1. Fetch the specific payment
        const { data: paymentData, error: paymentError } = await supabase
          .from("student_payments")
          .select("*") // Select all fields, will now include 'receipt_no'
          .eq("id", paymentId)
          .limit(1)
          .maybeSingle()

        if (paymentError) throw new Error(`Payment Fetch Error: ${paymentError.message}`)
        if (!paymentData) throw new Error("Payment not found.")
        
        const typedPaymentData = paymentData as PaymentDetails;
        setPayment(typedPaymentData);

        const { student_id, academic_year } = typedPaymentData;

        // 2. Fetch Student Details and Total Paid Status in parallel
        const [studentResult, allPaymentsResult] = await Promise.all([
          // Fetch student info
          supabase
            .from("students")
            .select(`
              id,
              fullname,
              original_admission_fee,
              student_semesters (
                roll_number,
                course:courses ( name )
              )
            `)
            .eq('id', student_id)
            .eq('student_semesters.academic_year', academic_year)
            .limit(1, { foreignTable: 'student_semesters' })
            .maybeSingle(),

          // Fetch all payments for this student/year to calculate balance
          supabase
            .from("student_payments")
            .select("amount, fees_type")
            .eq("student_id", student_id)
            .eq("academic_year", academic_year)
        ]);

        // 3. Process Student Data
        if (studentResult.error) throw new Error(`Student Fetch Error: ${studentResult.error.message}`)
        if (studentResult.data) {
          const data = studentResult.data as any;
          const enrollment = data.student_semesters[0];
          setStudent({
            id: data.id,
            fullname: data.fullname,
            original_admission_fee: data.original_admission_fee || 0,
            academic_year: academic_year,
            roll_number: enrollment?.roll_number || 'N/A',
            course_name: enrollment?.course?.name || 'N/A',
          })
        } else {
          throw new Error("Student enrollment not found for this academic year.")
        }

        // 4. Process Balance Amount
        if (allPaymentsResult.error) throw new Error(`Payment History Error: ${allPaymentsResult.error.message}`)
        
        let totalTuitionPaid = 0;
        if (allPaymentsResult.data) {
          for (const p of allPaymentsResult.data) {
            if (p.fees_type === 'Tuition Fee') {
              totalTuitionPaid += p.amount;
            }
          }
        }
        
        // Calculate balance based on Net Payable and total tuition paid
        const netPayable = studentResult.data?.original_admission_fee || 0;
        setBalanceAmount(netPayable - totalTuitionPaid);

      } catch (err: any) {
        console.error("Error fetching receipt data:", err)
        setError(err.message || "Failed to load receipt data.")
      } finally {
        setLoading(false)
      }
    }

    fetchReceiptData()
  }, [paymentId, supabase])
  
  // --- MOVED HOOKS TO TOP LEVEL ---

  // --- Generate QR Code URL ---
  const qrCodeUrl = useMemo(() => {
      // Add null check for initial render
      if (!payment) return null;
      
      const receiptUrl = `${window.location.origin}/student/fees/receipt?id=${payment.id}`;
      
      return `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(receiptUrl)}`;
  }, [payment]); // Only depends on payment
  
  // --- END OF MOVED HOOKS ---

  const handlePrint = () => {
    window.print()
  }

  // --- UPDATED: More compact styling for A4 ---
  const renderContent = (payment: PaymentDetails, student: StudentDetails) => {
    return (
      <div id="receipt-content" className="max-w-3xl mx-auto bg-white text-gray-800 p-8 md:p-10 rounded-lg shadow-xl print:border-none print:shadow-none print:p-0">
        
        {/* Header */}
        <div className="text-center pb-4 mb-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-indigo-700">ANJUMAN-I-ISLAM'S</h1>
          <h2 className="text-lg font-semibold text-gray-700">AIKTC SCHOOL OF ENGINEERING & TECHNOLOGY</h2>
          <p className="text-xs text-gray-500 mt-1">Plot No. 2&3, Sec-16, New Panvel, Khandagaon, New</p>
          <p className="text-xs text-gray-500">Phone No: 022-27481247/9 Email: aiktc.newpanvel@aiktc.ac.in</p>
        </div>

        {/* Title */}
        <h3 className="text-center text-xl font-semibold text-gray-800 mb-4">FEE RECEIPT</h3>

        {/* Student Info */}
        <div className="bg-indigo-50 p-4 rounded-lg mb-4 text-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <span className="text-gray-500 text-xs">Student Name:</span>
              <strong className="block text-gray-800">{student.fullname}</strong>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Date:</span>
              <strong className="block text-gray-800">{new Date(payment.created_at).toLocaleDateString('en-GB')}</strong>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Receipt No.:</span>
              <strong className="block text-gray-800">{payment.receipt_no}</strong>
            </div>
            <div>
              <span className="text-gray-500 text-xs">AUID / Roll No.:</span>
              <strong className="block text-gray-800">{student.roll_number}</strong>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Branch / Course:</span>
              <strong className="block text-gray-800">{student.course_name}</strong>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Year:</span>
              <strong className="block text-gray-800">{student.academic_year}</strong>
            </div>
          </div>
        </div>

        {/* Payment Details Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
              <tr>
                <th className="text-left p-3">Description</th>
                <th className="text-right p-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="p-3 font-medium">{payment.fees_type}</td>
                <td className="text-right p-3 font-bold text-base">
                  {payment.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left side */}
          <div className="space-y-3">
            <div>
              <span className="text-xs text-gray-500 font-semibold uppercase">Amount in Words</span>
              <p className="font-medium text-gray-800 text-sm">{toWords(payment.amount)}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-semibold uppercase">Balance Amount</span>
              <p className="font-medium text-gray-800 text-sm">{balanceAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p>
            </div>
          </div>
          
          {/* Right side */}
          <div className="flex flex-col justify-end">
            <div className="bg-gray-100 p-4 rounded-lg flex justify-between items-center">
              <span className="text-base font-bold text-gray-800">TOTAL</span>
              <span className="text-lg font-bold text-indigo-700">
                {payment.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-500 text-right">
              Name Of User: Admin
            </div>
          </div>
        </div>

        {/* Payment Method Details */}
        <div className="mt-6 pt-4 border-t border-gray-200 text-sm space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <span className="text-gray-500 text-xs">Trust Name:</span>
              <strong className="block text-gray-800">Anjuman-I-Islam</strong>
            </div>
             <div>
              <span className="text-gray-500 text-xs">Mode of Payment:</span>
              <strong className="block text-gray-800">{payment.payment_method}</strong>
            </div>
            {payment.payment_method === 'Trust' && (
              <>
                {payment.trust_name && 
                  <div>
                    <span className="text-gray-500 text-xs">Payer Trust Name:</span>
                    <strong className="block text-gray-800">{payment.trust_name}</strong>
                  </div>
                }
                {payment.trust_id && 
                  <div>
                    <span className="text-gray-500 text-xs">Payer Trust ID:</span>
                    <strong className="block text-gray-800">{payment.trust_id}</strong>
                  </div>
                }
              </>
            )}
            <div>
              <span className="text-gray-500 text-xs">Bank Name:</span>
              <strong className="block text-gray-800">{payment.bank_name || (payment.payment_method === 'Razorpay' ? 'RazorpayX' : 'N/A')}</strong>
            </div>
            <div>
              <span className="text-gray-500 text-xs">Settlement No:</span>
              <strong className="block text-gray-800">{payment.transaction_id || payment.cheque_number || 'N/A'}</strong>
            </div>
          </div>
        </div>

        {/* Footer with QR Code */}
        <div className="flex justify-between items-end mt-8 pt-4 border-t border-gray-200 text-sm">
          <div className="text-left">
            <span className="text-xs text-gray-500 block">DD/Cheque subject to be realisation.</span>
            {qrCodeUrl && (
              <img 
                src={qrCodeUrl}
                alt="Receipt QR Code" 
                className="mt-2"
              />
            )}
          </div>
          <div className="self-end text-center">
             <div className="w-28 border-t-2 border-gray-300 pt-1">
                <span className="font-bold text-gray-700 text-xs">Signature</span>
             </div>
          </div>
        </div>

      </div>
    )
  }

  return (
    <>
      {/* --- PRINT STYLES --- */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            border: none;
            box-shadow: none;
          }
          .print-hidden {
            display: none;
          }
        }
      `}</style>
    
      <div className="p-4 md:p-8 bg-gray-100 min-h-screen print:bg-white">
        <div className="max-w-3xl mx-auto mb-4 flex justify-between print-hidden">
          <Button variant="outline" asChild>
            <Link href="/student/fees">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Fees
            </Link>
          </Button>
          <Button onClick={handlePrint} disabled={!payment || !student}>
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
        </div>
        
        {loading && (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!loading && !error && payment && student && (
          renderContent(payment, student)
        )}
      </div>
    </>
  )
}

// Wrap the component in Suspense to safely use useSearchParams
export default function ReceiptPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>}>
      <ReceiptPage />
    </Suspense>
  )
}