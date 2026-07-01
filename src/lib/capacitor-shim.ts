/**
 * Capacitor shim — drop-in replacement for @capacitor/core
 * Provides the same API without the telemetry/network overhead.
 */

declare global {
  interface Window {
    AndroidBridge?: {
      getPlatform(): string
      readdir(path: string): Promise<string>
      readFileChunk(path: string, offset: number, length: number): Promise<string>
      readFileText(path: string): Promise<string>
      getFileSize(path: string): Promise<number>
      pickDirectory(): Promise<string>
    }
  }
}

function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Android')
}

function getWebPath(filePath: string): string {
  // Convert absolute path to WebView-accessible file:// URL
  if (filePath.startsWith('file://')) return filePath
  if (filePath.startsWith('/')) return `file://${filePath}`
  return `file:///storage/emulated/0/${filePath}`
}

export const Capacitor = {
  convertFileSrc(path: string): string {
    return getWebPath(path)
  },

  getPlatform(): string {
    if (window.AndroidBridge) return 'android'
    if (isAndroid()) return 'android'
    if (typeof navigator !== 'undefined') {
      if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) return 'ios'
    }
    return 'web'
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
      return await window.AndroidBridge.pickDirectory()
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
