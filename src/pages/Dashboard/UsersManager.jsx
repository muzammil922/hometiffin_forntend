import React, { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Pagination from '../../components/ui/Pagination'
import { useToastStore } from '../../store/toastStore'
import { formatDate, formatDateTime } from '../../services/dateFormatter'
import { Users, Search, Filter, RefreshCw, Calendar, Mail, Phone, UserCheck, X, Download } from 'lucide-react'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'


const DEFAULT_LIMIT = 20

const MANAGEMENT_PAGES = [
  'Overview',
  'Payments Verification',
  'Manage Orders',
  'Manage Subscriptions',
  'Manage Users',
  'Manage Meals',
  'Message Templates',
  'Evolution WhatsApp'
]

export default function UsersManager() {
  const { addToast } = useToastStore()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)

  // Summary stats (from full count – fetched once)
  const [stats, setStats] = useState({ total: 0, customers: 0, riders: 0, admins: 0 })

  // Status & Edit modals
  const [statusUpdating, setStatusUpdating] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null)
  const [editRole, setEditRole] = useState('')
  const [editAllowedPages, setEditAllowedPages] = useState([])

  const fetchUsers = useCallback(async (pg = 1, search = '', role = '', lim = limit) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: pg, limit: lim })
      if (search) params.set('search', search)
      if (role)   params.set('role', role)
      const res = await api.get(`/admin/users?${params}`)
      setUsers(res.data.data)
      setTotal(res.data.total)
      setTotalPages(res.data.totalPages)
      setPage(res.data.page)
    } catch (err) {
      console.error('Failed to load users:', err)
      addToast('Failed to load user directory.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  const fetchStats = useCallback(async () => {
    try {
      const [all, cust, rider, admin] = await Promise.all([
        api.get('/admin/users?limit=1'),
        api.get('/admin/users?role=customer&limit=1'),
        api.get('/admin/users?role=rider&limit=1'),
        api.get('/admin/users?role=admin&limit=1'),
      ])
      setStats({
        total:     all.data.total,
        customers: cust.data.total,
        riders:    rider.data.total,
        admins:    admin.data.total,
      })
    } catch {}
  }, [])

  useEffect(() => {
    fetchUsers(1, '', '')
    fetchStats()
  }, [])

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':  return <Badge variant="success">Admin</Badge>
      case 'rider':  return <Badge variant="accent">Rider</Badge>
      case 'management': return <Badge variant="warning">Management</Badge>
      default:       return <Badge variant="primary">Customer</Badge>
    }
  }

  const handleToggleUserStatus = async (userObj) => {
    try {
      setStatusUpdating(userObj.id)
      const newStatus = !userObj.isActive
      await api.put(`/admin/users/${userObj.id}/status`, { isActive: newStatus })
      
      setUsers(prev => prev.map(u => u.id === userObj.id ? { ...u, isActive: newStatus } : u))
      addToast(`Account for ${userObj.name} has been ${newStatus ? 'activated' : 'suspended'}.`, 'success')
    } catch (err) {
      console.error('Failed to toggle user status:', err)
      addToast(err.response?.data?.error || 'Failed to update account status.', 'error')
    } finally {
      setStatusUpdating(null)
    }
  }

  const handleOpenEditModal = (userObj) => {
    setSelectedUserForEdit(userObj)
    setEditRole(userObj.role)
    setEditAllowedPages(userObj.allowedPages || [])
    setIsEditModalOpen(true)
  }

  const handleSaveRole = async () => {
    if (!selectedUserForEdit) return
    try {
      setLoading(true)
      await api.put(`/admin/users/${selectedUserForEdit.id}/role`, {
        role: editRole,
        allowedPages: editRole === 'management' ? editAllowedPages : []
      })
      
      setUsers(prev => prev.map(u => u.id === selectedUserForEdit.id ? { ...u, role: editRole, allowedPages: editRole === 'management' ? editAllowedPages : [] } : u))
      addToast(`Role for ${selectedUserForEdit.name} updated to ${editRole}.`, 'success')
      setIsEditModalOpen(false)
      setSelectedUserForEdit(null)
    } catch (err) {
      console.error('Failed to save role:', err)
      addToast(err.response?.data?.error || 'Failed to update role.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = () => {
    if (users.length === 0) {
      addToast('No users to export.', 'warning')
      return
    }

    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(18)
    doc.setTextColor(2, 48, 32) // Dark green brand color
    doc.text("Home Tiffin - User Directory", 14, 20)
    
    // Add subtitle
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated on: ${formatDateTime(new Date())}`, 14, 26)
    doc.text(`Total Users: ${users.length}`, 14, 32)
    
    const headers = [['User ID', 'Name', 'Email', 'Phone', 'Role', 'Status', 'Registered']]
    const body = users.map(user => [
      user.id.substring(0, 8) + '...',
      user.name,
      user.email,
      user.phone || 'N/A',
      user.role.toUpperCase(),
      user.isActive !== false ? 'ACTIVE' : 'SUSPENDED',
      formatDate(user.createdAt)
    ])

    autoTable(doc, {
      head: headers,
      body: body,
      startY: 38,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 30 },
        2: { cellWidth: 45 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 22 },
        6: { cellWidth: 20 }
      }
    })

    doc.save(`Users_Directory_${new Date().toISOString().slice(0, 10)}.pdf`)
    addToast('User directory exported as PDF successfully!', 'success')
  }

  const applySearch = () => {
    setSearchQuery(searchInput)
    fetchUsers(1, searchInput, roleFilter)
    setPage(1)
  }

  const handleRoleChange = (val) => {
    setRoleFilter(val)
    fetchUsers(1, searchQuery, val)
    setPage(1)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchQuery('')
    fetchUsers(1, '', roleFilter)
    setPage(1)
  }

  const handlePageChange = (pg) => {
    setPage(pg)
    fetchUsers(pg, searchQuery, roleFilter)
  }

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit)
    fetchUsers(1, searchQuery, roleFilter, newLimit)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-8 text-left w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">User Directories</h1>
          <p className="text-sm text-gray-500">View and audit all registered accounts across customers, riders, and admins.</p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 bg-white rounded-2xl border border-emerald-100 hover:bg-emerald-50 text-primary transition-all shadow-subtle cursor-pointer flex items-center gap-2 text-xs font-bold"
          >
            <Download className="w-4 h-4 text-primary" />
            Export PDF
          </button>
          <button
            onClick={() => { fetchUsers(page, searchQuery, roleFilter); fetchStats() }}
            className="p-2.5 bg-white rounded-2xl border border-emerald-100 hover:bg-emerald-50 text-primary transition-all shadow-subtle cursor-pointer flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users',  value: stats.total,     icon: <Users className="w-6 h-6" />,     bg: 'bg-primary/10 text-primary' },
          { label: 'Customers',    value: stats.customers,  icon: <UserCheck className="w-6 h-6" />, bg: 'bg-sky-50 text-sky-600' },
          { label: 'Riders',       value: stats.riders,     icon: <Users className="w-6 h-6" />,     bg: 'bg-amber-50 text-amber-600' },
          { label: 'Admins',       value: stats.admins,     icon: <UserCheck className="w-6 h-6" />, bg: 'bg-emerald-50 text-emerald-600' },
        ].map(s => (
          <Card key={s.label} className="flex items-center gap-4 hover:translate-y-0" hoverable={false}>
            <div className={`p-3.5 rounded-2xl ${s.bg}`}>{s.icon}</div>
            <div>
              <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">{s.label}</p>
              <p className="text-lg font-black text-text-dark">{loading ? '…' : s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        <div className="flex-1 flex items-center gap-2.5 bg-white px-4 py-3 rounded-2xl border border-emerald-100 shadow-subtle">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by name, email, or contact number…"
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
          className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-subtle cursor-pointer shrink-0"
        >
          Search
        </button>
        <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-emerald-100 shadow-subtle shrink-0">
          <Filter className="w-4 h-4 text-primary" />
          <select
            value={roleFilter}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="text-xs font-semibold text-text-dark bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="customer">Customers</option>
            <option value="rider">Riders</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Users List */}
      <Card className="p-8 hover:translate-y-0" hoverable={false}>
        <h3 className="font-bold text-text-dark text-base border-b border-emerald-50 pb-3 mb-6">User Accounts Directory</h3>

        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-emerald-50 rounded-2xl bg-white">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-40 bg-gray-200 rounded-lg"></div>
                  <div className="h-3 w-48 bg-gray-100 rounded-lg"></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-4 w-16 bg-gray-200 rounded-lg"></div>
                  <div className="h-4 w-24 bg-gray-100 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {users.map((userObj) => (
              <Card
                key={userObj.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border border-emerald-50 bg-white hover:translate-y-0"
                hoverable={false}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base shrink-0">
                    {userObj.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-text-dark">{userObj.name}</span>
                      {getRoleBadge(userObj.role)}
                      {userObj.isActive === false ? (
                        <Badge variant="danger">Suspended</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 flex-wrap text-xs text-gray-500 font-semibold mt-1">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-primary" /> {userObj.email}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-primary" /> {userObj.phone || 'No phone'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-emerald-50 pt-4 sm:pt-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Registered Date</span>
                    <span className="text-xs font-semibold text-text-dark flex items-center gap-1.5 justify-start sm:justify-end mt-0.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      {formatDate(userObj.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleUserStatus(userObj)}
                      disabled={statusUpdating === userObj.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        userObj.isActive === false
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-600'
                      }`}
                    >
                      {statusUpdating === userObj.id ? 'Updating...' : (userObj.isActive === false ? 'Activate' : 'Suspend')}
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(userObj)}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Edit Role
                    </button>
                  </div>
                </div>
              </Card>
            ))}
            {users.length === 0 && (
              <p className="text-gray-400 py-12 text-center text-sm font-medium">No user accounts found matching constraints.</p>
            )}

            <Pagination page={page} totalPages={totalPages} total={total} limit={limit} onPageChange={handlePageChange} onLimitChange={handleLimitChange} />
          </div>
        )}
      </Card>

      {/* Edit Role & Permissions Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedUserForEdit(null)
        }}
        title={`Edit Role & Permissions - ${selectedUserForEdit?.name}`}
      >
        <div className="flex flex-col gap-5 text-left py-2">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Account Role</label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value)}
              className="w-full text-xs font-semibold text-text-dark bg-white px-4 py-3 rounded-2xl border border-emerald-100 shadow-subtle focus:outline-none cursor-pointer"
            >
              <option value="customer">Customer</option>
              <option value="rider">Rider</option>
              <option value="management">Management</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {editRole === 'management' && (
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Allowed Pages / Permissions</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                {MANAGEMENT_PAGES.map((pageName) => {
                  const isChecked = editAllowedPages.includes(pageName);
                  return (
                    <label key={pageName} className="flex items-center gap-2.5 text-xs text-text-dark font-semibold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditAllowedPages(prev => [...prev, pageName])
                          } else {
                            setEditAllowedPages(prev => prev.filter(p => p !== pageName))
                          }
                        }}
                        className="rounded border-emerald-300 text-primary focus:ring-primary h-4 w-4"
                      />
                      {pageName}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 mt-4 border-t border-emerald-50 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsEditModalOpen(false)
                setSelectedUserForEdit(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveRole}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
