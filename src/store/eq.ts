import { create } from 'zustand'
import { DEFAULT_PRESETS } from '../types/eq'
import type { EqPreset } from '../types/eq'
import * as db from '../lib/db'

interface EqState {
  currentPreset: string
  currentValues: number[]
  savedPresets: EqPreset[]

  setPreset: (name: string) => void
  setValues: (values: number[]) => void
  savePreset: (name: string, values: number[]) => Promise<void>
  deletePreset: (name: string) => Promise<void>
  loadPresets: () => Promise<void>
}

export const useEqStore = create<EqState>((set, get) => ({
  currentPreset: '正常',
  currentValues: [0, 0, 0, 0, 0],
  savedPresets: [],

  setPreset: (name) => {
    const preset = [...DEFAULT_PRESETS, ...get().savedPresets].find(p => p.name === name)
    if (preset) {
      set({ currentPreset: name, currentValues: [...preset.values] })
    }
  },

  setValues: (values) => set({ currentValues: values, currentPreset: '自定义' }),

  savePreset: async (name, values) => {
    const preset: EqPreset = { name, values, isCustom: true }
    await db.saveEqPreset(preset)
    set(state => ({
      savedPresets: [...state.savedPresets.filter(p => p.name !== name), preset],
      currentPreset: name,
    }))
  },

  deletePreset: async (name) => {
    await db.deleteEqPreset(name)
    set(state => ({
      savedPresets: state.savedPresets.filter(p => p.name !== name),
    }))
  },

  loadPresets: async () => {
    const presets = await db.getEqPresets()
    set({ savedPresets: presets })
  },
}))
