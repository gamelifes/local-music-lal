import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EqPreset {
  name: string;
  values: number[];
  isCustom: boolean;
}

interface EqState {
  currentPreset: string;
  currentValues: number[];
  savedPresets: EqPreset[];

  setPreset: (name: string) => void;
  setValues: (values: number[]) => void;
  savePreset: (name: string, values: number[], updateIndex?: number) => Promise<void>;
  loadPresets: () => Promise<void>;
}

export const useEqStore = create<EqState>((set, get) => ({
  currentPreset: '正常',
  currentValues: [0, 0, 0, 0, 0],
  savedPresets: [],

  setPreset: (name) => {
    const preset = [...DEFAULT_PRESETS, ...get().savedPresets].find(p => p.name === name);
    if (preset) {
      set({ currentPreset: name, currentValues: [...preset.values] });
    } else if (name.startsWith('custom_')) {
      const idx = parseInt(name.replace('custom_', ''));
      const sp = get().savedPresets[idx];
      if (sp) {
        set({ currentPreset: name, currentValues: [...sp.values] });
      }
    }
  },

  setValues: (values) => set({ currentValues: values }),

  savePreset: async (name, values, updateIndex) => {
    const preset: EqPreset = { name, values, isCustom: true };
    let newPresets = [...get().savedPresets];

    if (updateIndex !== undefined && updateIndex >= 0 && updateIndex < newPresets.length) {
      newPresets[updateIndex] = preset;
    } else {
      newPresets = [...newPresets.filter(p => p.name !== name), preset];
    }

    await AsyncStorage.setItem('eqPresets', JSON.stringify(newPresets));
    set({
      savedPresets: newPresets,
      currentPreset: updateIndex !== undefined ? `custom_${updateIndex}` : name,
    });
  },

  loadPresets: async () => {
    try {
      const presetsJson = await AsyncStorage.getItem('eqPresets');
      if (presetsJson) {
        set({ savedPresets: JSON.parse(presetsJson) });
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  },
}));

const DEFAULT_PRESETS = [
  { name: '正常', values: [0, 0, 0, 0, 0], isCustom: false },
  { name: '流行', values: [2, 4, 5, 3, 1], isCustom: false },
  { name: '摇滚', values: [5, 3, 0, 3, 5], isCustom: false },
  { name: '爵士', values: [3, 1, 2, 4, 2], isCustom: false },
  { name: '古典', values: [4, 3, 0, 2, 4], isCustom: false },
  { name: '人声', values: [-1, 2, 5, 4, 1], isCustom: false },
  { name: '自定义', values: [0, 0, 0, 0, 0], isCustom: true },
];
