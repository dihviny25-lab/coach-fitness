import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { createWorkoutPlan } from '../lib/plan'
import { EQUIPMENT_OPTIONS, WEEKDAY_LABELS, DIETARY_PATTERNS, SPLIT_PREFERENCES } from '../lib/planGenerator'

const WEEKDAY_KEYS = Object.keys(WEEKDAY_LABELS)

export default function Onboarding() {
  const { user, refreshProfile } = useAuth()
  const [step, setStep] = useState(1)
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
    dietary_pattern: 'sem_restricao',
    dietary_notes: '',
    meals_per_day: 4,
    training_location: 'academia',
    equipment_access: [...EQUIPMENT_OPTIONS],
    available_days: ['seg', 'qua', 'sex'],
    session_duration_min: 60,
    split_preference: 'automatico',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleInArray(field, value) {
    setForm((f) => {
      const set = new Set(f[field])
      if (set.has(value)) set.delete(value)
      else set.add(value)
      return { ...f, [field]: Array.from(set) }
    })
  }

  function nextStep(e) {
    e.preventDefault()
    setError('')
    setStep((s) => s + 1)
  }

  function prevStep() {
    setError('')
    setStep((s) => s - 1)
  }

  async function handleFinish(e) {
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
          dietary_pattern: form.dietary_pattern,
          dietary_notes: form.dietary_notes,
          meals_per_day: Number(form.meals_per_day),
          training_location: form.training_location,
          equipment_access: form.equipment_access,
          available_days: form.available_days,
          session_duration_min: Number(form.session_duration_min),
          split_preference: form.split_preference,
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

      await createWorkoutPlan(user.id, {
        goal: form.goal,
        experienceLevel: form.experience_level,
        weeklyFrequency: form.weekly_frequency,
        equipmentAccess: form.equipment_access,
        availableDays: form.available_days,
        splitPreference: form.split_preference,
      })

      await refreshProfile()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8">
      <div className="max-w-md mx-auto card">
        <div className="flex items-center gap-1 mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-brand-500' : 'bg-neutral-800'}`} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h1 className="text-xl font-extrabold mb-1 text-white uppercase tracking-tight">Vamos te conhecer</h1>
            <p className="text-sm text-neutral-500 mb-6">Isso ajuda a calcular suas metas de treino e nutrição.</p>
            <form onSubmit={nextStep} className="space-y-4">
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
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button className="btn-primary w-full">Próximo: alimentação</button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-xl font-extrabold mb-1 text-white uppercase tracking-tight">Sua alimentação</h1>
            <p className="text-sm text-neutral-500 mb-6">Isso ajuda a personalizar as sugestões de nutrição.</p>
            <form onSubmit={nextStep} className="space-y-4">
              <Field label="Padrão alimentar">
                <select className="input" value={form.dietary_pattern} onChange={(e) => update('dietary_pattern', e.target.value)}>
                  {Object.entries(DIETARY_PATTERNS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Refeições por dia">
                <input type="number" min="1" max="8" className="input" value={form.meals_per_day} onChange={(e) => update('meals_per_day', e.target.value)} />
              </Field>
              <Field label="Restrições, alergias ou preferências (opcional)">
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Ex: intolerância a lactose, não gosto de peixe..."
                  value={form.dietary_notes}
                  onChange={(e) => update('dietary_notes', e.target.value)}
                />
              </Field>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={prevStep} className="btn-secondary flex-1">
                  Voltar
                </button>
                <button className="btn-primary flex-1">Próximo: rotina</button>
              </div>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-xl font-extrabold mb-1 text-white uppercase tracking-tight">Sua rotina de treino</h1>
            <p className="text-sm text-neutral-500 mb-6">Com isso a gente já monta seu treino automaticamente.</p>
            <form onSubmit={handleFinish} className="space-y-4">
              <Field label="Onde você treina">
                <select
                  className="input"
                  value={form.training_location}
                  onChange={(e) => {
                    const loc = e.target.value
                    update('training_location', loc)
                    if (loc === 'academia') update('equipment_access', [...EQUIPMENT_OPTIONS])
                    else update('equipment_access', ['Peso corporal'])
                  }}
                >
                  <option value="academia">Academia</option>
                  <option value="casa">Casa</option>
                  <option value="ar_livre">Ar livre</option>
                </select>
              </Field>

              <Field label="Equipamentos disponíveis">
                <div className="flex flex-wrap gap-2">
                  {EQUIPMENT_OPTIONS.map((eq) => (
                    <Chip key={eq} active={form.equipment_access.includes(eq)} onClick={() => toggleInArray('equipment_access', eq)}>
                      {eq}
                    </Chip>
                  ))}
                </div>
              </Field>

              <Field label="Dias que você pode treinar">
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_KEYS.map((day) => (
                    <Chip key={day} active={form.available_days.includes(day)} onClick={() => toggleInArray('available_days', day)}>
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
                  value={form.session_duration_min}
                  onChange={(e) => update('session_duration_min', e.target.value)}
                />
              </Field>

              <Field label="Tipo de divisão do treino">
                <select className="input" value={form.split_preference} onChange={(e) => update('split_preference', e.target.value)}>
                  {Object.entries(SPLIT_PREFERENCES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                {form.split_preference === 'full_body' && (
                  <p className="text-xs text-neutral-500 mt-1">Todo treino trabalha o corpo inteiro, com pequenas variações de exercícios entre os dias.</p>
                )}
              </Field>

              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={prevStep} className="btn-secondary flex-1" disabled={loading}>
                  Voltar
                </button>
                <button className="btn-primary flex-1" disabled={loading}>
                  {loading ? 'Montando seu treino...' : 'Criar meu treino'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
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
