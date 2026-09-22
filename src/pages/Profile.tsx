import { useEffect, useMemo, useState } from 'react'
import { LogOut, User as UserIcon, Sun, Moon, Monitor, Check, Pencil, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUiStore, type Theme } from '@/store/uiStore'
import { authService, userService } from '@/services/supabaseClient'
import { useTranslation } from '@/hooks/useTranslation'
import { EQUIPMENT_LIST, type EquipmentKey } from '@/constants/equipment'
import { DIETARY_RESTRICTIONS, type DietaryRestrictionKey } from '@/constants/dietaryRestrictions'
import { GROCERY_CATALOG } from '@/constants/groceryCatalog'
import { normalizeText } from '@/utils/text'
import LanguageSwitch from '@/components/common/LanguageSwitch'
import EditProfileModal from '@/components/EditProfileModal'

const THEME_OPTIONS: { value: Theme; icon: typeof Sun }[] = [
  { value: 'light', icon: Sun },
  { value: 'dark', icon: Moon },
  { value: 'system', icon: Monitor },
]

const EXTRA_EXCLUDABLE = ['Arachides', 'Fruits à coque', 'Gluten', 'Soja', 'Crustacés', 'Mollusques', 'Sésame']
const EXCLUDABLE_FOODS = Array.from(new Set([...Object.values(GROCERY_CATALOG).flat(), ...EXTRA_EXCLUDABLE]))

export default function ProfilePage() {
  const { t } = useTranslation()
  const session = useAuthStore((state) => state.session)
  const logout = useAuthStore((state) => state.logout)
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
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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

  const toggleEquipment = (key: EquipmentKey) => {
    const next = new Set(equipment)
    next.has(key) ? next.delete(key) : next.add(key)
    setEquipment(next)
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
        equipment_all: equipmentAll,
        equipment: Array.from(equipment),
      })
      setSaved(true)
    } catch (err) {
      console.error('Save preferences error:', err)
    } finally {
      setIsSaving(false)
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

      <div className="bg-surface-200 border border-border rounded-md p-4">
        <span className="font-display font-semibold text-ink">{t('profile.equipment')}</span>
        <p className="text-xs text-ink-muted mt-1">{t('profile.equipmentHint')}</p>

        <button
          type="button"
          onClick={() => setEquipmentAll(!equipmentAll)}
          className={`w-full mt-3 flex items-center gap-2.5 px-3 py-2.5 rounded-sm border text-sm font-display font-semibold transition-colors ${
            equipmentAll ? 'bg-primary border-primary text-white' : 'border-border text-ink'
          }`}
        >
          <span
            className={`w-4.5 h-4.5 rounded-sm border-2 flex items-center justify-center shrink-0 ${
              equipmentAll ? 'border-white' : 'border-border'
            }`}
          >
            {equipmentAll && <Check size={12} className="text-white" />}
          </span>
          {t('profile.equipmentAll')}
        </button>

        <div className={`grid grid-cols-2 gap-2 mt-3 ${equipmentAll ? 'opacity-40 pointer-events-none' : ''}`}>
          {EQUIPMENT_LIST.map(({ key, icon: Icon }) => {
            const isChecked = equipment.has(key)
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleEquipment(key)}
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
      </div>

      <form
        onSubmit={handleSave}
        className="bg-surface-200 border border-border rounded-md p-4 space-y-5"
      >
        <h2 className="font-display font-semibold text-ink">{t('profile.preferences')}</h2>

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
