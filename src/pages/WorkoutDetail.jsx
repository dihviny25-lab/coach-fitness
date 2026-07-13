import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function WorkoutDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState(null)
  const [sets, setSets] = useState([])
  const [exercises, setExercises] = useState([])
  const [planExercises, setPlanExercises] = useState([])
  const [exerciseId, setExerciseId] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [rpe, setRpe] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data: w } = await supabase.from('workouts').select('*').eq('id', id).single()
    setWorkout(w)
    const { data: s } = await supabase
      .from('workout_sets')
      .select('*, exercises(name, muscle_group)')
      .eq('workout_id', id)
      .order('created_at', { ascending: true })
    setSets(s || [])
    if (exercises.length === 0) {
      const { data: ex } = await supabase.from('exercises').select('id, name, muscle_group').order('name')
      setExercises(ex || [])
    }
    if (w?.plan_day_id) {
      const { data: pe } = await supabase
        .from('workout_plan_exercises')
        .select('*, exercises(name, muscle_group)')
        .eq('plan_day_id', w.plan_day_id)
        .order('order_index', { ascending: true })
      setPlanExercises(pe || [])
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const s of sets) {
      const label = s.exercises?.name || s.exercise_name || 'Exercício'
      if (!map.has(label)) map.set(label, [])
      map.get(label).push(s)
    }
    return Array.from(map.entries())
  }, [sets])

  async function addSet(e) {
    e.preventDefault()
    if (!exerciseId) return
    setSaving(true)
    const ex = exercises.find((x) => x.id === exerciseId)
    const countForExercise = sets.filter((s) => s.exercise_id === exerciseId).length
    const { error } = await supabase.from('workout_sets').insert({
      workout_id: id,
      exercise_id: exerciseId,
      exercise_name: ex?.name,
      set_number: countForExercise + 1,
      reps: reps ? Number(reps) : null,
      weight_kg: weight ? Number(weight) : null,
      rpe: rpe ? Number(rpe) : null,
    })
    setSaving(false)
    if (!error) {
      setReps('')
      setWeight('')
      setRpe('')
      load()
    }
  }

  async function removeSet(setId) {
    await supabase.from('workout_sets').delete().eq('id', setId)
    load()
  }

  async function deleteWorkout() {
    if (!confirm('Excluir este treino e todas as séries registradas?')) return
    await supabase.from('workouts').delete().eq('id', id)
    navigate('/treinos')
  }

  if (!workout) return <div className="max-w-2xl mx-auto px-4 py-6 text-sm text-neutral-500">Carregando...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{workout.name || 'Treino'}</h1>
          <p className="text-xs text-neutral-500">{new Date(workout.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
        </div>
        <button onClick={deleteWorkout} className="text-xs text-red-600">
          Excluir treino
        </button>
      </div>

      {planExercises.length > 0 && (
        <div className="card space-y-2">
          <p className="text-sm font-medium text-neutral-700">Sugestão do plano</p>
          <div className="flex flex-wrap gap-2">
            {planExercises.map((pe) => {
              const done = sets.filter((s) => s.exercise_id === pe.exercise_id).length
              const complete = pe.target_sets && done >= pe.target_sets
              return (
                <button
                  key={pe.id}
                  type="button"
                  onClick={() => setExerciseId(pe.exercise_id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    complete
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : exerciseId === pe.exercise_id
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : 'bg-white text-neutral-600 border-neutral-300 hover:border-neutral-400'
                  }`}
                >
                  {pe.exercises?.name} · {done}/{pe.target_sets ?? '-'} × {pe.target_reps}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <form onSubmit={addSet} className="card space-y-3">
        <p className="text-sm font-medium text-neutral-700">Registrar série</p>
        <select className="input" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)} required>
          <option value="">Selecione o exercício</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name} {ex.muscle_group ? `(${ex.muscle_group})` : ''}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-3 gap-3">
          <input className="input" type="number" placeholder="Reps" value={reps} onChange={(e) => setReps(e.target.value)} />
          <input className="input" type="number" step="0.5" placeholder="Carga (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
          <input className="input" type="number" step="0.5" min="1" max="10" placeholder="RPE" value={rpe} onChange={(e) => setRpe(e.target.value)} />
        </div>
        <button className="btn-primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Adicionar série'}
        </button>
      </form>

      <div className="space-y-3">
        {grouped.length === 0 && <p className="text-sm text-neutral-500">Nenhuma série registrada ainda.</p>}
        {grouped.map(([label, groupSets]) => (
          <div key={label} className="card">
            <p className="font-medium text-neutral-900 mb-2">{label}</p>
            <div className="space-y-1">
              {groupSets.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm text-neutral-600">
                  <span>
                    Série {s.set_number}: {s.reps ?? '-'} reps × {s.weight_kg ?? '-'} kg {s.rpe ? `· RPE ${s.rpe}` : ''}
                  </span>
                  <button onClick={() => removeSet(s.id)} className="text-xs text-red-500">
                    remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
