import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Scale, Utensils, Dumbbell, Ruler, Apple } from 'lucide-react'
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
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Olá, {profile?.full_name?.split(' ')[0] || 'tudo bem'}</h1>
        <p className="text-sm text-brand-400 font-medium">Objetivo: {goalLabel(profile?.goal)}</p>
      </div>

      <div className="card space-y-2 border-brand-950 bg-gradient-to-br from-neutral-900 to-brand-950/40">
        <p className="section-label flex items-center gap-1.5">
          <Flame size={14} className="text-brand-400" />
          Coach
        </p>
        {tips.map((tip, i) => (
          <p key={i} className="text-sm text-neutral-300">
            • {tip}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-xs text-neutral-500 flex items-center gap-1.5 mb-1">
            <Scale size={14} />
            Peso atual
          </p>
          <p className="text-2xl font-extrabold text-white">{latestWeight ? `${latestWeight} kg` : '—'}</p>
        </div>
        <div className="card">
          <p className="text-xs text-neutral-500 flex items-center gap-1.5 mb-1">
            <Utensils size={14} />
            Calorias hoje
          </p>
          <p className="text-2xl font-extrabold text-white">
            {Math.round(todayCalories)}
            {targets ? <span className="text-sm text-neutral-500 font-medium"> / {targets.calories}</span> : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Link to="/treinos" className="card flex flex-col items-center gap-1.5 text-center text-xs font-semibold text-neutral-200 hover:border-brand-500 transition py-4">
          <Dumbbell size={20} className="text-brand-400" />
          Treino
        </Link>
        <Link to="/medidas" className="card flex flex-col items-center gap-1.5 text-center text-xs font-semibold text-neutral-200 hover:border-brand-500 transition py-4">
          <Ruler size={20} className="text-brand-400" />
          Medida
        </Link>
        <Link to="/nutricao" className="card flex flex-col items-center gap-1.5 text-center text-xs font-semibold text-neutral-200 hover:border-brand-500 transition py-4">
          <Apple size={20} className="text-brand-400" />
          Refeição
        </Link>
      </div>

      <div className="card">
        <p className="section-label mb-2">Últimos treinos</p>
        {recentWorkouts.length === 0 ? (
          <p className="text-xs text-neutral-500">Nenhum treino ainda.</p>
        ) : (
          <div className="space-y-1">
            {recentWorkouts.map((w) => (
              <Link key={w.id} to={`/treinos/${w.id}`} className="flex justify-between text-sm text-neutral-300 hover:text-white transition py-1">
                <span className="font-medium">{w.name || 'Treino'}</span>
                <span className="text-neutral-500">{new Date(w.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
