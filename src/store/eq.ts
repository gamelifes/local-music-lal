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
  savePreset: (name: string, values: number[], updateIndex?: number) => Promise<void>
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
    } else if (name.startsWith('custom_')) {
      const idx = parseInt(name.replace('custom_', ''))
      const sp = get().savedPresets[idx]
      if (sp) {
        set({ currentPreset: name, currentValues: [...sp.values] })
      }
    }
  },

  setValues: (values) => set({ currentValues: values }),

  savePreset: async (name, values, updateIndex) => {
    const preset: EqPreset = { name, values, isCustom: true }
    await db.saveEqPreset(preset)
    set(state => {
      let newPresets = [...state.savedPresets]
      if (updateIndex !== undefined && updateIndex >= 0 && updateIndex < newPresets.length) {
        newPresets[updateIndex] = preset
      } else {
        newPresets = [...newPresets.filter(p => p.name !== name), preset]
      }
      return {
        savedPresets: newPresets,
        currentPreset: updateIndex !== undefined ? `custom_${updateIndex}` : name,
      }
    })
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
