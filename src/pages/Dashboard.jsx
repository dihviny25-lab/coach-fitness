import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { calcTargets, goalLabel } from '../lib/coach'

function daysAgo(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((today - d) / (1000 * 60 * 60 * 24))
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [latestWeight, setLatestWeight] = useState(null)
  const [recentWorkouts, setRecentWorkouts] = useState([])
  const [todayCalories, setTodayCalories] = useState(0)
  const [weekWorkoutCount, setWeekWorkoutCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10)
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)

      const [{ data: m }, { data: w }, { data: logs }, { data: weekW }] = await Promise.all([
        supabase
          .from('body_measurements')
          .select('weight_kg, date')
          .eq('user_id', user.id)
          .not('weight_kg', 'is', null)
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('workouts').select('id, name, date').eq('user_id', user.id).order('date', { ascending: false }).limit(3),
        supabase.from('meal_logs').select('calories').eq('user_id', user.id).eq('date', today),
        supabase.from('workouts').select('id, date').eq('user_id', user.id).gte('date', weekAgo),
      ])

      setLatestWeight(m?.weight_kg ?? null)
      setRecentWorkouts(w || [])
      setTodayCalories((logs || []).reduce((sum, l) => sum + (l.calories || 0), 0))
      setWeekWorkoutCount((weekW || []).length)
      setLoading(false)
    }
    load()
  }, [user.id])

  const targets = useMemo(() => {
    if (!profile || !latestWeight) return null
    return calcTargets({
      sex: profile.sex,
      weightKg: latestWeight,
      heightCm: profile.height_cm,
      birthDate: profile.birth_date,
      activityLevel: profile.activity_level,
      goal: profile.goal,
    })
  }, [profile, latestWeight])

  const tips = useMemo(() => {
    const t = []
    const lastWorkout = recentWorkouts[0]
    if (!lastWorkout) {
      t.push('Você ainda não registrou nenhum treino. Que tal começar hoje?')
    } else {
      const gap = daysAgo(lastWorkout.date)
      if (gap >= 4) t.push(`Já se passaram ${gap} dias desde o último treino. Bora retomar?`)
    }
    if (profile?.weekly_frequency && weekWorkoutCount < profile.weekly_frequency && recentWorkouts.length > 0) {
      t.push(`Sua meta é ${profile.weekly_frequency}x/semana — você treinou ${weekWorkoutCount}x nos últimos 7 dias.`)
    }
    if (targets && todayCalories > 0) {
      const diff = todayCalories - targets.calories
      if (Math.abs(diff) > 300) {
        t.push(diff > 0 ? `Hoje você já passou ${Math.round(diff)} kcal da meta.` : `Ainda faltam ${Math.round(-diff)} kcal para bater sua meta de hoje.`)
      }
    }
    if (t.length === 0) t.push('Tudo em dia! Continue registrando para manter a consistência.')
    return t
  }, [recentWorkouts, weekWorkoutCount, profile, targets, todayCalories])

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-6 text-sm text-neutral-500">Carregando...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Olá, {profile?.full_name?.split(' ')[0] || 'tudo bem'}</h1>
        <p className="text-sm text-neutral-500">Objetivo: {goalLabel(profile?.goal)}</p>
      </div>

      <div className="card space-y-2">
        <p className="text-sm font-medium text-neutral-700">Coach</p>
        {tips.map((tip, i) => (
          <p key={i} className="text-sm text-neutral-600">
            • {tip}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-xs text-neutral-400">Peso atual</p>
          <p className="text-lg font-semibold text-neutral-900">{latestWeight ? `${latestWeight} kg` : '—'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-neutral-400">Calorias hoje</p>
          <p className="text-lg font-semibold text-neutral-900">
            {Math.round(todayCalories)}
            {targets ? ` / ${targets.calories}` : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Link to="/treinos" className="card text-center text-sm font-medium hover:border-neutral-400">
          Registrar treino
        </Link>
        <Link to="/medidas" className="card text-center text-sm font-medium hover:border-neutral-400">
          Registrar medida
        </Link>
        <Link to="/nutricao" className="card text-center text-sm font-medium hover:border-neutral-400">
          Registrar refeição
        </Link>
      </div>

      <div className="card">
        <p className="text-sm font-medium text-neutral-700 mb-2">Últimos treinos</p>
        {recentWorkouts.length === 0 ? (
          <p className="text-xs text-neutral-400">Nenhum treino ainda.</p>
        ) : (
          <div className="space-y-1">
            {recentWorkouts.map((w) => (
              <Link key={w.id} to={`/treinos/${w.id}`} className="flex justify-between text-sm text-neutral-600 hover:text-neutral-900">
                <span>{w.name || 'Treino'}</span>
                <span className="text-neutral-400">{new Date(w.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
