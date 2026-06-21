import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import { useToastStore } from '../../store/toastStore'
import { Plus, Trash, Pencil, Megaphone, Globe, Image } from 'lucide-react'
import * as Icons from 'lucide-react'

const emptyForm = {
  badge: '',
  title: '',
  desc: '',
  imageUrl: '',
  imageFile: null,
  type: 'menu_info',
  actionText: '',
  actionLink: '',
  actionIcon: 'ArrowRight'
}

const CAMPAIGN_TYPES = [
  { value: 'menu_info', label: 'Menu Info Banner' },
  { value: 'delivery_campaign', label: 'Delivery Promotion' },
  { value: 'sale_campaign', label: 'Sale Banner' },
  { value: 'custom', label: 'Custom Campaign' }
]

const LUCIDE_ICONS = [
  { value: 'ArrowRight', label: 'Arrow Right' },
  { value: 'ShoppingCart', label: 'Shopping Cart' },
  { value: 'Compass', label: 'Compass (Explore)' },
  { value: 'Sparkles', label: 'Sparkles (Offer)' },
  { value: 'Gift', label: 'Gift (Promo)' },
  { value: 'Clock', label: 'Clock (Timing)' },
  { value: 'Salad', label: 'Salad' },
  { value: 'Heart', label: 'Heart' },
  { value: 'Info', label: 'Info' }
]

