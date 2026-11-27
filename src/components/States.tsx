import type { ReactNode } from 'react'

// F10-02: estados de carga, error y vacío comunes a todas las páginas

type LoadProps = {
  err?: string
  onRetry?: () => void
  /** silueta: 'dashboard' (tarjetas), 'list' (título + filas) o 'rows' (solo filas) */
  variant?: 'dashboard' | 'list' | 'rows'
}

/** Mientras carga: silueta de la página. Si falló: aviso + Reintentar */
export function LoadState({ err, onRetry, variant = 'list' }: LoadProps) {
  if (err) {
    return (
      <div className="state-error" role="alert">
        <strong>⚠ No se han podido cargar los datos</strong>
        <span>{err}</span>
        {onRetry && <button className="secondary" onClick={onRetry}>Reintentar</button>}
      </div>
    )
  }
  return (
    <div className="skeleton" aria-busy="true" aria-label="Cargando">
      {variant === 'dashboard' ? (
        <>
          <div className="sk sk-title" />
          <div className="sk sk-big" />
          <div className="grid">{[0, 1, 2, 3].map((i) => <div key={i} className="sk sk-card" />)}</div>
        </>
      ) : (
        <>
          {variant === 'list' && <div className="sk sk-title" />}
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className="sk sk-row" />)}
        </>
      )}
    </div>
  )
}

/** Lista vacía: icono + título + explicación + acción opcional */
export function Empty({ icon, title, children, action }: { icon: string; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty-icon" aria-hidden="true">{icon}</span>
      <strong>{title}</strong>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}
