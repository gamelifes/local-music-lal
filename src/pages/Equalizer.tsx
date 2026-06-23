import { useState } from 'react'
import { useEqStore } from '../store/eq'
import { EQ_LABELS, DEFAULT_PRESETS } from '../types/eq'
import { EqCurve } from '../components/EqCurve'
import { SavePresetModal } from '../components/SavePresetModal'

interface EqualizerProps {
  onNavigate: (page: string) => void
}

export function Equalizer({ onNavigate }: EqualizerProps) {
  const { currentPreset, currentValues, setPreset, setValues, savedPresets, savePreset } = useEqStore()
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const isCustom = currentPreset === '自定义'
  const isSavedPreset = currentPreset.startsWith('custom_')

  const handleCurveChange = (v: number[]) => {
    setValues(v)
  }

  const handleSave = (name: string) => {
    if (isUpdating && isSavedPreset) {
      const idx = parseInt(currentPreset.replace('custom_', ''))
      savePreset(name, currentValues, idx)
    } else {
      savePreset(name, currentValues)
    }
    setShowSaveModal(false)
  }

  return (
    <div className="page active">
      <div className="page-content" style={{ paddingTop: 0 }}>
        {/* Sticky Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg)', padding: '8px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0 12px' }}>
            <button onClick={() => onNavigate('home')} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>
              <img src="/icons/back.svg" alt="back" width="24" height="24" />
            </button>
            <h2 style={{ fontSize: '18px', flex: 1 }}>均衡器</h2>
            {isCustom && (
              <button
                onClick={() => { setIsUpdating(false); setShowSaveModal(true) }}
                style={{
                  background: 'var(--accent)',
                  border: '1px solid var(--accent)',
                  color: '#000',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 14px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                保存
              </button>
            )}
            {isSavedPreset && (
              <button
                onClick={() => { setIsUpdating(true); setShowSaveModal(true) }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--accent)',
                  color: 'var(--accent)',
                  borderRadius: 'var(--radius-md)',
                  padding: '6px 14px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                更新
              </button>
            )}
          </div>
        </div>

        {/* Presets */}
        <div className="eq-presets">
          {DEFAULT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              className={`eq-preset-btn ${currentPreset === preset.name ? 'active' : ''}`}
              onClick={() => setPreset(preset.name)}
            >
              {preset.name}
            </button>
          ))}
          {savedPresets.map((sp, i) => (
            <button
              key={`sp${i}`}
              className={`eq-preset-btn ${currentPreset === `custom_${i}` ? 'active' : ''}`}
              onClick={() => setPreset(`custom_${i}`)}
            >
              {sp.name}
            </button>
          ))}
        </div>

        {/* EQ Curve Canvas */}
        <EqCurve values={currentValues} onChange={handleCurveChange} />

        {/* dB Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px' }}>
          {EQ_LABELS.map((label, i) => (
            <span key={i} style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', flex: 1 }}>
              {label}<br />
              <span style={{
                fontSize: '10px',
                opacity: 0.5,
                color: currentValues[i] > 0 ? 'var(--accent)' : currentValues[i] < 0 ? '#ff6b6b' : 'var(--text-secondary)'
              }}>
                {currentValues[i] > 0 ? '+' : ''}{currentValues[i].toFixed(0)}dB
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Save Preset Modal */}
      <SavePresetModal
        visible={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSave}
        initialName={isUpdating && isSavedPreset ? savedPresets[parseInt(currentPreset.replace('custom_', ''))]?.name : ''}
      />
    </div>
  )
}
