import React, { useState } from 'react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Calendar, Filter, Eye } from 'lucide-react'

const MOCK_ORDERS = [
  { id: 'HT-1025', date: '2026-06-12', items: 'Homestyle Chicken Biryani (Qty: 1), Daily Plan', total: 280, status: 'Delivered', method: 'Cash on Delivery', addons: 'Raita' },
  { id: 'HT-1024', date: '2026-06-11', items: 'Steamed Daal Chawal (Qty: 1), Extra Roti', total: 240, status: 'Delivered', method: 'Prepaid Wallet', addons: 'Extra Roti' },
  { id: 'HT-1023', date: '2026-06-10', items: 'Nihari Special (Qty: 1), Daily Plan', total: 380, status: 'Delivered', method: 'Card Payment', addons: 'Dessert' },
  { id: 'HT-1026', date: '2026-06-14', items: 'Chicken Biryani (Qty: 1), Mutton Karahi (Qty: 1)', total: 730, status: 'Preparing', method: 'Cash on Delivery', addons: 'Extra Roti, Dessert' }
]

export default function Orders() {
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('All')

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
  }

  const getBadgeVariant = (status) => {
    switch (status) {
      case 'Delivered': return 'success'
      case 'Preparing': return 'warning'
      case 'On the Way': return 'accent'
      default: return 'primary'
    }
  }

  const filteredOrders = statusFilter === 'All' 
    ? MOCK_ORDERS 
    : MOCK_ORDERS.filter(o => o.status === statusFilter)

  return (
    <div className="flex flex-col gap-8 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">My Orders</h1>
          <p className="text-sm text-gray-500">Track and view history of all your tiffin requests.</p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-emerald-100 shadow-subtle w-fit shrink-0">
          <Filter className="w-4 h-4 text-primary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold text-text-dark bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Delivered">Delivered</option>
            <option value="Preparing">Preparing</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex flex-col gap-4">
        {filteredOrders.map((order) => (
          <Card 
            key={order.id} 
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:translate-y-0"
            hoverable={false}
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-text-dark">{order.id}</span>
                <Badge variant={getBadgeVariant(order.status)}>{order.status}</Badge>
              </div>
              <p className="text-xs text-gray-500 font-semibold">{order.items}</p>
              <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>{order.date}</span>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-emerald-50 pt-4 sm:pt-0">
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Total Amount</span>
                <span className="text-sm font-bold text-primary">PKR {order.total}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)} className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                Details
              </Button>
            </div>
          </Card>
        ))}
        {filteredOrders.length === 0 && (
          <p className="text-gray-400 py-12 text-center text-sm font-medium">No order logs found for status: {statusFilter}.</p>
        )}
      </div>

      {/* OrderDetailModal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Order Details: ${selectedOrder?.id}`}
      >
        {selectedOrder && (
          <div className="flex flex-col gap-6 text-left text-sm">
            <div className="flex justify-between items-center border-b border-emerald-50 pb-3">
              <div>
                <p className="text-xs text-gray-400 font-semibold">Order Date</p>
                <p className="font-bold text-text-dark mt-0.5">{selectedOrder.date}</p>
              </div>
              <Badge variant={getBadgeVariant(selectedOrder.status)}>{selectedOrder.status}</Badge>
            </div>

            <div>
              <p className="text-xs text-gray-400 font-semibold mb-2">Items Breakdown</p>
              <div className="bg-background rounded-2xl border border-emerald-50 p-4 flex flex-col gap-2.5">
                <div className="flex justify-between font-semibold text-text-dark">
                  <span>{selectedOrder.items.split(',')[0]}</span>
                  <span>PKR {selectedOrder.total}</span>
                </div>
                {selectedOrder.addons && (
                  <p className="text-xs text-emerald-800 font-semibold border-t border-emerald-50/50 pt-2">
                    + Addons: {selectedOrder.addons}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 font-semibold">Payment Method</p>
                <p className="font-semibold text-text-dark mt-0.5">{selectedOrder.method}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold">Total Invoice</p>
                <p className="font-bold text-primary mt-0.5">PKR {selectedOrder.total}</p>
              </div>
            </div>

            {/* Simulated timeline */}
            <div>
              <p className="text-xs text-gray-400 font-semibold mb-3">Order Status Timeline</p>
              <div className="flex flex-col gap-4 border-l-2 border-emerald-100 pl-4 ml-2">
                {[
                  { label: 'Order Confirmed', time: '11:00 AM', done: true },
                  { label: 'Kitchen Preparing', time: '11:45 AM', done: selectedOrder.status !== 'Pending' },
                  { label: 'Out for Delivery', time: '12:30 PM', done: selectedOrder.status === 'Delivered' || selectedOrder.status === 'On the Way' },
                  { label: 'Delivered', time: '1:10 PM', done: selectedOrder.status === 'Delivered' }
                ].map((step, index) => (
                  <div key={index} className="relative">
                    <span className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 bg-white ${
                      step.done ? 'border-primary bg-primary' : 'border-gray-200'
                    }`} />
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${step.done ? 'text-text-dark' : 'text-gray-400'}`}>
                        {step.label}
                      </span>
                      {step.done && <span className="text-gray-400 font-semibold">{step.time}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
