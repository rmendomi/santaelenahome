import { useState, useEffect } from 'react'
import { Plus, Power, LogOut } from 'lucide-react'
import {
  getCategories, toggleCategory, createCategory,
  getPaymentMethods, togglePaymentMethod, createPaymentMethod,
  getResponsibles, toggleResponsible, createResponsible,
  getDefaults, saveDefaults,
} from '@/services/catalogService'
import { useAuth } from '@/contexts/AuthContext'
import { useToastContext } from '@/contexts/ToastContext'
import { LoadingState } from '@/components/LoadingState'
import type { Category, PaymentMethod, Responsible } from '@/types/database'

type Tab = 'categories' | 'payments' | 'responsibles' | 'defaults'

export function SettingsPage() {
  const { signOut } = useAuth()
  const { showSuccess, showError } = useToastContext()
  const [tab, setTab] = useState<Tab>('categories')
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [payments, setPayments] = useState<PaymentMethod[]>([])
  const [responsibles, setResponsibles] = useState<Responsible[]>([])
  const [defaultResp, setDefaultResp] = useState('')
  const [defaultPM, setDefaultPM] = useState('')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  async function loadAll() {
    setLoading(true)
    const [cats, pms, resps, defs] = await Promise.all([
      getCategories(), getPaymentMethods(), getResponsibles(), getDefaults()
    ])
    setCategories(cats)
    setPayments(pms)
    setResponsibles(resps)
    setDefaultResp(defs.responsible_name ?? '')
    setDefaultPM(defs.payment_method_name ?? '')
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [])

  async function handleToggleCategory(id: string, active: boolean) {
    await toggleCategory(id, !active)
    setCategories(prev => prev.map(c => c.id === id ? { ...c, active: !active } : c))
  }

  async function handleTogglePayment(id: string, active: boolean) {
    await togglePaymentMethod(id, !active)
    setPayments(prev => prev.map(p => p.id === id ? { ...p, active: !active } : p))
  }

  async function handleToggleResponsible(id: string, active: boolean) {
    await toggleResponsible(id, !active)
    setResponsibles(prev => prev.map(r => r.id === id ? { ...r, active: !active } : r))
  }

  async function handleAddCategory() {
    if (!newName.trim()) return
    try {
      setAdding(true)
      await createCategory({ name: newName.trim(), color: '#9B9B9B', icon: '📦' })
      setNewName('')
      await loadAll()
      showSuccess('Categoría creada')
    } catch { showError('Error al crear categoría') }
    finally { setAdding(false) }
  }

  async function handleAddPayment() {
    if (!newName.trim()) return
    try {
      setAdding(true)
      await createPaymentMethod({ name: newName.trim(), icon: '💳' })
      setNewName('')
      await loadAll()
      showSuccess('Medio de pago creado')
    } catch { showError('Error al crear medio de pago') }
    finally { setAdding(false) }
  }

  async function handleAddResponsible() {
    if (!newName.trim()) return
    try {
      setAdding(true)
      await createResponsible(newName.trim())
      setNewName('')
      await loadAll()
      showSuccess('Responsable creado')
    } catch { showError('Error al crear responsable') }
    finally { setAdding(false) }
  }

  async function handleSaveDefaults() {
    try {
      await saveDefaults({ responsible_name: defaultResp, payment_method_name: defaultPM })
      showSuccess('Preferencias guardadas')
    } catch { showError('Error al guardar preferencias') }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'categories', label: 'Categorías' },
    { key: 'payments', label: 'Pagos' },
    { key: 'responsibles', label: 'Responsables' },
    { key: 'defaults', label: 'Preferencias' },
  ]

  return (
    <div className="min-h-full">
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-0 sticky top-0 z-10">
        <div className="flex items-center justify-between py-3">
          <h1 className="text-xl font-bold text-gray-900">Ajustes</h1>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-gray-500 text-sm px-3 py-1.5 rounded-lg border border-gray-200"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
        <div className="flex gap-1 pb-0 overflow-x-auto scrollbar-hide">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setNewName('') }}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === key ? 'border-primary text-primary' : 'border-transparent text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="px-4 py-4">
          {tab === 'categories' && (
            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between bg-white rounded-xl p-3.5 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon}</span>
                    <span className={`font-medium text-sm ${cat.active ? 'text-gray-900' : 'text-gray-400'}`}>{cat.name}</span>
                  </div>
                  <button onClick={() => handleToggleCategory(cat.id, cat.active)} className={`p-2 rounded-xl ${cat.active ? 'text-primary bg-primary-50' : 'text-gray-300 bg-gray-100'}`}>
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nueva categoría..."
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary focus:outline-none bg-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <button onClick={handleAddCategory} disabled={adding || !newName.trim()} className="p-2.5 bg-primary text-white rounded-xl disabled:opacity-50">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {tab === 'payments' && (
            <div className="space-y-3">
              {payments.map((pm) => (
                <div key={pm.id} className="flex items-center justify-between bg-white rounded-xl p-3.5 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{pm.icon}</span>
                    <span className={`font-medium text-sm ${pm.active ? 'text-gray-900' : 'text-gray-400'}`}>{pm.name}</span>
                  </div>
                  <button onClick={() => handleTogglePayment(pm.id, pm.active)} className={`p-2 rounded-xl ${pm.active ? 'text-primary bg-primary-50' : 'text-gray-300 bg-gray-100'}`}>
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nuevo medio de pago..."
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary focus:outline-none bg-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddPayment()}
                />
                <button onClick={handleAddPayment} disabled={adding || !newName.trim()} className="p-2.5 bg-primary text-white rounded-xl disabled:opacity-50">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {tab === 'responsibles' && (
            <div className="space-y-3">
              {responsibles.map((r) => (
                <div key={r.id} className="flex items-center justify-between bg-white rounded-xl p-3.5 border border-gray-100">
                  <span className={`font-medium text-sm ${r.active ? 'text-gray-900' : 'text-gray-400'}`}>{r.name}</span>
                  <button onClick={() => handleToggleResponsible(r.id, r.active)} className={`p-2 rounded-xl ${r.active ? 'text-primary bg-primary-50' : 'text-gray-300 bg-gray-100'}`}>
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nuevo responsable..."
                  className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary focus:outline-none bg-white"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddResponsible()}
                />
                <button onClick={handleAddResponsible} disabled={adding || !newName.trim()} className="p-2.5 bg-primary text-white rounded-xl disabled:opacity-50">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {tab === 'defaults' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Estos valores se pre-seleccionan al abrir el formulario de nuevo gasto.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsable por defecto</label>
                <select
                  value={defaultResp}
                  onChange={(e) => setDefaultResp(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base bg-white focus:border-primary focus:outline-none"
                >
                  <option value="">Último usado</option>
                  {responsibles.filter(r => r.active).map(r => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medio de pago por defecto</label>
                <select
                  value={defaultPM}
                  onChange={(e) => setDefaultPM(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base bg-white focus:border-primary focus:outline-none"
                >
                  <option value="">Último usado</option>
                  {payments.filter(p => p.active).map(p => (
                    <option key={p.id} value={p.name}>{p.icon} {p.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleSaveDefaults}
                className="w-full py-4 rounded-xl bg-primary text-white font-semibold text-base active:scale-95 transition-transform"
              >
                Guardar preferencias
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
