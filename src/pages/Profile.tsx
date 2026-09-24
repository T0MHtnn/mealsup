import { useEffect, useMemo, useState } from 'react'
import { LogOut, User as UserIcon, Sun, Moon, Monitor, Check, Pencil, X, MessageSquare, SlidersHorizontal, ShieldCheck, HelpCircle, ChevronRight } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUiStore, type Theme } from '@/store/uiStore'
import { authService, userService, feedbackService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import { EQUIPMENT_LIST, type EquipmentKey } from '@/constants/equipment'
import { DIETARY_RESTRICTIONS, type DietaryRestrictionKey } from '@/constants/dietaryRestrictions'
import { FOOD_CATEGORIES, GROCERY_CATALOG } from '@/constants/groceryCatalog'
import { STORES, type StoreKey } from '@/constants/prices'
import { normalizeText } from '@/utils/text'
import LanguageSwitch from '@/components/common/LanguageSwitch'
import EditProfileModal from '@/components/EditProfileModal'
import Modal from '@/components/common/Modal'
import NotificationSettings from '@/components/NotificationSettings'
import AccountDataSection from '@/components/AccountDataSection'

const THEME_OPTIONS: { value: Theme; icon: typeof Sun }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
]

const EXTRA_EXCLUDABLE = ['Arachides', 'Fruits à coque', 'Gluten', 'Soja', 'Crustacés', 'Mollusques', 'Sésame']
const EXCLUDABLE_FOODS = Array.from(new Set([...FOOD_CATEGORIES.flatMap((cat) => GROCERY_CATALOG[cat]), ...EXTRA_EXCLUDABLE]))

