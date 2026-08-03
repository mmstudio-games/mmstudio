import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Locale } from '@/i18n'

type PreferencesState = {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      locale: 'zh-CN',
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'mmstudio-preferences' },
  ),
)
