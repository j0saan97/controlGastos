import { useEffect, type ReactNode } from 'react'

type Props = { title: string; onClose: () => void; children: ReactNode }

/** Hoja inferior en móvil, ventana centrada en escritorio. Esc o clic fuera cierra. */
export default function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <header className="row">
          <h3>{title}</h3>
          <button className="link" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>
        {children}
      </div>
    </div>
  )
}
