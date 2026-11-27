import { useSyncExternalStore } from 'react'

// F10-01: avisos breves de éxito / error ("Guardado", "Pagado"…)
export type Toast = { id: number; text: string; kind: 'ok' | 'error' }

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function toast(text: string, kind: Toast['kind'] = 'ok') {
  const t = { id: nextId++, text, kind }
  toasts = [...toasts.slice(-2), t] // como mucho 3 a la vez
  emit()
  setTimeout(() => { toasts = toasts.filter((x) => x.id !== t.id); emit() }, kind === 'error' ? 5000 : 2500)
}

export function useToasts() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l) } },
    () => toasts,
  )
}