export default function BannersManager() {
  const { addToast } = useToastStore()
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modals
  const [isOpen, setIsOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  // Form State
  const [form, setForm] = useState(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchBanners = async () => {
    try {
      setLoading(true)
      const res = await api.get('/campaigns')
      setBanners(res.data)
    } catch (err) {
      console.error('Fetch campaigns failed:', err)
      addToast('Failed to load campaigns.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  const handleOpenAdd = () => {
    setForm(emptyForm)
    setIsEditMode(false)
    setEditingId(null)
    setIsOpen(true)
  }

  const handleOpenEdit = (banner) => {
    setForm({
      badge: banner.badge || '',
      title: banner.title || '',
      desc: banner.desc || '',
      imageUrl: banner.image || '',
      imageFile: null,
      type: banner.type || 'custom',
      actionText: banner.actionText || '',
      actionLink: banner.actionLink || '',
      actionIcon: banner.actionIcon || 'ArrowRight'
    })
    setIsEditMode(true)
    setEditingId(banner.id)
    setIsOpen(true)
  }

  const handleFieldChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setForm(prev => ({ ...prev, imageFile: e.target.files[0] }))
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign banner?')) return
    try {
      await api.delete(`/admin/campaigns/${id}`)
      addToast('Campaign deleted successfully.', 'success')
      fetchBanners()
    } catch (err) {
      console.error('Delete banner failed:', err)
      addToast('Failed to delete campaign banner.', 'error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!form.title || !form.desc) {
      addToast('Title and Description are required.', 'error')
      return
    }

    if (!form.imageUrl && !form.imageFile && !isEditMode) {
      addToast('Please upload an image or provide an image URL.', 'error')
      return
    }

    try {
      setIsSubmitting(true)
      
      const formData = new FormData()
      formData.append('type', form.type)
      formData.append('badge', form.badge)
      formData.append('title', form.title)
      formData.append('desc', form.desc)
      formData.append('actionText', form.actionText)
      formData.append('actionLink', form.actionLink)
      formData.append('actionIcon', form.actionIcon)
      
      if (form.imageFile) {
        formData.append('image', form.imageFile)
      } else if (form.imageUrl) {
        formData.append('image', form.imageUrl)
      }

      if (isEditMode) {
        await api.put(`/admin/campaigns/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        addToast('Campaign banner updated successfully.', 'success')
      } else {
        await api.post('/admin/campaigns', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        addToast('Campaign banner added successfully.', 'success')
      }

      setIsOpen(false)
      fetchBanners()
    } catch (err) {
      console.error('Save campaign error:', err)
      addToast(err.response?.data?.error || 'Failed to save campaign banner.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderLucideIcon = (name) => {
    const IconComponent = Icons[name] || Icons.ArrowRight
    return <IconComponent className="w-4 h-4" />
  }

  return (
    <div className="flex flex-col gap-6 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-primary">Manage Campaign Banners</h2>
          <p className="text-xs text-gray-500 font-medium">Add, update, or remove promotional banners shown on the Menu page slider.</p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded-2xl font-bold text-xs py-3 px-5 shadow-sm"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Add New Banner
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-emerald-100/50 p-6 h-64"></div>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center bg-white border border-emerald-50 rounded-3xl">
          <Megaphone className="w-12 h-12 text-primary/30 mb-3" />
          <p className="text-sm font-bold text-text-dark">No campaign banners configured</p>
          <p className="text-xs text-gray-400 max-w-sm mt-1 mb-6">Create promotional or informational banners to draw user attention to your subscription plans or discounts.</p>
          <Button variant="primary" size="sm" onClick={handleOpenAdd} className="rounded-xl font-bold px-5">
            Add Your First Banner
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {banners.map((banner) => (
            <Card key={banner.id} className="bg-white rounded-3xl border border-emerald-100/50 p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                      {banner.type.replace('_', ' ')}
                    </span>
                    {banner.badge && (
                      <span className="bg-accent/20 text-text-dark px-3 py-1 rounded-full text-[10px] font-bold">
                        {banner.badge}
                      </span>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1.5 z-10">
                    <button
                      onClick={() => handleOpenEdit(banner)}
                      className="p-2 rounded-xl bg-gray-50 text-gray-650 hover:bg-emerald-50 hover:text-primary transition-all border border-gray-100 cursor-pointer"
                      title="Edit Banner"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-100 cursor-pointer"
                      title="Delete Banner"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-text-dark leading-snug mb-1">{banner.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium line-clamp-3 mb-4">{banner.desc}</p>
                  </div>
                  
                  <div className="w-24 h-18 rounded-2xl overflow-hidden shadow-sm shrink-0 border border-gray-100">
                    <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-emerald-50 mt-4">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400">
                  <Globe className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[150px]">{banner.actionLink || 'No Link'}</span>
                </div>
                {banner.actionText && (
                  <div className="flex items-center gap-1 bg-accent/25 text-primary px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold">
                    <span>{banner.actionText}</span>
                    {banner.actionIcon && renderLucideIcon(banner.actionIcon)}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Banner Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={isEditMode ? 'Edit Campaign Banner' : 'Create Campaign Banner'}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <Input
            name="title"
            label="Campaign Title"
            placeholder="e.g. Flat 15% Off Subscriptions"
            value={form.title}
            onChange={handleFieldChange}
            required
          />

          <Input
            name="desc"
            type="textarea"
            label="Description / Subtitle text"
            placeholder="e.g. Healthy eating made affordable! Subscribe to any weekly tiffin program this month..."
            value={form.desc}
            onChange={handleFieldChange}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              name="badge"
              label="Badge / Tag Text (optional)"
              placeholder="e.g. Save Big, Lightning Fast"
              value={form.badge}
              onChange={handleFieldChange}
            />

            <Input
              name="type"
              type="select"
              label="Campaign Type"
              value={form.type}
              onChange={handleFieldChange}
              options={CAMPAIGN_TYPES}
            />
          </div>

          <div className="border border-emerald-50 bg-emerald-50/20 p-4 rounded-3xl flex flex-col gap-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Banner Image</p>
            
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="w-full">
                <label className="block text-xs font-semibold text-text-dark mb-1 ml-1">Upload File (Preferred)</label>
                <div className="relative border border-dashed border-primary/20 hover:border-primary/50 bg-white px-4 py-3 rounded-2xl flex items-center gap-2 cursor-pointer transition-all">
                  <Image className="w-5 h-5 text-primary" />
                  <span className="text-xs font-semibold text-gray-500 truncate">
                    {form.imageFile ? form.imageFile.name : 'Choose image file...'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="w-full">
                <Input
                  name="imageUrl"
                  label="OR External URL"
                  placeholder="https://images.unsplash.com/..."
                  value={form.imageUrl}
                  onChange={handleFieldChange}
                  disabled={!!form.imageFile}
                />
              </div>
            </div>
          </div>

          <div className="border border-emerald-50 bg-emerald-50/20 p-4 rounded-3xl flex flex-col gap-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Action CTA Button</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                name="actionText"
                label="Button Text"
                placeholder="e.g. Order Now, Explore"
                value={form.actionText}
                onChange={handleFieldChange}
              />
              
              <Input
                name="actionLink"
                label="Button Link / Anchor"
                placeholder="e.g. #menu-list, /dashboard"
                value={form.actionLink}
                onChange={handleFieldChange}
              />
              
              <Input
                name="actionIcon"
                type="select"
                label="Button Icon"
                value={form.actionIcon}
                onChange={handleFieldChange}
                options={LUCIDE_ICONS}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-3.5 rounded-2xl font-bold mt-4 shadow-md flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
