import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  weight_kg: '',
  body_fat_pct: '',
  waist_cm: '',
  hip_cm: '',
  chest_cm: '',
  arm_cm: '',
  thigh_cm: '',
}

export default function Measurements() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
    setRows(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = { user_id: user.id, date: form.date }
    for (const key of ['weight_kg', 'body_fat_pct', 'waist_cm', 'hip_cm', 'chest_cm', 'arm_cm', 'thigh_cm']) {
      if (form[key] !== '') payload[key] = Number(form[key])
    }
    const { error } = await supabase.from('body_measurements').insert(payload)
    setSaving(false)
    if (!error) {
      setForm(emptyForm)
      load()
    }
  }

  const chartData = rows
    .filter((r) => r.weight_kg != null)
    .map((r) => ({ date: new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), peso: r.weight_kg }))

  const latest = rows[rows.length - 1]
  const first = rows[0]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold text-neutral-900">Medidas</h1>

      {latest && first && rows.length > 1 && (
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500">Peso atual</p>
            <p className="text-lg font-semibold text-neutral-900">{latest.weight_kg ?? '-'} kg</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Variação total</p>
            <p className={`text-lg font-semibold ${latest.weight_kg - first.weight_kg <= 0 ? 'text-green-600' : 'text-orange-600'}`}>
              {(latest.weight_kg - first.weight_kg).toFixed(1)} kg
            </p>
          </div>
        </div>
      )}

      {chartData.length > 1 && (
        <div className="card">
          <p className="text-sm font-medium text-neutral-700 mb-2">Evolução do peso</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} width={35} />
              <Tooltip />
              <Line type="monotone" dataKey="peso" stroke="#171717" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-3">
        <p className="text-sm font-medium text-neutral-700">Nova medição</p>
        <input type="date" className="input" value={form.date} onChange={(e) => update('date', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className="input" type="number" step="0.1" placeholder="Peso (kg)" value={form.weight_kg} onChange={(e) => update('weight_kg', e.target.value)} />
          <input className="input" type="number" step="0.1" placeholder="% gordura (opcional)" value={form.body_fat_pct} onChange={(e) => update('body_fat_pct', e.target.value)} />
          <input className="input" type="number" step="0.5" placeholder="Cintura (cm)" value={form.waist_cm} onChange={(e) => update('waist_cm', e.target.value)} />
          <input className="input" type="number" step="0.5" placeholder="Quadril (cm)" value={form.hip_cm} onChange={(e) => update('hip_cm', e.target.value)} />
          <input className="input" type="number" step="0.5" placeholder="Peito (cm)" value={form.chest_cm} onChange={(e) => update('chest_cm', e.target.value)} />
          <input className="input" type="number" step="0.5" placeholder="Braço (cm)" value={form.arm_cm} onChange={(e) => update('arm_cm', e.target.value)} />
          <input className="input" type="number" step="0.5" placeholder="Coxa (cm)" value={form.thigh_cm} onChange={(e) => update('thigh_cm', e.target.value)} />
        </div>
        <button className="btn-primary" disabled={saving}>
          {saving ? 'Salvando...' : 'Registrar medição'}
        </button>
      </form>

      <div className="space-y-2">
        {loading ? (
          <p className="text-sm text-neutral-500">Carregando...</p>
        ) : (
          [...rows].reverse().map((r) => (
            <div key={r.id} className="card flex items-center justify-between text-sm">
              <span className="text-neutral-500">{new Date(r.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
              <span className="text-neutral-900 font-medium">{r.weight_kg ?? '-'} kg</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
