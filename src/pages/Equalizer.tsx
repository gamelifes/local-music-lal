import { useEqStore } from '../store/eq'
import { EQ_FREQUENCIES, EQ_LABELS, DEFAULT_PRESETS } from '../types/eq'

interface EqualizerProps {
  onNavigate: (page: string) => void
}

export function Equalizer({ onNavigate }: EqualizerProps) {
  const { currentPreset, currentValues, setPreset, setValues, savedPresets } = useEqStore()

  const allPresets = [...DEFAULT_PRESETS, ...savedPresets]

  return (
    <div className="page active">
      <div className="page-content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0 12px' }}>
          <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '20px', cursor: 'pointer' }}>←</button>
          <h2 style={{ fontSize: '18px', flex: 1 }}>均衡器</h2>
        </div>

        {/* Presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 0 12px' }}>
          {allPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setPreset(preset.name)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                currentPreset === preset.name
                  ? 'bg-amber-500 text-black border border-amber-500'
                  : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Frequency Sliders */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' }}>
          {EQ_FREQUENCIES.map((freq, i) => (
            <div key={freq}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{EQ_LABELS[i]}</span>
                <span style={{ fontSize: '13px', fontFamily: 'monospace' }}>{currentValues[i]}dB</span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={currentValues[i]}
                  onChange={(e) => {
                    const newValues = [...currentValues]
                    newValues[i] = Number(e.target.value)
                    setValues(newValues)
                  }}
                  style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', appearance: 'none', cursor: 'pointer', accentColor: '#e8b43c' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <span>-12</span>
                  <span>0</span>
                  <span>+12</span>
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {freq >= 1000 ? `${freq / 1000}kHz` : `${freq}Hz`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
