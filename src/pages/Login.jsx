import { useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error
        setInfo('Conta criada! Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada. Caso contrário, você já pode entrar.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (err) {
      setError(err.message || 'Algo deu errado.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setError('')
    setGoogleLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + window.location.pathname },
      })
      if (error) throw error
      // o navegador é redirecionado ao Google; nada mais a fazer aqui
    } catch (err) {
      setError(err.message || 'Não foi possível iniciar o login com Google.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-950/60">
            <Dumbbell size={28} className="text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-center mb-1 text-white uppercase tracking-tight">Coach Fitness</h1>
        <p className="text-center text-neutral-500 mb-6 text-sm">Treino, medidas e nutrição em um só lugar</p>

        <div className="card">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2 border border-neutral-800 rounded-lg py-2 text-sm font-medium text-neutral-200 bg-neutral-950 hover:bg-neutral-800 disabled:opacity-50 mb-4 transition"
          >
            <GoogleIcon />
            {googleLoading ? 'Redirecionando...' : 'Continuar com Google'}
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-neutral-800" />
            <span className="text-xs text-neutral-500">ou</span>
            <div className="h-px flex-1 bg-neutral-800" />
          </div>

          <div className="flex mb-6 rounded-lg bg-neutral-950 border border-neutral-800 p-1 text-sm font-medium">
            <button
              className={`flex-1 py-1.5 rounded-md transition ${mode === 'login' ? 'bg-brand-500 text-white' : 'text-neutral-500'}`}
              onClick={() => setMode('login')}
              type="button"
            >
              Entrar
            </button>
            <button
              className={`flex-1 py-1.5 rounded-md transition ${mode === 'signup' ? 'bg-brand-500 text-white' : 'text-neutral-500'}`}
              onClick={() => setMode('signup')}
              type="button"
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input className="input" placeholder="Seu nome" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            )}
            <input className="input" placeholder="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input
              className="input"
              placeholder="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {info && <p className="text-green-400 text-sm">{info}</p>}

            <button className="btn-primary w-full" disabled={loading} type="submit">
              {loading ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.5c-2 1.5-4.6 2.5-7.5 2.5-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.5 5.5C40.5 36.9 44 31 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  )
}
