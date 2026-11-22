import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Inicio' },
  { to: '/movimientos', label: 'Mes' },
  { to: '/carteras', label: 'Carteras' },
  { to: '/fijos', label: 'Fijos' },
  { to: '/categorias', label: 'Categ.' },
]

export default function Layout() {
  return (
    <div className="app">
      <main className="content">
        <Outlet />
      </main>
      <nav className="tabbar">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'}>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
