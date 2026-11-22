import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Inicio' },
  { to: '/movimientos', label: 'Mes' },
  { to: '/carteras', label: 'Carteras' },
  { to: '/fijos', label: 'Fijos' },
  { to: '/categorias', label: 'Categorías', short: 'Categ.' },
]

// Móvil: barra de pestañas abajo. Escritorio (≥ 900px): menú lateral.
export default function Layout() {
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
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
