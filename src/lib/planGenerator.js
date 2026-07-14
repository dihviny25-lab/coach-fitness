// Gerador de plano de treino baseado em regras simples (sem IA):
// escolhe uma divisão (split) a partir da frequência semanal e do nível,
// preenche cada dia com exercícios da biblioteca filtrados por equipamento
// disponível, e define séries/reps a partir do objetivo.

const REP_SCHEME = {
  emagrecimento: { sets: 3, reps: '15-20' },
  ganho_massa: { sets: 4, reps: '8-12' },
  forca: { sets: 5, reps: '4-6' },
  recomposicao: { sets: 4, reps: '10-12' },
  saude_geral: { sets: 3, reps: '12-15' },
}

const EXERCISES_PER_DAY = { iniciante: 4, intermediario: 5, avancado: 6 }

const FULL_BODY_VARIANTS = [
  { letter: 'A', groups: ['Pernas', 'Peito', 'Costas', 'Ombro', 'Abdômen'] },
  { letter: 'B', groups: ['Costas', 'Pernas', 'Peito', 'Bíceps', 'Tríceps'] },
  { letter: 'C', groups: ['Pernas', 'Ombro', 'Costas', 'Abdômen', 'Posterior de coxa'] },
  { letter: 'D', groups: ['Peito', 'Pernas', 'Ombro', 'Tríceps', 'Panturrilha'] },
  { letter: 'E', groups: ['Costas', 'Peito', 'Pernas', 'Bíceps', 'Abdômen'] },
  { letter: 'F', groups: ['Ombro', 'Costas', 'Pernas', 'Posterior de coxa', 'Tríceps'] },
]

function fullBodyTemplate() {
  return FULL_BODY_VARIANTS.slice(0, 3).map((v) => ({ name: `Treino ${v.letter} – Corpo inteiro`, groups: v.groups }))
}

// Um dia de corpo inteiro por treino, com variações leves na ordem/ênfase
// dos grupos musculares entre os dias (em vez de dividir por partes do corpo).
function fullBodyDailyTemplate(count) {
  return Array.from({ length: count }, (_, i) => {
    const v = FULL_BODY_VARIANTS[i % FULL_BODY_VARIANTS.length]
    return { name: `Treino ${v.letter} – Corpo inteiro`, groups: v.groups }
  })
}

function pushPullLegsTemplate() {
  return [
    { name: 'Treino A – Push (peito/ombro/tríceps)', groups: ['Peito', 'Ombro', 'Tríceps'] },
    { name: 'Treino B – Pull (costas/bíceps)', groups: ['Costas', 'Bíceps'] },
    { name: 'Treino C – Pernas', groups: ['Pernas', 'Posterior de coxa', 'Panturrilha'] },
  ]
}

function upperLowerTemplate() {
  return [
    { name: 'Treino A – Superior', groups: ['Peito', 'Costas', 'Ombro'] },
    { name: 'Treino B – Inferior', groups: ['Pernas', 'Posterior de coxa', 'Panturrilha'] },
  ]
}

function buildSplit(weeklyFrequency, experienceLevel, splitPreference) {
  const freq = Math.min(Math.max(Number(weeklyFrequency) || 3, 1), 7)

  if (splitPreference === 'full_body') {
    return { splitType: 'Full Body diário', days: fullBodyDailyTemplate(freq) }
  }

  if (freq === 1) return { splitType: 'Full Body', days: [fullBodyTemplate()[0]] }
  if (freq === 2) return { splitType: 'Superior/Inferior', days: upperLowerTemplate() }

  if (freq === 3) {
    if (experienceLevel === 'iniciante') return { splitType: 'Full Body A/B/C', days: fullBodyTemplate() }
    return { splitType: 'Push/Pull/Legs', days: pushPullLegsTemplate() }
  }

  if (freq === 4) {
    const [a, b] = upperLowerTemplate()
    return {
      splitType: 'Superior/Inferior (2x)',
      days: [a, b, { ...a, name: 'Treino C – Superior' }, { ...b, name: 'Treino D – Inferior' }],
    }
  }

  if (freq === 5) {
    const [push, pull, legs] = pushPullLegsTemplate()
    const [upper, lower] = upperLowerTemplate()
    return {
      splitType: 'Push/Pull/Legs + Superior/Inferior',
      days: [push, pull, legs, { ...upper, name: 'Treino D – Superior' }, { ...lower, name: 'Treino E – Inferior + core', groups: [...lower.groups, 'Abdômen'] }],
    }
  }

  // 6 ou 7 dias: Push/Pull/Legs duas vezes na semana
  const [push, pull, legs] = pushPullLegsTemplate()
  const days = [
    push,
    pull,
    legs,
    { ...push, name: 'Treino D – Push (2)' },
    { ...pull, name: 'Treino E – Pull (2)' },
    { ...legs, name: 'Treino F – Pernas (2)' },
  ]
  if (freq === 7) days.push({ name: 'Treino G – Cardio & mobilidade', groups: ['Cardio', 'Abdômen'] })
  return { splitType: 'Push/Pull/Legs (2x)', days }
}

