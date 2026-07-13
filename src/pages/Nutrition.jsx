import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { calcTargets } from '../lib/coach'

const MEAL_LABELS = { cafe: 'Café da manhã', almoco: 'Almoço', jantar: 'Jantar', lanche: 'Lanche' }

export default function Nutrition() {
  const { user, profile } = useAuth()
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [logs, setLogs] = useState([])
  const [foods, setFoods] = useState([])
  const [latestWeight, setLatestWeight] = useState(null)
  const [foodId, setFoodId] = useState('')
  const [quantity, setQuantity] = useState('100')
  const [mealType, setMealType] = useState('cafe')
  const [saving, setSaving] = useState(false)
  const [customName, setCustomName] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [customCalories, setCustomCalories] = useState('')

  async function load() {
    const { data: l } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .order('created_at', { ascending: true })
    setLogs(l || [])

    if (foods.length === 0) {
      const { data: f } = await supabase.from('foods').select('*').order('name')
      setFoods(f || [])
    }

    const { data: m } = await supabase
      .from('body_measurements')
      .select('weight_kg, date')
      .eq('user_id', user.id)
      .not('weight_kg', 'is', null)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()
    setLatestWeight(m?.weight_kg ?? null)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

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

  const totals = useMemo(() => {
    return logs.reduce(
      (acc, l) => {
        acc.calories += l.calories || 0
        acc.protein += l.protein_g || 0
        acc.carbs += l.carbs_g || 0
        acc.fat += l.fat_g || 0
        return acc
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }, [logs])

  async function addLog(e) {
    e.preventDefault()
    setSaving(true)
    let payload
    if (useCustom) {
      payload = {
        user_id: user.id,
        date,
        meal_type: mealType,
        food_name: customName || 'Alimento',
        quantity_g: 1,
        calories: Number(customCalories) || 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
      }
    } else {
      const food = foods.find((f) => f.id === foodId)
      if (!food) {
        setSaving(false)
        return
      }
      const factor = Number(quantity) / 100
      payload = {
        user_id: user.id,
        date,
        meal_type: mealType,
        food_id: food.id,
        food_name: food.name,
        quantity_g: Number(quantity),
        calories: Math.round(food.calories_per_100g * factor),
        protein_g: Math.round(food.protein_g * factor * 10) / 10,
        carbs_g: Math.round(food.carbs_g * factor * 10) / 10,
        fat_g: Math.round(food.fat_g * factor * 10) / 10,
      }
    }
    const { error } = await supabase.from('meal_logs').insert(payload)
    setSaving(false)
    if (!error) {
      setFoodId('')
      setQuantity('100')
      setCustomName('')
      setCustomCalories('')
      load()
    }
  }

  async function removeLog(id) {
    await supabase.from('meal_logs').delete().eq('id', id)
    load()
  }

  const grouped = useMemo(() => {
    const map = { cafe: [], almoco: [], jantar: [], lanche: [] }
    for (const l of logs) {
      if (map[l.meal_type]) map[l.meal_type].push(l)
    }
    return map
  }, [logs])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-neutral-900">Nutrição</h1>
        <input type="date" className="input w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {targets ? (
        <div className="card grid grid-cols-4 gap-2 text-center">
          <Stat label="Calorias" value={`${Math.round(totals.calories)}/${targets.calories}`} />
          <Stat label="Proteína" value={`${Math.round(totals.protein)}g`} sub={`meta ${targets.proteinG}g`} />
          <Stat label="Carbo" value={`${Math.round(totals.carbs)}g`} sub={`meta ${targets.carbsG}g`} />
          <Stat label="Gordura" value={`${Math.round(totals.fat)}g`} sub={`meta ${targets.fatG}g`} />
        </div>
      ) : (
        <div className="card text-sm text-neutral-500">
          Complete seu perfil e registre um peso em Medidas para calcular suas metas de calorias e macros automaticamente.
        </div>
      )}

      <form onSubmit={addLog} className="card space-y-3">
        <p className="text-sm font-medium text-neutral-700">Adicionar alimento</p>
        <select className="input" value={mealType} onChange={(e) => setMealType(e.target.value)}>
          {Object.entries(MEAL_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <button type="button" className={!useCustom ? 'font-semibold text-neutral-900' : ''} onClick={() => setUseCustom(false)}>
            Da lista
          </button>
          <span>·</span>
          <button type="button" className={useCustom ? 'font-semibold text-neutral-900' : ''} onClick={() => setUseCustom(true)}>
            Alimento livre (só calorias)
          </button>
        </div>

        {useCustom ? (
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Nome do alimento" value={customName} onChange={(e) => setCustomName(e.target.value)} />
            <input className="input" type="number" placeholder="Calorias totais" value={customCalories} onChange={(e) => setCustomCalories(e.target.value)} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <select className="input col-span-2" value={foodId} onChange={(e) => setFoodId(e.target.value)} required={!useCustom}>
              <option value="">Selecione o alimento</option>
              {foods.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <input className="input" type="number" placeholder="gramas" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
        )}

        <button className="btn-primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Adicionar'}
        </button>
      </form>

      {Object.entries(MEAL_LABELS).map(([key, label]) => (
        <div key={key} className="card">
          <p className="font-medium text-neutral-900 mb-2">{label}</p>
          {grouped[key].length === 0 ? (
            <p className="text-xs text-neutral-400">Nada registrado</p>
          ) : (
            <div className="space-y-1">
              {grouped[key].map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm text-neutral-600">
                  <span>
                    {l.food_name} {l.quantity_g > 1 ? `(${l.quantity_g}g)` : ''} — {l.calories} kcal
                  </span>
                  <button onClick={() => removeLog(l.id)} className="text-xs text-red-500">
                    remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Stat({ label, value, sub }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="text-sm font-semibold text-neutral-900">{value}</p>
      {sub && <p className="text-[10px] text-neutral-400">{sub}</p>}
    </div>
  )
}
