import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Ruler } from 'lucide-react'
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
      <h1 className="page-title flex items-center gap-2">
        <Ruler className="text-brand-500" size={22} />
        Medidas
      </h1>

      {latest && first && rows.length > 1 && (
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-xs text-neutral-500">Peso atual</p>
            <p className="text-2xl font-extrabold text-white">{latest.weight_kg ?? '-'} kg</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Variação total</p>
            <p className={`text-2xl font-extrabold ${latest.weight_kg - first.weight_kg <= 0 ? 'text-green-400' : 'text-orange-400'}`}>
              {(latest.weight_kg - first.weight_kg).toFixed(1)} kg
            </p>
          </div>
        </div>
      )}

      {chartData.length > 1 && (
        <div className="card">
          <p className="section-label mb-2">Evolução do peso</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a3a3a3' }} stroke="#404040" />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#a3a3a3' }} stroke="#404040" width={35} />
              <Tooltip contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 8, fontSize: 12, color: '#fff' }} />
              <Line type="monotone" dataKey="peso" stroke="#39ff14" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-3">
        <p className="section-label">Nova medição</p>
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
              <span className="text-white font-semibold">{r.weight_kg ?? '-'} kg</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
