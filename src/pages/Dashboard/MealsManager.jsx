import React, { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import { useToastStore } from '../../store/toastStore'
import { Plus, Trash, Pencil, CheckSquare, Square, Star, Search, X, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'


const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const CATEGORIES = ['Lunch', 'Dinner', 'Highlight', 'Daily Special']

const DEFAULT_LIMIT = 20

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: 'Lunch',
  imageUrl: '',
  imageFile: null,
  tagsInput: '',
  weeklyDays: [],
  isAvailable: true,
}

export default function MealsManager() {
  const { addToast } = useToastStore()
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)

  // Form states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const fetchMeals = useCallback(async (pg = 1, search = '', category = '', lim = limit) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: pg, limit: lim })
      if (search)   params.set('search', search)
      if (category) params.set('category', category)
      const res = await api.get(`/admin/meals?${params}`)
      setMeals(res.data.data)
      setTotal(res.data.total)
      setTotalPages(res.data.totalPages)
      setPage(res.data.page)
    } catch (err) {
      addToast('Failed to load menu items.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    fetchMeals()
  }, [])

  const handleToggleDay = (day) => {
    if (form.weeklyDays.includes(day)) {
      setField('weeklyDays', form.weeklyDays.filter((d) => d !== day))
    } else {
      setField('weeklyDays', [...form.weeklyDays, day])
    }
  }

  const buildFormData = () => {
    const tags = form.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('description', form.description)
    fd.append('price', form.price)
    fd.append('category', form.category)
    fd.append('isAvailable', form.isAvailable)
    fd.append('tags', JSON.stringify(tags))
    fd.append('weeklyDays', JSON.stringify(form.weeklyDays))
    if (form.imageFile) {
      fd.append('image', form.imageFile)
    } else if (form.imageUrl) {
      fd.append('imageUrl', form.imageUrl)
    }
    return fd
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.description || !form.price || (!form.imageUrl && !form.imageFile)) {
      addToast('Please fill in all required fields.', 'warning')
      return
    }
    try {
      setIsSubmitting(true)
      await api.post('/admin/meals', buildFormData(), {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      addToast(`${form.name} added to menu successfully!`, 'success')
      setIsAddOpen(false)
      setForm(emptyForm)
      fetchMeals(page, searchQuery, filterCategory)
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to add meal.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditOpen = (meal) => {
    setEditingMeal(meal)
    setForm({
      name: meal.name,
      description: meal.description,
      price: String(meal.price),
      category: meal.category,
      imageUrl: meal.imageUrl,
      imageFile: null,
      tagsInput: meal.tags?.join(', ') || '',
      weeklyDays: meal.weeklyDays || [],
      isAvailable: meal.isAvailable,
    })
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.description || !form.price) {
      addToast('Please fill in all required fields.', 'warning')
      return
    }
    try {
      setIsSubmitting(true)
      await api.put(`/admin/meals/${editingMeal.id}`, buildFormData(), {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      addToast(`${form.name} updated successfully!`, 'success')
      setIsEditOpen(false)
      setEditingMeal(null)
      setForm(emptyForm)
      fetchMeals(page, searchQuery, filterCategory)
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update meal.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id, mealName) => {
    if (!window.confirm(`Are you sure you want to delete "${mealName}" from the menu?`)) return
    try {
      await api.delete(`/admin/meals/${id}`)
      addToast(`"${mealName}" removed from menu.`, 'success')
      fetchMeals(page, searchQuery, filterCategory)
    } catch (err) {
      addToast('Failed to delete meal.', 'error')
    }
  }

  const handleExportPDF = () => {
    if (meals.length === 0) {
      addToast('No meals to export.', 'warning')
      return
    }

    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.setTextColor(2, 48, 32)
    doc.text("Home Tiffin - Menu Catalog", 14, 20)

    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 26)
    doc.text(`Total Meals: ${meals.length}`, 14, 32)

    const headers = [['Meal Name', 'Category', 'Price', 'Weekly Days', 'Stock Status', 'Tags']]
    const body = meals.map(meal => [
      meal.name,
      meal.category,
      `PKR ${meal.price}`,
      Array.isArray(meal.weeklyDays) ? meal.weeklyDays.join(', ') : 'All Days',
      meal.isAvailable ? 'AVAILABLE' : 'OUT OF STOCK',
      Array.isArray(meal.tags) ? meal.tags.join(', ') : 'N/A'
    ])

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 38,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 45 },
        4: { cellWidth: 28 },
        5: { cellWidth: 29 }
      }
    })

    doc.save(`Meals_Menu_${new Date().toISOString().slice(0, 10)}.pdf`)
    addToast('Meals list exported as PDF successfully!', 'success')
  }

  const applySearch = () => {
    setSearchQuery(searchInput)
    fetchMeals(1, searchInput, filterCategory)
    setPage(1)
  }

  const handleCategoryChange = (cat) => {
    setFilterCategory(cat)
    fetchMeals(1, searchQuery, cat === 'All' ? '' : cat)
    setPage(1)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    fetchMeals(1, '', filterCategory === 'All' ? '' : filterCategory)
    setPage(1)
  }

  const MealFormFields = () => (
    <div className="flex flex-col gap-4 text-left">
      <Input label="Meal Name *" placeholder="e.g. Special Chicken Biryani" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
      <Input label="Description *" type="textarea" placeholder="Describe the ingredients..." value={form.description} onChange={(e) => setField('description', e.target.value)} required />
      <Input label="Price (Rs) *" type="number" placeholder="380" value={form.price} onChange={(e) => setField('price', e.target.value)} required />

      <div>
        <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 block">Meal Image {!editingMeal && '*'}</label>
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => { setField('imageFile', e.target.files[0]); setField('imageUrl', '') }}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
          />
          {editingMeal && form.imageUrl && !form.imageFile && (
            <div className="flex items-center gap-2">
              <img src={form.imageUrl} alt="current" className="w-16 h-16 object-cover rounded-xl border border-emerald-100" />
              <span className="text-xs text-gray-400">Current image (upload new to replace)</span>
            </div>
          )}
          {!form.imageFile && (
            <Input placeholder="Or paste Image URL" value={form.imageUrl} onChange={(e) => { setField('imageUrl', e.target.value); setField('imageFile', null) }} />
          )}
        </div>
      </div>

      <Input label="Tags (comma-separated)" placeholder="Spicy, Beef, Rice, Best Seller" value={form.tagsInput} onChange={(e) => setField('tagsInput', e.target.value)} />

      <div>
        <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 block">Menu Category *</label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <button key={cat} type="button" onClick={() => setField('category', cat)}
              className={`py-2 px-4 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold flex items-center justify-center gap-1.5 ${form.category === cat ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
              {cat === 'Highlight' && <Star className="w-3.5 h-3.5" />} {cat}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 block">Availability</label>
        <div className="flex gap-3">
          <button type="button" onClick={() => setField('isAvailable', true)}
            className={`py-2 px-5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${form.isAvailable ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-500 border-gray-200'}`}>
            Available
          </button>
          <button type="button" onClick={() => setField('isAvailable', false)}
            className={`py-2 px-5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${!form.isAvailable ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-500 border-gray-200'}`}>
            Out of Stock
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2 block">Weekly Days Available</label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const selected = form.weeklyDays.includes(day)
            return (
              <button key={day} type="button" onClick={() => handleToggleDay(day)}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${selected ? 'bg-emerald-50 text-primary border-primary font-bold' : 'bg-white text-gray-500 border-gray-200'}`}>
                {selected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                {day}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-8 text-left w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary tracking-tight">Menu Items Manager</h1>
          <p className="text-sm text-gray-500">Add, edit, or delete meals from the Home Tiffin menu catalog.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={handleExportPDF}
            className="px-4 py-3.5 bg-white border border-emerald-100 hover:bg-emerald-50 text-primary text-xs font-bold rounded-2xl transition-all shadow-subtle cursor-pointer flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-primary" />
            Export PDF
          </button>
          <Button variant="primary" onClick={() => { setForm(emptyForm); setIsAddOpen(true) }}
            className="rounded-2xl font-bold px-6 py-3.5 flex items-center gap-2 shadow-subtle bg-primary text-white cursor-pointer">
            <Plus className="w-5 h-5" /> Add New Meal
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2.5 bg-white px-4 py-3 rounded-2xl border border-emerald-100 shadow-subtle">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name or description…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            className="w-full text-xs font-semibold bg-transparent text-text-dark focus:outline-none placeholder-gray-400"
          />
          {searchInput && (
            <button onClick={handleClearSearch} className="text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={applySearch}
          className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-subtle cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['All', ...CATEGORIES].map(cat => (
          <button key={cat} onClick={() => handleCategoryChange(cat)}
            className={`py-1.5 px-4 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-center gap-1 ${(filterCategory === cat || (cat === 'All' && !filterCategory)) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
            {cat === 'Highlight' && <Star className="w-3 h-3" />} {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col p-6 bg-white rounded-3xl border border-emerald-100/50 shadow-md">
              <div className="w-full h-44 bg-gray-100 rounded-2xl mb-4"></div>
              <div className="flex justify-between items-center mb-2">
                <div className="h-5 w-16 bg-gray-100 rounded-xl"></div>
                <div className="h-8 w-8 bg-gray-100 rounded-xl"></div>
              </div>
              <div className="h-4 w-3/4 bg-gray-200 rounded-lg mb-2"></div>
              <div className="h-3 w-1/2 bg-gray-100 rounded-lg mb-1"></div>
              <div className="h-3 w-full bg-gray-100 rounded-lg mb-1"></div>
              <div className="h-3 w-5/6 bg-gray-100 rounded-lg mb-4"></div>
              <div className="flex items-center justify-between pt-4 border-t border-emerald-50">
                <div className="h-6 w-20 bg-gray-200 rounded-lg"></div>
                <div className="h-5 w-16 bg-gray-100 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : meals.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-bold">No meals found.</p>
          <p className="text-sm">Try adjusting your search or add a new meal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {meals.map((meal) => (
            <Card key={meal.id} className="relative flex flex-col justify-between p-6 bg-white rounded-3xl border border-emerald-100/50 shadow-md" hoverable={false}>
              {meal.category === 'Highlight' && (
                <span className="absolute top-3 left-3 bg-amber-400 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider z-10">
                  <Star className="w-2.5 h-2.5" /> Highlight
                </span>
              )}
              <div>
                <img src={meal.imageUrl} alt={meal.name}
                  className="w-full h-44 object-cover rounded-2xl shadow-sm border border-emerald-50 mb-4 bg-gray-50" />

                <div className="flex justify-between items-center mb-2">
                  <span className="bg-accent/30 text-primary px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-wider uppercase">
                    {meal.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditOpen(meal)}
                      className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-100/50 cursor-pointer" title="Edit">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(meal.id, meal.name)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-all border border-rose-100/50 cursor-pointer" title="Delete">
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-text-dark mb-1 leading-snug">{meal.name}</h3>

                {meal.weeklyDays?.length > 0 && (
                  <p className="text-[10px] text-gray-400 font-extrabold mb-2 uppercase tracking-wide">
                    Days: {meal.weeklyDays.join(', ')}
                  </p>
                )}

                <p className="text-xs text-gray-500 leading-relaxed mb-4">{meal.description}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-emerald-50 mt-auto">
                <span className="text-lg font-black text-primary">Rs. {meal.price}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meal.isAvailable ? 'text-emerald-600 bg-emerald-50' : 'text-rose-500 bg-rose-50'}`}>
                  {meal.isAvailable ? 'Available' : 'Out of Stock'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && total > 0 && (
        <Pagination
          page={page} totalPages={totalPages} total={total} limit={limit}
          onPageChange={(pg) => { setPage(pg); fetchMeals(pg, searchQuery, filterCategory === 'All' ? '' : filterCategory) }}
          onLimitChange={(newLimit) => { setLimit(newLimit); fetchMeals(1, searchQuery, filterCategory === 'All' ? '' : filterCategory, newLimit); setPage(1) }}
        />
      )}

      {/* ── Add Meal Modal ── */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Create New Meal Item">
        <form onSubmit={handleAddSubmit} className="flex flex-col gap-4">
          <MealFormFields />
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full py-3.5 mt-2 rounded-2xl font-bold bg-primary text-white">
            Publish Meal
          </Button>
        </form>
      </Modal>

      {/* ── Edit Meal Modal ── */}
      <Modal isOpen={isEditOpen} onClose={() => { setIsEditOpen(false); setEditingMeal(null); setForm(emptyForm) }} title={`Edit: ${editingMeal?.name || ''}`}>
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
          <MealFormFields />
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full py-3.5 mt-2 rounded-2xl font-bold bg-primary text-white">
            Save Changes
          </Button>
        </form>
      </Modal>
    </div>
  )
}
