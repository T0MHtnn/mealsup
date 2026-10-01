import { create } from 'zustand'
import { adminService } from '@/services/supabaseClient'

interface AdminStore {
  /** Messages not handled yet, shown as a badge on the Feedbacks tab. */
  openFeedbacks: number
  setOpenFeedbacks: (count: number) => void
  refreshOpenFeedbacks: () => Promise<void>
}

export const useAdminStore = create<AdminStore>()((set) => ({
  openFeedbacks: 0,
  setOpenFeedbacks: (openFeedbacks) => set({ openFeedbacks }),
  refreshOpenFeedbacks: async () => {
    try {
      set({ openFeedbacks: await adminService.countOpenFeedback() })
    } catch (err) {
      console.warn('Open feedback count error:', err)
    }
  },
}))
