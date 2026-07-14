import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { goalLabel } from '../lib/coach'
import { createWorkoutPlan } from '../lib/plan'
import { EQUIPMENT_OPTIONS, WEEKDAY_LABELS, DIETARY_PATTERNS, SPLIT_PREFERENCES } from '../lib/planGenerator'

const WEEKDAY_KEYS = Object.keys(WEEKDAY_LABELS)

export default function Profile() {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [regenerated, setRegenerated] = useState(false)

  useEffect(() => {
    if (profile) {
      setForm({
        equipment_access: [],
        available_days: [],
        dietary_pattern: 'sem_restricao',
        meals_per_day: 4,
        training_location: 'academia',
        session_duration_min: 60,
        split_preference: 'automatico',
        ...profile,
      })
    }
  }, [profile])

  if (!form) return null

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
  }

  function toggleInArray(field, value) {
    setForm((f) => {
      const set = new Set(f[field] || [])
      if (set.has(value)) set.delete(value)
      else set.add(value)
      return { ...f, [field]: Array.from(set) }
    })
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
        dietary_pattern: form.dietary_pattern,
        dietary_notes: form.dietary_notes,
        meals_per_day: form.meals_per_day ? Number(form.meals_per_day) : null,
        training_location: form.training_location,
        equipment_access: form.equipment_access,
        available_days: form.available_days,
        session_duration_min: form.session_duration_min ? Number(form.session_duration_min) : null,
        split_preference: form.split_preference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
    setSaving(false)
    if (!error) {
      setSaved(true)
      refreshProfile()
    }
  }

  async function handleRegeneratePlan() {
    setRegenerating(true)
    setRegenerated(false)
    try {
      await createWorkoutPlan(user.id, {
        goal: form.goal,
        experienceLevel: form.experience_level,
        weeklyFrequency: form.weekly_frequency,
        equipmentAccess: form.equipment_access,
        availableDays: form.available_days,
        splitPreference: form.split_preference,
      })
      setRegenerated(true)
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Perfil</h1>
        <button onClick={signOut} className="text-sm text-red-400 hover:text-red-300 transition">
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

        <div className="border-t border-neutral-800 pt-3 mt-1">
          <p className="section-label mb-3">Alimentação</p>
          <div className="space-y-3">
            <Field label="Padrão alimentar">
              <select className="input" value={form.dietary_pattern || 'sem_restricao'} onChange={(e) => update('dietary_pattern', e.target.value)}>
                {Object.entries(DIETARY_PATTERNS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Refeições por dia">
              <input type="number" min="1" max="8" className="input" value={form.meals_per_day || ''} onChange={(e) => update('meals_per_day', e.target.value)} />
            </Field>
            <Field label="Restrições, alergias ou preferências">
              <textarea className="input" rows={3} value={form.dietary_notes || ''} onChange={(e) => update('dietary_notes', e.target.value)} />
            </Field>
          </div>
        </div>

        <div className="border-t border-neutral-800 pt-3 mt-1">
          <p className="section-label mb-3">Rotina de treino</p>
          <div className="space-y-3">
            <Field label="Onde você treina">
              <select className="input" value={form.training_location || 'academia'} onChange={(e) => update('training_location', e.target.value)}>
                <option value="academia">Academia</option>
                <option value="casa">Casa</option>
                <option value="ar_livre">Ar livre</option>
              </select>
            </Field>
            <Field label="Equipamentos disponíveis">
              <div className="flex flex-wrap gap-2">
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <Chip key={eq} active={(form.equipment_access || []).includes(eq)} onClick={() => toggleInArray('equipment_access', eq)}>
                    {eq}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Dias que você pode treinar">
              <div className="flex flex-wrap gap-2">
                {WEEKDAY_KEYS.map((day) => (
                  <Chip key={day} active={(form.available_days || []).includes(day)} onClick={() => toggleInArray('available_days', day)}>
                    {WEEKDAY_LABELS[day]}
                  </Chip>
                ))}
              </div>
            </Field>
            <Field label="Tempo disponível por treino (minutos)">
              <input
                type="number"
                min="15"
                max="180"
                step="5"
                className="input"
                value={form.session_duration_min || ''}
                onChange={(e) => update('session_duration_min', e.target.value)}
              />
            </Field>
            <Field label="Tipo de divisão do treino">
              <select className="input" value={form.split_preference || 'automatico'} onChange={(e) => update('split_preference', e.target.value)}>
                {Object.entries(SPLIT_PREFERENCES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <button className="btn-primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
        {saved && <p className="text-green-400 text-sm">Perfil atualizado.</p>}
      </form>

      <div className="card space-y-2">
        <p className="section-label">Plano de treino</p>
        <p className="text-xs text-neutral-500">
          Gera um novo treino a partir do seu objetivo, nível, dias disponíveis e equipamentos — substitui o plano atual (o histórico de treinos já registrados não é afetado).
        </p>
        <button type="button" className="btn-secondary" disabled={regenerating} onClick={handleRegeneratePlan}>
          {regenerating ? 'Gerando...' : 'Gerar novo plano de treino'}
        </button>
        {regenerated && <p className="text-green-400 text-sm">Novo plano gerado! Confira na aba Treino.</p>}
      </div>

      <p className="text-xs text-neutral-400 text-center">
        Objetivo atual: {goalLabel(form.goal)} · {user.email}
      </p>
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
        active ? 'bg-brand-500 text-white border-brand-500' : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-600'
      }`}
    >
      {children}
    </button>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-neutral-400 mb-1">{label}</span>
      {children}
    </label>
  )
}
