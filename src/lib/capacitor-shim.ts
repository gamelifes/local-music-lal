/**
 * Capacitor shim — drop-in replacement for @capacitor/core
 * Provides the same API without the telemetry/network overhead.
 */

declare global {
  interface Window {
    AndroidBridge?: {
      getPlatform(): string
      getHttpServerPort(): number
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
  if (filePath.startsWith('file://')) return filePath
  if (filePath.startsWith('/storage/emulated/0/')) {
    const rel = filePath.slice('/storage/emulated/0/'.length)
    const port = getHttpPort()
    if (port > 0) return `http://127.0.0.1:${port}/ext/${rel}`
    return `file://${filePath}`
  }
  if (filePath.startsWith('/')) return `file://${filePath}`
  return `file:///storage/emulated/0/${filePath}`
}

let _httpPort: number | null = null

function getHttpPort(): number {
  if (_httpPort !== null) return _httpPort
  if (window.AndroidBridge) {
    const port = window.AndroidBridge.getHttpServerPort()
    if (port > 0) {
      _httpPort = port
      return _httpPort
    }
  }
  return 0
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
