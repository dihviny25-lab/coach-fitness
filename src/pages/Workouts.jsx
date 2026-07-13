import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function Workouts() {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState([])
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
      window.location.href = `/treinos/${data.id}`
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Treinos</h1>
        <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
          + Novo treino
        </button>
      </div>

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
            <Link
              key={w.id}
              to={`/treinos/${w.id}`}
              className="card flex items-center justify-between hover:border-neutral-400 transition"
            >
              <div>
                <p className="font-medium text-neutral-900">{w.name || 'Treino'}</p>
                <p className="text-xs text-neutral-500">{new Date(w.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
              <span className="text-sm text-neutral-500">{w.workout_sets?.length || 0} séries</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
