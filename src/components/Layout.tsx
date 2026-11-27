import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useOnline } from '../lib/online'
import { toggleHidden, useHidden } from '../lib/privacy'
import { toast, useToasts } from '../lib/toast'

/** F10-01: avisos flotantes encima de la barra de pestañas */
function Toaster() {
  const toasts = useToasts()
  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.kind === 'ok' ? '✓ ' : '⚠ '}{t.text}</div>)}
    </div>
  )
}

const tabs = [
  { to: '/', label: 'Inicio' },
  { to: '/movimientos', label: 'Mes' },
  { to: '/carteras', label: 'Carteras' },
  { to: '/fijos', label: 'Fijos' },
  { to: '/categorias', label: 'Categorías', short: 'Categ.' },
]

// Móvil: barra de pestañas abajo. Escritorio (≥ 900px): menú lateral.
export default function Layout() {
  const hidden = useHidden()
  const online = useOnline()
  // F10-04: al volver la conexión, remontar la página para que recargue sus datos
  const [epoch, setEpoch] = useState(0)
  const wasOffline = useRef(!online)
  useEffect(() => {
    if (!online) { wasOffline.current = true; return }
    if (wasOffline.current) {
      wasOffline.current = false
      setEpoch((e) => e + 1)
      toast('Conexión recuperada')
    }
  }, [online])

  return (
    <div className="app">
      <nav className="tabbar">
        <span className="brand">Gastos</span>
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'}>
            {t.short ? (
              <>
                <span className="label-short">{t.short}</span>
                <span className="label-long">{t.label}</span>
              </>
            ) : (
              t.label
            )}
          </NavLink>
        ))}
        {/* F10-08 ocultar / mostrar importes */}
        <button type="button" className="eye" onClick={toggleHidden} aria-pressed={hidden}
          aria-label={hidden ? 'Mostrar saldos' : 'Ocultar saldos'} title={hidden ? 'Mostrar saldos' : 'Ocultar saldos'}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {hidden && <path d="M3 3l18 18" />}
          </svg>
          <span className="label-long">{hidden ? 'Mostrar saldos' : 'Ocultar saldos'}</span>
        </button>
      </nav>
      <main className="content">
        {!online && (
          <div className="offline" role="alert">
            <strong>Sin conexión.</strong> Los datos pueden no estar al día y no se pueden guardar cambios.
          </div>
        )}
        <Outlet key={epoch} />
      </main>
      <Toaster />
    </div>
  )
}
