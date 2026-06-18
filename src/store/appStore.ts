import { create } from 'zustand'

interface AppState {
  drawerOpen: boolean
  modals: { sleep: boolean; quality: boolean; share: boolean; fileInfo: boolean }

  toggleDrawer: () => void
  openModal: (name: keyof AppState['modals']) => void
  closeModal: (name: keyof AppState['modals']) => void
}

export const useAppStore = create<AppState>((set) => ({
  drawerOpen: false,
  modals: { sleep: false, quality: false, share: false, fileInfo: false },

  toggleDrawer: () => set(s => ({ drawerOpen: !s.drawerOpen })),
  openModal: (name) => set(s => ({ modals: { ...s.modals, [name]: true } })),
  closeModal: (name) => set(s => ({ modals: { ...s.modals, [name]: false } })),
}))