export default function ProfilePage() {
  const { t } = useTranslation()
  const session = useAuthStore((state) => state.session)
  const logout = useAuthStore((state) => state.logout)
  const role = useAuthStore((state) => state.role)
  const setAdminMode = useUiStore((state) => state.setAdminMode)
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useUiStore((state) => state.theme)
  const setTheme = useUiStore((state) => state.setTheme)
  const userId = session?.user.id
  const [email, setEmail] = useState(session?.user.email || '')
  const canEditAuth = session?.user.app_metadata?.provider === 'email'

  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [excludedFoods, setExcludedFoods] = useState<string[]>([])
  const [excludeInput, setExcludeInput] = useState('')
  const [dietaryRestrictions, setDietaryRestrictions] = useState<Set<DietaryRestrictionKey>>(new Set())
  const [equipmentAll, setEquipmentAll] = useState(true)
  const [equipment, setEquipment] = useState<Set<EquipmentKey>>(new Set())
  const [preferredStore, setPreferredStore] = useState<StoreKey>('average')
  const [showEquipmentModal, setShowEquipmentModal] = useState(false)
  const [draftEquipmentAll, setDraftEquipmentAll] = useState(true)
  const [draftEquipment, setDraftEquipment] = useState<Set<EquipmentKey>>(new Set())
  const [isSavingEquipment, setIsSavingEquipment] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [feedbackState, setFeedbackState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  useEffect(() => {
    if (!userId) return
    userService
      .getUserPreferences(userId)
      .then((data) => {
        setUsername(data?.username || '')
        setAvatarUrl(data?.avatar_url || null)
        setExcludedFoods(Array.isArray(data?.allergies) ? data.allergies : [])
        setDietaryRestrictions(
          new Set(Array.isArray(data?.dietary_restrictions) ? data.dietary_restrictions : [])
        )
        setEquipmentAll(data?.equipment_all ?? true)
        setEquipment(new Set(Array.isArray(data?.equipment) ? data.equipment : []))
        if (STORES.some((s) => s.key === data?.preferred_store)) setPreferredStore(data.preferred_store)
      })
      .catch((err) => console.error('Profile load error:', err))
  }, [userId])

  const suggestions = useMemo(() => {
    const query = normalizeText(excludeInput.trim())
    if (!query) return []
    const already = new Set(excludedFoods.map(normalizeText))
    return EXCLUDABLE_FOODS.filter(
      (f) => normalizeText(f).includes(query) && !already.has(normalizeText(f))
    ).slice(0, 6)
  }, [excludeInput, excludedFoods])

  const addExcludedFood = (name: string) => {
    setExcludedFoods([...excludedFoods, name])
    setExcludeInput('')
  }

  const removeExcludedFood = (name: string) => {
    setExcludedFoods(excludedFoods.filter((f) => f !== name))
  }

  // Equipment is edited in its own modal, with its own save button
  const openEquipmentModal = () => {
    setDraftEquipmentAll(equipmentAll)
    setDraftEquipment(new Set(equipment))
    setShowEquipmentModal(true)
  }

  const toggleDraftEquipment = (key: EquipmentKey) => {
    const next = new Set(draftEquipment)
    next.has(key) ? next.delete(key) : next.add(key)
    setDraftEquipment(next)
  }

  const saveEquipment = async () => {
    if (!userId) return
    setIsSavingEquipment(true)
    try {
      await userService.updatePreferences(userId, {
        equipment_all: draftEquipmentAll,
        equipment: Array.from(draftEquipment),
      })
      setEquipmentAll(draftEquipmentAll)
      setEquipment(draftEquipment)
      setShowEquipmentModal(false)
    } catch (err) {
      console.error('Save equipment error:', err)
    } finally {
      setIsSavingEquipment(false)
    }
  }

  const toggleRestriction = (key: DietaryRestrictionKey) => {
    const next = new Set(dietaryRestrictions)
    next.has(key) ? next.delete(key) : next.add(key)
    setDietaryRestrictions(next)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setIsSaving(true)
    setSaved(false)
    try {
      await userService.updatePreferences(userId, {
        allergies: excludedFoods,
        dietary_restrictions: Array.from(dietaryRestrictions),
        preferred_store: preferredStore,
      })
      setSaved(true)
    } catch (err) {
      console.error('Save preferences error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Arriving from Help > "Contact us": bring the contact form into view
  useEffect(() => {
    if (location.hash === '#contact') {
      window.setTimeout(() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }), 300)
    }
  }, [location.hash])

  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    const message = feedback.trim()
    if (!userId || !message) return
    setFeedbackState('sending')
    try {
      await feedbackService.send(userId, session?.user.email, message)
      setFeedback('')
      setFeedbackState('sent')
    } catch (err) {
      console.error('Send feedback error:', err)
      setFeedbackState('error')
    }
  }

  const handleLogout = async () => {
    await authService.signOut()
    logout()
  }

  return (
    <div className="p-4 space-y-6">
      <div className="bg-surface-200 border border-border rounded-md p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-tint-sage flex items-center justify-center overflow-hidden shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="text-primary" size={22} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-bold text-ink truncate">{username || email}</p>
          <p className="text-xs text-ink-muted truncate">{email}</p>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          aria-label={t('profile.edit')}
          className="w-9 h-9 shrink-0 rounded-full border border-border flex items-center justify-center text-ink-muted hover:text-ink"
        >
          <Pencil size={16} />
        </button>
      </div>

      {showEditModal && userId && (
        <EditProfileModal
          userId={userId}
          email={email}
          username={username}
          avatarUrl={avatarUrl}
          canEditAuth={canEditAuth}
          onClose={() => setShowEditModal(false)}
          onSaved={(fields) => {
            setUsername(fields.username)
            setAvatarUrl(fields.avatarUrl)
            setEmail(fields.email)
          }}
        />
      )}

      {role === 'admin' && (
        <button
          onClick={() => {
            setAdminMode(true)
            navigate('/admin/users', { replace: true })
          }}
          className="w-full py-2.5 bg-accent text-white rounded-full font-display font-semibold flex items-center justify-center gap-2 hover:opacity-90"
        >
          <ShieldCheck size={18} />
          {t('admin.switchToAdmin')}
        </button>
      )}

      <Link
        to="/help"
        className="bg-surface-200 border border-border rounded-md p-4 flex items-center gap-3 hover:bg-surface-100"
      >
        <HelpCircle size={20} className="text-primary shrink-0" />
        <span className="flex-1">
          <span className="block font-display font-semibold text-ink">{t('help.row')}</span>
          <span className="block text-xs text-ink-muted">{t('help.rowHint')}</span>
        </span>
        <ChevronRight size={18} className="text-ink-muted shrink-0" />
      </Link>

      <div className="bg-surface-200 border border-border rounded-md p-4 flex items-center justify-between">
        <span className="font-display font-semibold text-ink">{t('profile.language')}</span>
        <LanguageSwitch />
      </div>

      <div className="bg-surface-200 border border-border rounded-md p-4">
        <span className="font-display font-semibold text-ink">{t('profile.appearance')}</span>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {THEME_OPTIONS.map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-sm border text-xs font-medium transition-colors ${
                theme === value
                  ? 'bg-primary border-primary text-white'
                  : 'border-border text-ink-muted'
              }`}
            >
              <Icon size={18} />
              {t(`profile.theme.${value}` as const)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface-200 border border-border rounded-md p-4 space-y-3">
        <div>
          <h2 className="font-display font-semibold text-ink">{t('profile.equipment')}</h2>
          <p className="text-xs text-ink-muted mt-1">{t('profile.equipmentHint')}</p>
        </div>

        {equipmentAll ? (
          <p className="text-sm text-ink">{t('profile.equipmentAllSummary')}</p>
        ) : equipment.size === 0 ? (
          <p className="text-sm text-ink">{t('profile.equipmentNone')}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {EQUIPMENT_LIST.filter(({ key }) => equipment.has(key)).map(({ key, icon: Icon }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink bg-tint-sage px-2.5 py-1 rounded-full"
              >
                <Icon size={13} className="text-primary" />
                {t(`equipment.${key}` as const)}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={openEquipmentModal}
          className="w-full py-2.5 border border-primary text-primary rounded-full font-display font-semibold flex items-center justify-center gap-2 hover:bg-tint-sage"
        >
          <SlidersHorizontal size={16} />
          {t('profile.manageEquipment')}
        </button>
      </div>

      <NotificationSettings />

      {showEquipmentModal && (
        <Modal title={t('profile.equipment')} onClose={() => setShowEquipmentModal(false)}>
          <button
            type="button"
            onClick={() => setDraftEquipmentAll(!draftEquipmentAll)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sm border text-sm font-display font-semibold transition-colors ${
              draftEquipmentAll ? 'bg-primary border-primary text-white' : 'border-border text-ink'
            }`}
          >
            <span
              className={`w-4.5 h-4.5 rounded-sm border-2 flex items-center justify-center shrink-0 ${
                draftEquipmentAll ? 'border-white' : 'border-border'
              }`}
            >
              {draftEquipmentAll && <Check size={12} className="text-white" />}
            </span>
            {t('profile.equipmentAll')}
          </button>

          <div className={`grid grid-cols-2 gap-2 mt-3 ${draftEquipmentAll ? 'opacity-40 pointer-events-none' : ''}`}>
            {EQUIPMENT_LIST.map(({ key, icon: Icon }) => {
              const isChecked = draftEquipment.has(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDraftEquipment(key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-sm border text-sm transition-colors ${
                    isChecked ? 'bg-tint-sage border-primary text-ink' : 'border-border text-ink-muted'
                  }`}
                >
                  <Icon size={16} className={isChecked ? 'text-primary' : ''} />
                  {t(`equipment.${key}` as const)}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={saveEquipment}
            disabled={isSavingEquipment}
            className="w-full mt-4 py-2.5 bg-primary text-white rounded-full font-display font-semibold hover:bg-primary-strong disabled:opacity-50"
          >
            {isSavingEquipment ? t('profile.saving') : t('profile.save')}
          </button>
        </Modal>
      )}

      <form
        onSubmit={handleSave}
        className="bg-surface-200 border border-border rounded-md p-4 space-y-5"
      >
        <h2 className="font-display font-semibold text-ink">{t('profile.preferences')}</h2>

        <div>
          <label htmlFor="preferred-store" className="block text-sm font-medium text-ink mb-1">
            {t('profile.store')}
          </label>
          <select
            id="preferred-store"
            value={preferredStore}
            onChange={(e) => setPreferredStore(e.target.value as StoreKey)}
            className="w-full px-3 py-2 border border-border rounded-sm bg-surface-200 text-ink text-sm"
          >
            {STORES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-ink-muted mt-1">{t('prices.storeHint')}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('profile.dietaryRestrictions')}</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {DIETARY_RESTRICTIONS.map(({ key }) => {
              const isChecked = dietaryRestrictions.has(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleRestriction(key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-sm border text-sm transition-colors ${
                    isChecked ? 'bg-tint-sage border-primary text-ink' : 'border-border text-ink-muted'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 ${
                      isChecked ? 'bg-primary border-primary' : 'border-border'
                    }`}
                  >
                    {isChecked && <Check size={11} className="text-white" />}
                  </span>
                  {t(`restriction.${key}` as const)}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('profile.excludeFood')}</label>
          <div className="relative">
            <input
              type="text"
              value={excludeInput}
              onChange={(e) => setExcludeInput(e.target.value)}
              placeholder={t('profile.excludeFoodPlaceholder')}
              className="w-full px-3 py-2 border border-border rounded-sm bg-surface-200 text-ink text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-surface-200 border border-border rounded-sm shadow-lg overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addExcludedFood(s)}
                    className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-surface-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-ink-muted mt-1">{t('profile.excludeFoodHint')}</p>

          {excludedFoods.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {excludedFoods.map((food) => (
                <span
                  key={food}
                  className="flex items-center gap-1 text-xs font-medium text-ink bg-surface-100 border border-border pl-2.5 pr-1.5 py-1 rounded-full"
                >
                  {food}
                  <button
                    type="button"
                    onClick={() => removeExcludedFood(food)}
                    className="text-ink-muted hover:text-danger"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-2.5 bg-primary text-white rounded-full font-display font-semibold hover:bg-primary-strong disabled:opacity-50"
        >
          {isSaving ? t('profile.saving') : saved ? t('profile.saved') : t('profile.save')}
        </button>
      </form>

      <form id="contact" onSubmit={handleSendFeedback} className="bg-surface-200 border border-border rounded-md p-4 space-y-3 scroll-mt-4">
        <h2 className="font-display font-semibold text-ink flex items-center gap-2">
          <MessageSquare size={18} className="text-primary" />
          {t('profile.contact')}
        </h2>
        <p className="text-xs text-ink-muted">{t('profile.contactHint')}</p>
        <textarea
          value={feedback}
          onChange={(e) => {
            setFeedback(e.target.value)
            if (feedbackState !== 'sending') setFeedbackState('idle')
          }}
          placeholder={t('profile.contactPlaceholder')}
          rows={5}
          maxLength={5000}
          className="w-full px-3 py-2 border border-border rounded-sm bg-surface-200 text-ink text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        {feedbackState === 'sent' && <p className="text-sm text-primary">{t('profile.contactSent')}</p>}
        {feedbackState === 'error' && <p className="text-sm text-danger">{t('profile.contactError')}</p>}
        <button
          type="submit"
          disabled={!feedback.trim() || feedbackState === 'sending'}
          className="w-full py-2.5 bg-primary text-white rounded-full font-display font-semibold hover:bg-primary-strong disabled:opacity-50"
        >
          {feedbackState === 'sending' ? t('profile.contactSending') : t('profile.contactSend')}
        </button>
      </form>

      <AccountDataSection />

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-2.5 border border-danger text-danger rounded-full font-display font-semibold hover:bg-tint-clay"
      >
        <LogOut size={18} />
        {t('profile.logout')}
      </button>
    </div>
  )
}
