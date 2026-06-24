// Debug log collector
const logs: { time: string; type: string; message: string }[] = []
const maxLogs = 200

export function initLogCollector() {
  const origLog = console.log
  const origError = console.error
  const origWarn = console.warn

  console.log = (...args: any[]) => {
    origLog.apply(console, args)
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
    logs.push({ time: new Date().toLocaleTimeString(), type: 'LOG', message: msg })
    if (logs.length > maxLogs) logs.shift()
  }

  console.error = (...args: any[]) => {
    origError.apply(console, args)
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
    logs.push({ time: new Date().toLocaleTimeString(), type: 'ERROR', message: msg })
    if (logs.length > maxLogs) logs.shift()
  }

  console.warn = (...args: any[]) => {
    origWarn.apply(console, args)
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
    logs.push({ time: new Date().toLocaleTimeString(), type: 'WARN', message: msg })
    if (logs.length > maxLogs) logs.shift()
  }
}

export function getLogs() {
  return [...logs]
}

export function clearLogs() {
  logs.length = 0
}
