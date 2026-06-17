import { EQ_FREQUENCIES } from '../types/eq'

let audioContext: AudioContext | null = null
let sourceNode: MediaElementAudioSourceNode | null = null
let filters: BiquadFilterNode[] = []
let masterGain: GainNode | null = null

export function initEqualizer(audioElement: HTMLAudioElement) {
  destroy()

  audioContext = new AudioContext()
  sourceNode = audioContext.createMediaElementSource(audioElement)
  masterGain = audioContext.createGain()

  filters = EQ_FREQUENCIES.map((freq) => {
    const filter = audioContext!.createBiquadFilter()
    filter.type = 'peaking'
    filter.frequency.value = freq
    filter.Q.value = 1.0
    filter.gain.value = 0
    return filter
  })

  let lastNode: AudioNode = sourceNode
  for (const filter of filters) {
    lastNode.connect(filter)
    lastNode = filter
  }
  lastNode.connect(masterGain)
  masterGain.connect(audioContext!.destination)
}

export function setEqValues(values: number[]) {
  values.forEach((gain, i) => {
    if (filters[i]) {
      filters[i].gain.value = gain
    }
  })
}

export function setMasterVolume(volume: number) {
  if (masterGain) {
    masterGain.gain.value = volume
  }
}

export function destroy() {
  if (audioContext) {
    audioContext.close()
    audioContext = null
    sourceNode = null
    filters = []
    masterGain = null
  }
}
