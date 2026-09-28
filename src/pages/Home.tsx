import { useNavigate } from 'react-router-dom'

const FEATURES = [
  {
    title: 'Ricerca su pubblico e privato',
    body: 'In parallelo, non uno alla volta',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
      </svg>
    ),
  },
  {
    title: 'Nessun risultato, nessun costo',
    body: 'Ricerca gratuita: sei tu a scegliere se prenotare',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c5.5-4 8-8 8-12a8 8 0 10-16 0c0 4 2.5 8 8 12z" /><path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Dati minimi',
    body: 'Niente tessera sanitaria o diagnosi in questa fase',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" />
      </svg>
    ),
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="app-shell">
      <div className="screen">
        <div style={{ display: 'flex', flexDirection: 'column', padding: '28px 24px 0 24px', gap: 40, flexGrow: 1 }}>
          <div className="brand-row">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h11" /><path d="M11 6l6 6-6 6" /><path d="M19 5v14" />
            </svg>
            <span className="brand-word">Corsia</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
            <h1 style={{ fontSize: 32, lineHeight: 1.15 }}>La prima visita disponibile. Pubblica o privata.</h1>
            <p style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--ink-soft)', maxWidth: 320 }}>
              Cerchiamo per te sul CUP pubblico e sulle strutture convenzionate della tua zona — tu non chiami in giro.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 8 }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div className="icon-tile" style={{ color: 'var(--navy)' }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{f.title}</div>
                  <div style={{ fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.4 }}>{f.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '20px 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-cta" onClick={() => navigate('/richiedi')}>
            Inizia la ricerca
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="M13 6l6 6-6 6" />
            </svg>
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/verifica')}>
            Hai già una ricetta? Verifica gratis i tuoi diritti
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="M13 6l6 6-6 6" />
            </svg>
          </button>
          <div style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-faint)' }}>Nessuna registrazione richiesta per iniziare</div>
        </div>
      </div>
    </div>
  )
}
