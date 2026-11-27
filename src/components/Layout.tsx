import { NavLink, Outlet } from 'react-router-dom'
import { toggleHidden, useHidden } from '../lib/privacy'

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
        <Outlet />
      </main>
    </div>
  )
}
