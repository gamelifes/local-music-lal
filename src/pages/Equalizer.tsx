import { useEqStore } from '../store/eq'
import { DEFAULT_PRESETS, EQ_LABELS, EQ_FREQUENCIES } from '../types/eq'
import { Layout } from '../components/Layout'

export function Equalizer() {
  const currentPreset = useEqStore((s) => s.currentPreset)
  const currentValues = useEqStore((s) => s.currentValues)
  const setPreset = useEqStore((s) => s.setPreset)
  const setValues = useEqStore((s) => s.setValues)
  const savedPresets = useEqStore((s) => s.savedPresets)
  const savePreset = useEqStore((s) => s.savePreset)
  const deletePreset = useEqStore((s) => s.deletePreset)

  const allPresets = [...DEFAULT_PRESETS, ...savedPresets]

  const handleSliderChange = (index: number, value: number) => {
    const newValues = [...currentValues]
    newValues[index] = value
    setValues(newValues)
  }

  const handleSave = async () => {
    const name = `自定义 ${savedPresets.length + 1}`
    await savePreset(name, currentValues)
  }

  return (
    <Layout title="均衡器">
      <div className="p-4">
        {/* Preset Buttons */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-text-secondary mb-3">预设</h3>
          <div className="flex flex-wrap gap-2">
            {allPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setPreset(preset.name)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  currentPreset === preset.name
                    ? 'bg-accent text-black'
                    : 'bg-white/5 text-text-secondary hover:bg-white/10'
                }`}
              >
                {preset.name}
                {preset.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deletePreset(preset.name)
                    }}
                    className="ml-1.5 text-text-secondary/60 hover:text-red-400"
                  >
                    ×
                  </button>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* EQ Sliders */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-text-secondary mb-4">频段调节</h3>
          <div className="flex justify-between items-end gap-2 h-48">
            {EQ_FREQUENCIES.map((freq, index) => {
              const value = currentValues[index] || 0
              const percentage = ((value + 12) / 24) * 100
              return (
                <div key={freq} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-text-secondary font-medium">
                    {value > 0 ? `+${value}` : value}dB
                  </span>
                  <div className="relative flex-1 w-full flex justify-center">
                    <div className="relative h-full w-8">
                      <div className="absolute inset-0 bg-white/5 rounded-full w-1 mx-auto" />
                      <div
                        className="absolute bottom-0 w-1 rounded-full bg-accent mx-auto left-1/2 -translate-x-1/2"
                        style={{ height: `${percentage}%` }}
                      />
                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={value}
                        onChange={(e) => handleSliderChange(index, parseInt(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                      />
                      <div
                        className="absolute left-1/2 -translate-x-1/2 w-5 h-5 bg-accent rounded-full shadow-lg shadow-accent/30 cursor-grab active:cursor-grabbing transition-all hover:scale-110"
                        style={{ bottom: `calc(${percentage}% - 10px)` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] text-text-secondary block">{EQ_LABELS[index]}</span>
                    <span className="text-[9px] text-text-secondary/60">{freq >= 1000 ? `${freq / 1000}k` : freq}Hz</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 0dB Line */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setValues([0, 0, 0, 0, 0])}
            className="px-4 py-2 text-sm text-text-secondary bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
          >
            重置为 0dB
          </button>
        </div>

        {/* Save Preset */}
        {currentPreset === '自定义' && (
          <div className="flex justify-center">
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-accent text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              保存当前预设
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}
