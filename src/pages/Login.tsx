import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

/** Mensajes de Supabase Auth → español */
export function authError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email o contraseña incorrectos'
  if (m.includes('email not confirmed')) return 'Confirma tu email antes de entrar (revisa tu correo)'
  if (m.includes('user already registered')) return 'Ya existe una cuenta con ese email'
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres'
  if (m.includes('same as the old') || m.includes('different from the old')) return 'La contraseña nueva debe ser distinta de la anterior'
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Demasiados intentos. Espera unos minutos y vuelve a probar'
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'Email no válido'
  return msg
}

type Mode = 'login' | 'signup' | 'reset'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<Mode>('login')
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)
  const [busy, setBusy] = useState(false)

  function go(m: Mode) { setMode(m); setMsg(''); setOk(false) }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setMsg(''); setOk(false); setBusy(true)
    const { error } =
      mode === 'login' ? await supabase.auth.signInWithPassword({ email, password })
      : mode === 'signup' ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } })
      // F4-04: el enlace del email vuelve a la app con evento PASSWORD_RECOVERY (ver App.tsx)
      : await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
    setBusy(false)
    if (error) return setMsg(authError(error.message))
    if (mode === 'signup') { setOk(true); setMsg('Revisa tu email para confirmar la cuenta') }
    if (mode === 'reset') { setOk(true); setMsg('Si el email tiene cuenta, te llegará un enlace para crear una contraseña nueva. Mira también en spam.') }
  }

  return (
    <form className="login" onSubmit={submit}>
      <h1>Mis Gastos</h1>
      {mode === 'reset' && <p className="msg">Escribe tu email y te mandamos un enlace para crear una contraseña nueva.</p>}
      <input type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      {mode !== 'reset' && (
        <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
      )}
      <button type="submit" disabled={busy}>
        {busy ? '…' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Crear cuenta' : 'Enviar enlace'}
      </button>

      {msg && <p className={`msg${ok ? ' pos' : ' neg'}`}>{msg}</p>}

      {mode === 'login' && <button type="button" className="link" onClick={() => go('reset')}>¿Has olvidado tu contraseña?</button>}
      <button type="button" className="link" onClick={() => go(mode === 'login' ? 'signup' : 'login')}>
        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : 'Volver a entrar'}
      </button>
    </form>
  )
}

/** F4-04: pantalla tras abrir el enlace del email de recuperación (ya hay sesión) */
export function NewPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (password !== repeat) return setMsg('Las contraseñas no coinciden')
    setBusy(true); setMsg('')
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setMsg(authError(error.message))
    onDone()
  }

  return (
    <form className="login" onSubmit={submit}>
      <h1>Nueva contraseña</h1>
      <input type="password" placeholder="Contraseña nueva" autoComplete="new-password" value={password}
        onChange={(e) => setPassword(e.target.value)} required minLength={6} autoFocus />
      <input type="password" placeholder="Repite la contraseña" autoComplete="new-password" value={repeat}
        onChange={(e) => setRepeat(e.target.value)} required minLength={6} />
      <button type="submit" disabled={busy}>{busy ? '…' : 'Guardar contraseña'}</button>
      {msg && <p className="msg neg">{msg}</p>}
    </form>
  )
}
