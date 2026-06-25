import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useEqStore } from '../store/eqStore';
import { SafeAreaView } from 'react-native-safe-area-context';

const EQ_LABELS = ['低音', '中低', '中音', '中高', '高音'];
const DEFAULT_PRESETS = [
  { name: '正常', values: [0, 0, 0, 0, 0] },
  { name: '流行', values: [2, 4, 5, 3, 1] },
  { name: '摇滚', values: [5, 3, 0, 3, 5] },
  { name: '爵士', values: [3, 1, 2, 4, 2] },
  { name: '古典', values: [4, 3, 0, 2, 4] },
  { name: '人声', values: [-1, 2, 5, 4, 1] },
  { name: '自定义', values: [0, 0, 0, 0, 0] },
];

export default function EqualizerScreen({ navigation }: any) {
  const { currentPreset, currentValues, setPreset, setValues, savedPresets, savePreset } = useEqStore();
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isCustom = currentPreset === '自定义';

  const handleSliderChange = (index: number, value: number) => {
    const newValues = [...currentValues];
    newValues[index] = value;
    setValues(newValues);
  };

  const handleSave = (name: string) => {
    if (isUpdating) {
      const idx = parseInt(currentPreset.replace('custom_', ''));
      savePreset(name, currentValues, idx);
    } else {
      savePreset(name, currentValues);
    }
    setShowSaveModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>均衡器</Text>
        {isCustom && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => setShowSaveModal(true)}
          >
            <Text style={styles.saveButtonText}>保存</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.presetsContainer}>
          {DEFAULT_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.name}
              style={[
                styles.presetButton,
                currentPreset === preset.name && styles.presetButtonActive,
              ]}
              onPress={() => setPreset(preset.name)}
            >
              <Text style={[
                styles.presetButtonText,
                currentPreset === preset.name && styles.presetButtonTextActive,
              ]}>
                {preset.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.eqContainer}>
          {EQ_LABELS.map((label, index) => (
            <View key={label} style={styles.eqRow}>
              <Text style={styles.eqLabel}>{label}</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.eqValue}>{currentValues[index]}dB</Text>
                <View style={styles.sliderTrack}>
                  <View
                    style={[
                      styles.sliderFill,
                      {
                        width: `${((currentValues[index] + 12) / 24) * 100}%`,
                        backgroundColor: currentValues[index] > 0 ? '#e8b43c' : currentValues[index] < 0 ? '#ff6b6b' : '#666',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.eqRange}>-12</Text>
                <Text style={styles.eqRange}>+12</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {showSaveModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>保存预设</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                savePreset('自定义预设', currentValues);
                setShowSaveModal(false);
              }}
            >
              <Text style={styles.modalButtonText}>保存</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowSaveModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a16',
  },
  backButton: {
    fontSize: 24,
    color: '#ffffff',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#e8b43c',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  presetButtonActive: {
    backgroundColor: '#e8b43c',
    borderColor: '#e8b43c',
  },
  presetButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  presetButtonTextActive: {
    color: '#000000',
  },
  eqContainer: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  eqRow: {
    marginBottom: 16,
  },
  eqLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eqValue: {
    fontSize: 12,
    color: '#e8b43c',
    width: 40,
    textAlign: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 2,
  },
  eqRange: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    width: 30,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#1a1a16',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: '#e8b43c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancelButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
});
