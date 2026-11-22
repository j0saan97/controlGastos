import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [msg, setMsg] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    setMsg('')
    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    if (error) setMsg(error.message)
    else if (mode === 'signup') setMsg('Revisa tu email para confirmar la cuenta')
  }

  return (
    <form className="login" onSubmit={submit}>
      <h1>Mis Gastos</h1>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
      <button type="submit">{mode === 'login' ? 'Entrar' : 'Crear cuenta'}</button>
      <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : 'Ya tengo cuenta'}
      </button>
      {msg && <p className="msg">{msg}</p>}
    </form>
  )
}
