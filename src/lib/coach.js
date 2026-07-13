// Regras simples de cálculo: TMB (Mifflin-St Jeor), TDEE e macros por objetivo.

export function calcAge(birthDate) {
  if (!birthDate) return null
  const b = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - b.getFullYear()
  const m = today.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--
  return age
}

const ACTIVITY_MULTIPLIER = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  ativo: 1.725,
  muito_ativo: 1.9,
}

const GOAL_LABELS = {
  emagrecimento: 'Emagrecimento',
  ganho_massa: 'Ganho de massa',
  forca: 'Força',
  recomposicao: 'Recomposição corporal',
  saude_geral: 'Saúde geral',
}

export function goalLabel(goal) {
  return GOAL_LABELS[goal] || goal
}

export function calcBMR({ sex, weightKg, heightCm, age }) {
  if (!sex || !weightKg || !heightCm || age == null) return null
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === 'masculino' ? base + 5 : base - 161
}

export function calcTargets({ sex, weightKg, heightCm, birthDate, activityLevel, goal }) {
  const age = calcAge(birthDate)
  const bmr = calcBMR({ sex, weightKg, heightCm, age })
  if (!bmr) return null
  const multiplier = ACTIVITY_MULTIPLIER[activityLevel] || 1.375
  const tdee = bmr * multiplier

  let calories = tdee
  let proteinPerKg = 1.8
  if (goal === 'emagrecimento') {
    calories = tdee - 500
    proteinPerKg = 2.2
  } else if (goal === 'ganho_massa') {
    calories = tdee + 300
    proteinPerKg = 2.0
  } else if (goal === 'forca') {
    calories = tdee + 200
    proteinPerKg = 2.0
  } else if (goal === 'recomposicao') {
    calories = tdee - 200
    proteinPerKg = 2.2
  } else {
    calories = tdee
    proteinPerKg = 1.6
  }

  calories = Math.max(1200, Math.round(calories))
  const proteinG = Math.round(weightKg * proteinPerKg)
  const fatG = Math.round((calories * 0.25) / 9)
  const proteinCal = proteinG * 4
  const fatCal = fatG * 9
  const carbsG = Math.max(0, Math.round((calories - proteinCal - fatCal) / 4))

  return { bmr: Math.round(bmr), tdee: Math.round(tdee), calories, proteinG, fatG, carbsG }
}
