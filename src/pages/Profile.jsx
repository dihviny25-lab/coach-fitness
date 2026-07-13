import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { goalLabel } from '../lib/coach'

export default function Profile() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profile) setForm(profile)
  }, [profile])

  if (!form) return null

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name,
        sex: form.sex,
        birth_date: form.birth_date,
        height_cm: form.height_cm ? Number(form.height_cm) : null,
        goal: form.goal,
        experience_level: form.experience_level,
        weekly_frequency: form.weekly_frequency ? Number(form.weekly_frequency) : null,
        activity_level: form.activity_level,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
    setSaving(false)
    if (!error) {
      setSaved(true)
      refreshProfile()
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Perfil</h1>
        <button onClick={signOut} className="text-sm text-red-600">
          Sair da conta
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-3">
        <Field label="Nome">
          <input className="input" value={form.full_name || ''} onChange={(e) => update('full_name', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sexo biológico">
            <select className="input" value={form.sex || ''} onChange={(e) => update('sex', e.target.value)}>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>
          </Field>
          <Field label="Data de nascimento">
            <input type="date" className="input" value={form.birth_date || ''} onChange={(e) => update('birth_date', e.target.value)} />
          </Field>
        </div>
        <Field label="Altura (cm)">
          <input type="number" className="input" value={form.height_cm || ''} onChange={(e) => update('height_cm', e.target.value)} />
        </Field>
        <Field label="Objetivo principal">
          <select className="input" value={form.goal || ''} onChange={(e) => update('goal', e.target.value)}>
            <option value="emagrecimento">Emagrecimento</option>
            <option value="ganho_massa">Ganho de massa</option>
            <option value="forca">Força</option>
            <option value="recomposicao">Recomposição corporal</option>
            <option value="saude_geral">Saúde geral</option>
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nível">
            <select className="input" value={form.experience_level || ''} onChange={(e) => update('experience_level', e.target.value)}>
              <option value="iniciante">Iniciante</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
          </Field>
          <Field label="Treinos por semana">
            <input type="number" min="1" max="7" className="input" value={form.weekly_frequency || ''} onChange={(e) => update('weekly_frequency', e.target.value)} />
          </Field>
        </div>
        <Field label="Nível de atividade">
          <select className="input" value={form.activity_level || ''} onChange={(e) => update('activity_level', e.target.value)}>
            <option value="sedentario">Sedentário</option>
            <option value="leve">Leve</option>
            <option value="moderado">Moderado</option>
            <option value="ativo">Ativo</option>
            <option value="muito_ativo">Muito ativo</option>
          </select>
        </Field>

        <button className="btn-primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
        {saved && <p className="text-green-700 text-sm">Perfil atualizado.</p>}
      </form>

      <p className="text-xs text-neutral-400 text-center">
        Objetivo atual: {goalLabel(form.goal)} · {user.email}
      </p>
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
