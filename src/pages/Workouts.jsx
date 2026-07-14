import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dumbbell, Plus, Play, ListChecks, PlayCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { loadActivePlan } from '../lib/plan'
import { WEEKDAY_LABELS } from '../lib/planGenerator'

export default function Workouts() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [workouts, setWorkouts] = useState([])
  const [plan, setPlan] = useState(null)
  const [planLoading, setPlanLoading] = useState(true)
  const [startingDayId, setStartingDayId] = useState(null)
  const [expandedDay, setExpandedDay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [creating, setCreating] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('workouts')
      .select('id, date, name, notes, duration_min, workout_sets(id)')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    setWorkouts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    setPlanLoading(true)
    loadActivePlan(user.id)
      .then(setPlan)
      .finally(() => setPlanLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createWorkout(e) {
    e.preventDefault()
    setCreating(true)
    const { data, error } = await supabase
      .from('workouts')
      .insert({ user_id: user.id, name: name || 'Treino', date })
      .select()
      .single()
    setCreating(false)
    if (!error && data) {
      navigate(`/treinos/${data.id}`)
    }
  }

  async function startPlanDay(day) {
    setStartingDayId(day.id)
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('workouts')
      .insert({ user_id: user.id, name: day.name, date: today, plan_day_id: day.id })
      .select()
      .single()
    setStartingDayId(null)
    if (!error && data) {
      navigate(`/treinos/${data.id}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2">
          <Dumbbell className="text-brand-500" size={22} />
          Treinos
        </h1>
        <button className="btn-primary flex items-center gap-1.5" onClick={() => setShowForm((v) => !v)}>
          <Plus size={16} />
          Novo treino
        </button>
      </div>

      {!planLoading && plan && (
        <div className="card space-y-3">
          <div className="flex items-center gap-1.5">
            <ListChecks size={14} className="text-brand-400" />
            <div>
              <p className="section-label">Seu plano de treino</p>
              <p className="text-xs text-neutral-500">{plan.split_type}</p>
            </div>
          </div>
          <div className="space-y-2">
            {plan.workout_plan_days.map((day) => {
              const expanded = expandedDay === day.id
              return (
                <div key={day.id} className="border border-neutral-800 bg-neutral-950/60 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <button
                      type="button"
                      onClick={() => setExpandedDay(expanded ? null : day.id)}
                      className="flex items-center gap-1.5 text-left"
                    >
                      {expanded ? (
                        <ChevronUp size={14} className="text-neutral-500 shrink-0" />
                      ) : (
                        <ChevronDown size={14} className="text-neutral-500 shrink-0" />
                      )}
                      <p className="font-semibold text-white text-sm">
                        {day.name}
                        {day.weekday && <span className="text-neutral-500 font-normal"> · {WEEKDAY_LABELS[day.weekday]}</span>}
                      </p>
                    </button>
                    <button
                      className="btn-primary text-xs py-1 px-2 flex items-center gap-1 shrink-0"
                      disabled={startingDayId === day.id}
                      onClick={() => startPlanDay(day)}
                    >
                      <Play size={12} />
                      {startingDayId === day.id ? 'Criando...' : 'Iniciar'}
                    </button>
                  </div>

                  {expanded ? (
                    <div className="space-y-1.5 mt-2">
                      {day.workout_plan_exercises.map((pe) => (
                        <div key={pe.id} className="flex items-center justify-between text-xs">
                          <span className="text-neutral-300">
                            {pe.exercises?.name} <span className="text-neutral-500">· {pe.target_sets ?? '-'}x{pe.target_reps}</span>
                          </span>
                          {pe.exercises?.video_url && (
                            <a
                              href={pe.exercises.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 transition shrink-0"
                            >
                              <PlayCircle size={12} />
                              Ver vídeo
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                      {day.workout_plan_exercises.map((pe) => (
                        <span key={pe.id} className="text-xs text-neutral-500">
                          {pe.exercises?.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={createWorkout} className="card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Nome (ex: Peito e tríceps)" value={name} onChange={(e) => setName(e.target.value)} />
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <button className="btn-primary" disabled={creating}>
            {creating ? 'Criando...' : 'Criar e começar a registrar'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-neutral-500 text-sm">Carregando...</p>
      ) : workouts.length === 0 ? (
        <p className="text-neutral-500 text-sm">Nenhum treino registrado ainda.</p>
      ) : (
        <div className="space-y-2">
          {workouts.map((w) => (
            <Link key={w.id} to={`/treinos/${w.id}`} className="card flex items-center justify-between hover:border-brand-500 transition">
              <div>
                <p className="font-semibold text-white">{w.name || 'Treino'}</p>
                <p className="text-xs text-neutral-500">{new Date(w.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
              <span className="text-sm text-brand-400 font-semibold">{w.workout_sets?.length || 0} séries</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
