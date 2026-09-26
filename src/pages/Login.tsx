import { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate('/staff/pipeline', { replace: true })
      } else {
        setChecking(false)
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) navigate('/staff/pipeline', { replace: true })
    })
    return () => sub.subscription.unsubscribe()
  }, [navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/staff/pipeline' },
    })
    setLoading(false)
    if (otpError) {
      setError('Non è stato possibile inviare il link di accesso. Riprova.')
      return
    }
    setSent(true)
  }

  if (checking) {
    return (
      <div className="wrap" style={{ paddingTop: 80 }}>
        <p className="mono" style={{ color: 'var(--ink-faint)', textAlign: 'center' }}>Verifica sessione…</p>
      </div>
    )
  }

  return (
    <div className="wrap" style={{ paddingTop: 64, paddingBottom: 64 }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <span className="eyebrow">Area operatori</span>
      </div>
      <div className="card">
        {sent ? (
          <div className="success-box">
            <h1 style={{ fontSize: 22, marginBottom: 12 }}>Controlla la tua email</h1>
            <p style={{ color: 'var(--ink-soft)', fontSize: 14.5 }}>
              Abbiamo inviato un link di accesso a <strong>{email}</strong>. Aprilo per entrare nella pipeline.
            </p>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: 26, marginBottom: 22 }}>Accedi a Corsia</h1>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  placeholder="nome@corsia.it"
                />
                <span className="hint">Ti mandiamo un link di accesso, niente password da ricordare.</span>
              </div>
              {error && <p className="error-text" style={{ marginBottom: 14 }}>{error}</p>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Invio in corso…' : 'Invia link di accesso'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
