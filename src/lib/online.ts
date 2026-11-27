import { useSyncExternalStore } from 'react'

// F10-04: estado de la conexión (eventos online/offline del navegador)
function subscribe(l: () => void) {
  window.addEventListener('online', l)
  window.addEventListener('offline', l)
  return () => {
    window.removeEventListener('online', l)
    window.removeEventListener('offline', l)
  }
}

export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine)
}