function groupBy(list, key) {
  const map = {}
  for (const item of list) {
    const k = item[key]
    if (!map[k]) map[k] = []
    map[k].push(item)
  }
  return map
}

export function generateWorkoutPlan({ goal, experienceLevel, weeklyFrequency, equipmentAccess, availableDays, splitPreference }, exercisesLibrary) {
  const allowedEquip = new Set([...(equipmentAccess || []), 'Peso corporal', 'Nenhum'])
  const pool = exercisesLibrary.filter((e) => allowedEquip.has(e.equipment) && e.muscle_group !== 'Cardio')
  const cardioPool = exercisesLibrary.filter((e) => e.muscle_group === 'Cardio' && allowedEquip.has(e.equipment))
  const byGroup = groupBy(pool, 'muscle_group')

  const { sets, reps } = REP_SCHEME[goal] || REP_SCHEME.saude_geral
  const exercisesPerDay = EXERCISES_PER_DAY[experienceLevel] || 5

  const { splitType, days: template } = buildSplit(weeklyFrequency, experienceLevel, splitPreference)

  const days = template.map((day, dayIndex) => {
    const groups = day.groups || []
    const dayExercises = []
    const usedInDay = new Set()
    let attempts = 0
    while (dayExercises.length < exercisesPerDay && attempts < groups.length * 4) {
      const group = groups[attempts % groups.length]
      const candidates = (byGroup[group] || []).filter((e) => !usedInDay.has(e.id))
      if (candidates.length) {
        const ex = candidates[Math.floor(attempts / groups.length) % candidates.length]
        dayExercises.push({
          exerciseId: ex.id,
          name: ex.name,
          muscleGroup: ex.muscle_group,
          targetSets: sets,
          targetReps: reps,
          orderIndex: dayExercises.length,
        })
        usedInDay.add(ex.id)
      }
      attempts++
    }

    if (goal === 'emagrecimento' && cardioPool.length && day.name !== 'Treino G – Cardio & mobilidade') {
      const c = cardioPool[dayIndex % cardioPool.length]
      dayExercises.push({
        exerciseId: c.id,
        name: c.name,
        muscleGroup: c.muscle_group,
        targetSets: 1,
        targetReps: '15-20 min',
        orderIndex: dayExercises.length,
      })
    } else if (groups.includes('Cardio') && cardioPool.length) {
      for (const c of cardioPool.slice(0, 2)) {
        dayExercises.push({
          exerciseId: c.id,
          name: c.name,
          muscleGroup: c.muscle_group,
          targetSets: 1,
          targetReps: '15-20 min',
          orderIndex: dayExercises.length,
        })
      }
    }

    return {
      name: day.name,
      weekday: (availableDays || [])[dayIndex] || null,
      muscleFocus: groups.join(', '),
      exercises: dayExercises,
    }
  })

  return { splitType, weeklyFrequency: template.length, days }
}

export const WEEKDAY_LABELS = {
  seg: 'Segunda',
  ter: 'Terça',
  qua: 'Quarta',
  qui: 'Quinta',
  sex: 'Sexta',
  sab: 'Sábado',
  dom: 'Domingo',
}

export const EQUIPMENT_OPTIONS = ['Peso corporal', 'Halteres', 'Barra', 'Máquina', 'Cabo']

export const SPLIT_PREFERENCES = {
  automatico: 'Automático (recomendado)',
  full_body: 'Full body todos os dias',
}

export const DIETARY_PATTERNS = {
  sem_restricao: 'Sem restrição',
  vegetariano: 'Vegetariano',
  vegano: 'Vegano',
  low_carb: 'Low carb',
  outro: 'Outro',
}
