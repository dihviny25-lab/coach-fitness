import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const [form, setForm] = useState({
    full_name: '',
    sex: 'masculino',
    birth_date: '',
    height_cm: '',
    weight_kg: '',
    goal: 'emagrecimento',
    experience_level: 'iniciante',
    weekly_frequency: 3,
    activity_level: 'leve',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          sex: form.sex,
          birth_date: form.birth_date,
          height_cm: Number(form.height_cm),
          goal: form.goal,
          experience_level: form.experience_level,
          weekly_frequency: Number(form.weekly_frequency),
          activity_level: form.activity_level,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
      if (profileError) throw profileError

      if (form.weight_kg) {
        const { error: mErr } = await supabase.from('body_measurements').insert({
          user_id: user.id,
          weight_kg: Number(form.weight_kg),
        })
        if (mErr) throw mErr
      }

      await refreshProfile()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="max-w-md mx-auto bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-xl font-bold mb-1 text-neutral-900">Vamos te conhecer</h1>
        <p className="text-sm text-neutral-500 mb-6">Isso ajuda a calcular suas metas de treino e nutrição.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Nome">
            <input className="input" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} required />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Sexo biológico">
              <select className="input" value={form.sex} onChange={(e) => update('sex', e.target.value)}>
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </Field>
            <Field label="Data de nascimento">
              <input type="date" className="input" value={form.birth_date} onChange={(e) => update('birth_date', e.target.value)} required />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Altura (cm)">
              <input type="number" className="input" value={form.height_cm} onChange={(e) => update('height_cm', e.target.value)} required />
            </Field>
            <Field label="Peso atual (kg)">
              <input type="number" step="0.1" className="input" value={form.weight_kg} onChange={(e) => update('weight_kg', e.target.value)} required />
            </Field>
          </div>

          <Field label="Objetivo principal">
            <select className="input" value={form.goal} onChange={(e) => update('goal', e.target.value)}>
              <option value="emagrecimento">Emagrecimento</option>
              <option value="ganho_massa">Ganho de massa</option>
              <option value="forca">Força</option>
              <option value="recomposicao">Recomposição corporal</option>
              <option value="saude_geral">Saúde geral</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Nível">
              <select className="input" value={form.experience_level} onChange={(e) => update('experience_level', e.target.value)}>
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
              </select>
            </Field>
            <Field label="Treinos por semana">
              <input type="number" min="1" max="7" className="input" value={form.weekly_frequency} onChange={(e) => update('weekly_frequency', e.target.value)} />
            </Field>
          </div>

          <Field label="Nível de atividade no dia a dia">
            <select className="input" value={form.activity_level} onChange={(e) => update('activity_level', e.target.value)}>
              <option value="sedentario">Sedentário (trabalho parado)</option>
              <option value="leve">Leve (em pé às vezes)</option>
              <option value="moderado">Moderado</option>
              <option value="ativo">Ativo</option>
              <option value="muito_ativo">Muito ativo</option>
            </select>
          </Field>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button className="w-full bg-neutral-900 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50" disabled={loading}>
            {loading ? 'Salvando...' : 'Começar'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-neutral-600 mb-1">{label}</span>
      {children}
    </label>
  )
}
