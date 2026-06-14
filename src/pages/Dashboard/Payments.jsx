import React from 'react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useToastStore } from '../../store/toastStore'
import { Download, CreditCard, DollarSign } from 'lucide-react'

const MOCK_PAYMENTS = [
  { id: 'TXN-9021', date: '2026-06-05', amount: 1600, plan: 'Weekly Tiffin Plan', method: 'Prepaid Wallet', status: 'Completed' },
  { id: 'TXN-8930', date: '2026-05-29', amount: 1600, plan: 'Weekly Tiffin Plan', method: 'Card Payment', status: 'Completed' },
  { id: 'TXN-8812', date: '2026-05-22', amount: 1600, plan: 'Weekly Tiffin Plan', method: 'Card Payment', status: 'Completed' },
  { id: 'TXN-8701', date: '2026-05-15', amount: 1600, plan: 'Weekly Tiffin Plan', method: 'Cash on Delivery', status: 'Completed' }
]

export default function Payments() {
  const { addToast } = useToastStore()

  const handleDownloadInvoice = (txnId) => {
    addToast(`Downloading Invoice Receipt ${txnId}...`, 'info')
    
    // Simulate invoice download by opening a simple window with printed receipt
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${txnId}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .receipt { max-width: 600px; margin: auto; border: 1px solid #eee; padding: 30px; border-radius: 10px; }
            .header { text-align: center; border-bottom: 2px solid #065F46; padding-bottom: 20px; }
            .details { margin: 30px 0; line-height: 1.6; }
            .total { font-size: 20px; font-weight: bold; color: #065F46; margin-top: 20px; text-align: right; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>HOME TIFFIN INVOICE</h2>
              <p>Ghar ka khana, aapke darwaze tak</p>
            </div>
            <div class="details">
              <p><strong>Transaction ID:</strong> ${txnId}</p>
              <p><strong>Date:</strong> 2026-06-14</p>
              <p><strong>Tiffin Program:</strong> Weekly Subscription Plan</p>
              <p><strong>Amount Paid:</strong> PKR 1,600</p>
              <p><strong>Payment Status:</strong> COMPLETED</p>
            </div>
            <div class="total">Total: PKR 1,600</div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="flex flex-col gap-8 text-left">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">Billing & Payments</h1>
        <p className="text-sm text-gray-500">Review all payments, invoices, and spent logs.</p>
      </div>

      {/* Spend Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex items-center gap-4 hover:translate-y-0" hoverable={false}>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold">Total Spent This Month</p>
            <p className="text-2xl font-bold text-text-dark">PKR 4,800</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 hover:translate-y-0" hoverable={false}>
          <div className="p-3.5 bg-sky-50 text-sky-600 rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold">Active Payment Mode</p>
            <p className="text-lg font-bold text-text-dark">Prepaid Wallet Wallet</p>
          </div>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="p-8 hover:translate-y-0" hoverable={false}>
        <h3 className="font-bold text-text-dark text-base border-b border-emerald-50 pb-3 mb-6">Transaction Logs</h3>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-emerald-50 text-gray-400 font-semibold">
                <th className="pb-3 text-xs uppercase tracking-wider">Transaction ID</th>
                <th className="pb-3 text-xs uppercase tracking-wider">Date</th>
                <th className="pb-3 text-xs uppercase tracking-wider">Plan Details</th>
                <th className="pb-3 text-xs uppercase tracking-wider">Amount</th>
                <th className="pb-3 text-xs uppercase tracking-wider">Method</th>
                <th className="pb-3 text-xs uppercase tracking-wider text-right">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PAYMENTS.map((pay) => (
                <tr key={pay.id} className="border-b border-emerald-50/50 last:border-0 font-medium">
                  <td className="py-4 text-text-dark font-bold">{pay.id}</td>
                  <td className="py-4 text-gray-500">{pay.date}</td>
                  <td className="py-4 text-gray-700">{pay.plan}</td>
                  <td className="py-4 text-primary font-bold">PKR {pay.amount}</td>
                  <td className="py-4"><Badge variant="primary">{pay.method}</Badge></td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => handleDownloadInvoice(pay.id)}
                      className="p-1.5 rounded-xl hover:bg-accent-light text-primary transition-all cursor-pointer"
                      aria-label="Download Invoice"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
