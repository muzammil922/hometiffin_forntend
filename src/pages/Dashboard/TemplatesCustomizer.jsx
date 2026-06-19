import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useToastStore } from '../../store/toastStore'
import { FileText, Save, Info, Edit3, Tag } from 'lucide-react'

// Per-event available placeholder tags shown to admin
const EVENT_PLACEHOLDERS = {
  order_confirmed: [
    { tag: '{{customerName}}', desc: 'Customer Name' },
    { tag: '{{orderNumber}}', desc: 'Order Number (HT-XXXXX)' },
    { tag: '{{mealNames}}', desc: 'Ordered Meal Names' },
    { tag: '{{billingTotal}}', desc: 'Total Amount (Rs.)' },
    { tag: '{{paymentMethod}}', desc: 'Payment Method' },
  ],
  order_preparing: [
    { tag: '{{customerName}}', desc: 'Customer Name' },
    { tag: '{{orderNumber}}', desc: 'Order Number' },
    { tag: '{{mealNames}}', desc: 'Ordered Meal Names' },
  ],
  order_picked_up: [
    { tag: '{{customerName}}', desc: 'Customer Name' },
    { tag: '{{orderNumber}}', desc: 'Order Number' },
    { tag: '{{mealNames}}', desc: 'Ordered Meal Names' },
    { tag: '{{riderName}}', desc: 'Assigned Rider Name' },
    { tag: '{{riderPhone}}', desc: 'Rider Contact Phone Number' },
  ],
  order_nearby: [
    { tag: '{{customerName}}', desc: 'Customer Name' },
    { tag: '{{orderNumber}}', desc: 'Order Number' },
    { tag: '{{riderName}}', desc: 'Assigned Rider Name' },
    { tag: '{{riderPhone}}', desc: 'Rider Contact Phone Number' },
  ],
  order_delivered: [
    { tag: '{{customerName}}', desc: 'Customer Name' },
    { tag: '{{orderNumber}}', desc: 'Order Number' },
  ],
  payment_received: [
    { tag: '{{customerName}}', desc: 'Customer Name' },
    { tag: '{{orderNumber}}', desc: 'Order Number' },
    { tag: '{{billingTotal}}', desc: 'Total Amount (Rs.)' },
  ],
  subscription_subscribed: [
    { tag: '{{customerName}}', desc: 'Customer Name' },
    { tag: '{{planType}}', desc: 'Plan Type (weekly / monthly)' },
  ],
  subscription_cancelled: [
    { tag: '{{customerName}}', desc: 'Customer Name' },
    { tag: '{{planType}}', desc: 'Plan Type (weekly / monthly)' },
  ],
  subscription_daily_order: [
    { tag: '{{customerName}}', desc: 'Customer Name' },
    { tag: '{{orderNumber}}', desc: 'Order Number' },
    { tag: '{{mealName}}', desc: "Today's Meal Name" },
    { tag: '{{dayOfWeek}}', desc: 'Day of Week (e.g. Monday)' },
    { tag: '{{deliveryTime}}', desc: 'Delivery Time (Lunch / Dinner)' },
    { tag: '{{mealsRemaining}}', desc: 'Remaining Meals in Subscription' },
  ],
}

// Human-readable event labels
const EVENT_LABELS = {
  order_confirmed: '✅ Order Confirmed',
  order_preparing: '🍳 Order Preparing',
  order_picked_up: '🛵 Order Picked Up',
  order_nearby: '📍 Rider Nearby',
  order_delivered: '🎉 Order Delivered',
  payment_received: '💰 Payment Received',
  subscription_subscribed: '🔔 Subscription Activated',
  subscription_cancelled: '❌ Subscription Cancelled',
  subscription_daily_order: '🍱 Subscription Daily Order',
}

