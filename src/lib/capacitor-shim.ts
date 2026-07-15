/**
 * Capacitor shim — drop-in replacement for @capacitor/core
 * Provides the same API without the telemetry/network overhead.
 */

declare global {
  interface Window {
    _onPermissionResult?: (result: string) => void
    _onFloatingAction?: (action: string) => void
    _onAppBackground?: () => void
    _onAppForeground?: () => void
    AndroidBridge?: {
      getPlatform(): string
      getHttpServerPort(): number
      exitApp(): void
      readdir(path: string): Promise<string>
      readFileChunk(path: string, offset: number, length: number): Promise<string>
      readFileText(path: string): Promise<string>
      getFileSize(path: string): Promise<number>
      pickDirectory(): Promise<string>
      checkStoragePermission(): boolean
      requestStoragePermission(): void
      openAppSettings(): void
      checkOverlayPermission(): boolean
      requestOverlayPermission(): void
      showFloatingPlayer(title: string, artist: string): void
      hideFloatingPlayer(): void
      updateFloatingState(playing: boolean): void
      updateSongInfo(title: string, artist: string, playing: boolean): void
    }
  }
}

function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Android')
}

function encodePathForUri(path: string): string {
  return path.split('/').map(segment => {
    if (!segment) return segment
    return encodeURIComponent(segment)
  }).join('/')
}

function getHttpPort(): number {
  if (typeof window !== 'undefined' && window.location && window.location.port) {
    return parseInt(window.location.port, 10)
  }
  if (window.AndroidBridge) {
    const port = window.AndroidBridge.getHttpServerPort()
    if (port > 0) return port
  }
  return 0
}

export const Capacitor = {
  convertFileSrc(path: string): string {
    if (path.startsWith('file://')) return path
    const port = getHttpPort()
    if (port > 0) {
      const rel = path.startsWith('/') ? path.replace('/storage/emulated/0/', '') : path
      return `http://127.0.0.1:${port}/ext/${encodePathForUri(rel)}`
    }
    return `file://${path}`
  },

  getPlatform(): string {
    if (window.AndroidBridge) return 'android'
    if (isAndroid()) return 'android'
    if (typeof navigator !== 'undefined') {
      if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) return 'ios'
    }
    return 'web'
  },

  checkStoragePermission(): boolean {
    if (window.AndroidBridge) return window.AndroidBridge.checkStoragePermission()
    return true
  },

  requestStoragePermission(): Promise<boolean> {
    const bridge = window.AndroidBridge
    if (!bridge) return Promise.resolve(true)
    return new Promise((resolve) => {
      window._onPermissionResult = (result: string) => {
        delete (window as any)._onPermissionResult
        resolve(result === 'granted')
      }
      bridge.requestStoragePermission()
    })
  },

  openAppSettings(): void {
    if (window.AndroidBridge) window.AndroidBridge.openAppSettings()
  },

  checkOverlayPermission(): boolean {
    if (window.AndroidBridge) return window.AndroidBridge.checkOverlayPermission()
    return false
  },

  requestOverlayPermission(): void {
    window.AndroidBridge?.requestOverlayPermission()
  },

  showFloatingPlayer(title: string, artist: string): void {
    window.AndroidBridge?.showFloatingPlayer(title, artist)
  },

  hideFloatingPlayer(): void {
    window.AndroidBridge?.hideFloatingPlayer()
  },

  updateFloatingState(playing: boolean): void {
    window.AndroidBridge?.updateFloatingState(playing)
  },

  updateSongInfo(title: string, artist: string, playing: boolean): void {
    window.AndroidBridge?.updateSongInfo(title, artist, playing)
  },

  onFloatingAction(callback: (action: string) => void): void {
    window._onFloatingAction = callback
  }
}

/**
 * Native filesystem bridge — uses AndroidBridge JavaScript interface
 * Falls back to fetch-based file reading for web platform
 */
export const FilesystemBridge = {
  async readdir(dirPath: string): Promise<Array<{ name: string; type: string; size: number }>> {
    if (window.AndroidBridge) {
      const json = await window.AndroidBridge.readdir(dirPath)
      return JSON.parse(json)
    }
    return []
  },

  async readFileChunk(filePath: string, offset: number, length: number): Promise<Uint8Array> {
    if (window.AndroidBridge) {
      const base64 = await window.AndroidBridge.readFileChunk(filePath, offset, length)
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      return bytes
    }
    throw new Error('No native bridge available')
  },

  async readFileText(filePath: string): Promise<string> {
    if (window.AndroidBridge) {
      return await window.AndroidBridge.readFileText(filePath)
    }
    throw new Error('No native bridge available')
  },

  async getFileSize(filePath: string): Promise<number> {
    if (window.AndroidBridge) {
      return await window.AndroidBridge.getFileSize(filePath)
    }
    return 0
  },

  async pickDirectory(): Promise<string | null> {
    if (window.AndroidBridge) {
      return new Promise<string | null>((resolve) => {
        const timeout = setTimeout(() => { resolve(null) }, 60000)
        ;(window as any)._directoryPicked = (path: string) => {
          clearTimeout(timeout)
          ;(window as any)._directoryPicked = undefined
          resolve(path || null)
        }
        window.AndroidBridge!.pickDirectory()
      })
    }
    return null
  }
}

// File handle store (for Web platform File System Access API)
const fileHandleStore: Map<string, FileSystemFileHandle> = new Map()

export function storeFileHandle(filePath: string, handle: FileSystemFileHandle) {
  fileHandleStore.set(filePath, handle)
}

export function getFileHandle(filePath: string): FileSystemFileHandle | undefined {
  return fileHandleStore.get(filePath)
}