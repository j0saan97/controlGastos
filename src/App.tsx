import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Login, { NewPassword } from './pages/Login'
import Dashboard from './pages/Dashboard'
import Movements from './pages/Movements'
import Wallets from './pages/Wallets'
import Categories from './pages/Categories'
import Recurring from './pages/Recurring'

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      // F4-04: se abrió el enlace del email "recuperar contraseña"
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (session === undefined) return null // cargando
  if (!session) return <Login />
  if (recovering) return <NewPassword onDone={() => setRecovering(false)} />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="movimientos" element={<Movements />} />
        <Route path="carteras" element={<Wallets />} />
        <Route path="fijos" element={<Recurring />} />
        <Route path="categorias" element={<Categories />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  )
}
