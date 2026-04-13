'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', width: '360px', boxShadow: '0 4px 24px #0001' }}>
        <h1 style={{ margin: '0 0 1.5rem', fontSize: '1.5rem', textAlign: 'center' }}>
          ⏱ TimeTracker
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ flex: 1, padding: '0.5rem', border: 'none', borderRadius: '6px',
                background: mode === m ? '#6366f1' : '#f1f5f9',
                color: mode === m ? '#fff' : '#334155', fontWeight: 600 }}>
              {m === 'login' ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '1rem' }} />
          <input type="password" placeholder="Mot de passe" value={password}
            onChange={e => setPassword(e.target.value)} required
            style={{ padding: '0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '1rem' }} />
          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ padding: '0.75rem', background: '#6366f1', color: '#fff', border: 'none',
              borderRadius: '6px', fontSize: '1rem', fontWeight: 600 }}>
            {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer un compte'}
          </button>
        </form>
      </div>
    </div>
  )
}