export default function TemplatesCustomizer() {
  const { addToast } = useToastStore()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templateText, setTemplateText] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/templates')
      setTemplates(res.data)
      if (res.data.length > 0) {
        setSelectedTemplate(res.data[0])
        setTemplateText(res.data[0].template)
      }
    } catch (err) {
      addToast('Failed to load message templates.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleSelectTemplate = (id) => {
    const temp = templates.find((t) => t.id === id)
    if (temp) {
      setSelectedTemplate(temp)
      setTemplateText(temp.template)
    }
  }

  const handleSave = async () => {
    if (!selectedTemplate) return
    try {
      setIsSaving(true)
      await api.put(`/admin/templates/${selectedTemplate.id}`, { template: templateText })
      addToast(`"${EVENT_LABELS[selectedTemplate.event] || selectedTemplate.event}" template updated!`, 'success')
      setTemplates(templates.map((t) => (t.id === selectedTemplate.id ? { ...t, template: templateText } : t)))
    } catch (err) {
      addToast('Failed to update template.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const insertTag = (tag) => {
    setTemplateText((prev) => prev + tag)
  }

  const currentPlaceholders = selectedTemplate ? (EVENT_PLACEHOLDERS[selectedTemplate.event] || []) : []

  if (loading) {
    return (
      <div className="flex flex-col gap-8 text-left w-full animate-pulse">
        <div>
          <div className="h-8 w-64 bg-gray-200 rounded-2xl mb-2"></div>
          <div className="h-4 w-96 bg-gray-100 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left list skeleton */}
          <div className="flex flex-col gap-2">
            <div className="h-4 w-24 bg-gray-200 rounded-lg mb-1"></div>
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-12 w-full bg-gray-100 rounded-2xl"></div>
            ))}
          </div>
          {/* Right editor skeleton */}
          <div className="lg:col-span-2">
            <div className="p-8 bg-white border border-emerald-100 rounded-3xl flex flex-col gap-5">
              <div className="flex justify-between items-center pb-4 border-b border-emerald-50">
                <div className="h-5 w-48 bg-gray-200 rounded-xl"></div>
                <div className="h-9 w-28 bg-gray-100 rounded-xl"></div>
              </div>
              <div className="h-3 w-40 bg-gray-200 rounded-lg"></div>
              <div className="h-52 w-full bg-gray-100 rounded-2xl"></div>
              <div className="flex gap-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-7 w-24 bg-primary/10 rounded-lg"></div>
                ))}
              </div>
              <div className="h-32 w-full bg-emerald-50/40 border border-emerald-100 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 text-left w-full">
      <div>
        <h1 className="text-3xl font-black text-primary tracking-tight">Notification Templates</h1>
        <p className="text-sm text-gray-500">Edit customer WhatsApp message contents dispatched during order &amp; subscription events.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Template Selection List */}
        <div className="lg:col-span-1 flex flex-col gap-3">
          <h3 className="font-extrabold text-text-dark text-sm uppercase tracking-wider">Select Event</h3>
          <div className="flex flex-col gap-2">
            {templates.map((temp) => {
              const active = selectedTemplate?.id === temp.id
              const label = EVENT_LABELS[temp.event] || temp.event.replace(/_/g, ' ').toUpperCase()
              return (
                <button
                  key={temp.id}
                  onClick={() => handleSelectTemplate(temp.id)}
                  className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                    active
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-white text-gray-700 border-emerald-100 hover:bg-emerald-50/50'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold">{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right Column: Template Editor Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {selectedTemplate ? (
            <Card className="p-6 sm:p-8 border border-emerald-100 bg-white" hoverable={false}>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-emerald-50 mb-6">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Edit3 className="w-5 h-5" />
                  <span className="uppercase tracking-wider text-sm">
                    Editing: {EVENT_LABELS[selectedTemplate.event] || selectedTemplate.event}
                  </span>
                </div>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  isLoading={isSaving}
                  className="rounded-xl px-5 py-2 flex items-center gap-1.5 shadow-sm text-xs font-bold bg-primary text-white cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </Button>
              </div>

              <div className="flex flex-col gap-5 text-xs">
                {/* Textarea */}
                <div>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2">Message Template Text</label>
                  <textarea
                    rows={9}
                    value={templateText}
                    onChange={(e) => setTemplateText(e.target.value)}
                    className="w-full p-4 rounded-2xl border border-emerald-100 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm leading-relaxed font-mono"
                    placeholder="Enter message template text here..."
                  />
                </div>

                {/* Quick Insert Tag Buttons */}
                {currentPlaceholders.length > 0 && (
                  <div>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-2 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> Quick Insert Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {currentPlaceholders.map(({ tag }) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => insertTag(tag)}
                          title={`Insert ${tag} at cursor end`}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[11px] font-mono font-bold hover:bg-primary/20 transition-all cursor-pointer border border-primary/20"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Placeholder Reference */}
                <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 flex gap-3 text-left">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="w-full">
                    <h5 className="font-extrabold text-text-dark text-xs mb-1">Available Tags for This Template</h5>
                    <p className="text-gray-500 leading-relaxed text-[11px] font-medium mb-3">
                      Click any tag above to insert it, or type it manually. Tags are replaced automatically when the WhatsApp message is sent.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
                      {currentPlaceholders.map(({ tag, desc }) => (
                        <div key={tag} className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{tag}</span>
                          <span className="text-[10px] text-gray-500 font-medium">— {desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center text-gray-400" hoverable={false}>
              No template selected. Please choose an event template to edit.
            </Card>
          )}
        </div>

      </div>
    </div>
  )
}
