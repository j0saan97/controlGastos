/** Convierte un error en un texto para el usuario (los fallos de red, en español) */
export function errorText(e: unknown): string {
  const msg = e instanceof Error ? e.message : String((e as { message?: string })?.message ?? e)
  const m = msg.toLowerCase()
  if (!navigator.onLine || m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed') || m.includes('network request failed'))
    return 'Sin conexión: no se ha podido contactar con el servidor. Revisa tu internet y vuelve a probar.'
  if (m.includes('jwt expired')) return 'Tu sesión ha caducado. Cierra sesión y vuelve a entrar.'
  return msg
}
