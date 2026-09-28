import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ClasseRAO } from '../lib/types'

const CLASSES: { id: ClasseRAO; desc: string; days: number }[] = [
  { id: 'U', desc: 'Urgente — entro 72 ore', days: 3 },
  { id: 'B', desc: 'Breve — entro 10 giorni', days: 10 },
  { id: 'D', desc: 'Differibile — entro 60 giorni', days: 60 },
  { id: 'P', desc: 'Programmabile — entro 120 giorni', days: 120 },
]

function BackIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export default function Verifica() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<ClasseRAO>('B')
  const [emissione, setEmissione] = useState('')

  const selectedClass = CLASSES.find((c) => c.id === selectedId)!

  const result = useMemo(() => {
    if (!emissione) return null
    try {
      const emissioneDate = new Date(emissione + 'T00:00:00')
      const deadline = new Date(emissioneDate.getTime() + selectedClass.days * 24 * 60 * 60 * 1000)
      const today = new Date()
      const exceeded = today.getTime() > deadline.getTime()
      const diffDays = Math.abs(Math.round((today.getTime() - deadline.getTime()) / (24 * 60 * 60 * 1000)))
      const deadlineStr = deadline.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
      return { exceeded, diffDays, deadlineStr }
    } catch {
      return null
    }
  }, [emissione, selectedClass])

  function goToRichiesta() {
    const params = new URLSearchParams({ classe: selectedId, data: emissione })
    navigate(`/richiedi?${params.toString()}`)
  }

  return (
    <div className="app-shell">
      <div className="screen">
        <div className="topbar">
          <button className="back-btn" onClick={() => navigate('/')} aria-label="Indietro"><BackIcon /></button>
          <div className="topbar-title">Verifica i tuoi diritti</div>
        </div>
        <div style={{ padding: '6px 24px 18px 24px', fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
          Gratis, senza registrazione. Bastano due informazioni dalla tua ricetta — non chiediamo altro.
        </div>

        <div className="step-body">
          <div className="field">
            <label>Classe di priorità (sulla ricetta, in un cerchietto rosso)</label>
            <div className="option-list">
              {CLASSES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`option-row ${selectedId === c.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(c.id)}
                >
                  <span className="option-badge">{c.id}</span>
                  <span style={{ flexGrow: 1, textAlign: 'left' }}>{c.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Data di emissione della ricetta</label>
            <input type="date" value={emissione} onChange={(e) => setEmissione(e.target.value)} />
          </div>

          {result && (
            <div className={`result-card ${result.exceeded ? 'warn' : 'ok'}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={result.exceeded ? 'var(--accent-text)' : 'var(--success-text)'} strokeWidth={2.3} strokeLinecap="round" strokeLinejoin="round">
                  {result.exceeded ? (
                    <><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></>
                  ) : (
                    <path d="M20 6L9 17l-5-5" />
                  )}
                </svg>
                <div className="result-title">
                  {result.exceeded ? `Termine di legge superato di ${result.diffDays} giorni` : `Sei nei tempi di legge (${result.diffDays} giorni rimanenti)`}
                </div>
              </div>
              <p>
                {result.exceeded
                  ? `Scadenza per la classe ${selectedId}: ${result.deadlineStr}. Hai diritto al percorso di tutela — puoi essere indirizzato a un'altra struttura, pubblica o convenzionata, a prezzo di ticket.`
                  : `Scadenza per la classe ${selectedId}: ${result.deadlineStr}. Nel frattempo possiamo comunque cercarti un appuntamento più vicino.`}
              </p>
            </div>
          )}
        </div>

        <div className="step-footer">
          <button className="btn btn-primary" onClick={goToRichiesta} disabled={!emissione}>
            {result?.exceeded ? 'Attiva il percorso di tutela' : 'Cerca comunque un posto più vicino'}
          </button>
        </div>
      </div>
    </div>
  )
}
