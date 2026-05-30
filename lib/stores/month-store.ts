import { create } from "zustand"

import { getCurrentMonth } from "@/lib/month-period"

type MonthState = {
  year: number
  /** 1-12 */
  month: number
  setMonth: (year: number, month: number) => void
  goPrev: () => void
  goNext: () => void
  goToday: () => void
}

export const useMonthStore = create<MonthState>((set) => ({
  ...getCurrentMonth(),
  setMonth: (year, month) => set({ year, month }),
  goPrev: () =>
    set((state) =>
      state.month === 1
        ? { year: state.year - 1, month: 12 }
        : { month: state.month - 1 }
    ),
  goNext: () =>
    set((state) =>
      state.month === 12
        ? { year: state.year + 1, month: 1 }
        : { month: state.month + 1 }
    ),
  goToday: () => set(getCurrentMonth()),
}))
