import { useSyncExternalStore } from 'react'

// F10-08: ocultar importes en pantalla. Se recuerda en este dispositivo.
const KEY = 'hideAmounts'
let hidden = localStorage.getItem(KEY) === '1'
const listeners = new Set<() => void>()

export const MASK = '•••• €'
export const isHidden = () => hidden

export function toggleHidden() {
  hidden = !hidden
  localStorage.setItem(KEY, hidden ? '1' : '0')
  listeners.forEach((l) => l())
}

/** Suscribe el componente: se vuelve a pintar al pulsar 👁 (eur() ya devuelve la máscara) */
export function useHidden() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l) } },
    isHidden,
  )
}
