import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-1 text-neutral-900">Coach Fitness</h1>
        <p className="text-center text-neutral-500 mb-6 text-sm">Treino, medidas e nutrição em um só lugar</p>

        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <div className="flex mb-6 rounded-lg bg-neutral-100 p-1 text-sm font-medium">
            <button
              className={`flex-1 py-1.5 rounded-md transition ${mode === 'login' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500'}`}
              onClick={() => setMode('login')}
              type="button"
            >
              Entrar
            </button>
            <button
              className={`flex-1 py-1.5 rounded-md transition ${mode === 'signup' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500'}`}
              onClick={() => setMode('signup')}
              type="button"
            >
              Criar conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input
                className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                placeholder="Seu nome"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}
            <input
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              placeholder="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            {error && <p className="text-red-600 text-sm">{error}</p>}
            {info && <p className="text-green-700 text-sm">{info}</p>}

            <button
              className="w-full bg-neutral-900 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
              disabled={loading}
              type="submit"
            >
              {loading ? 'Aguarde...' : mode === 'signup' ? 'Criar conta' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
