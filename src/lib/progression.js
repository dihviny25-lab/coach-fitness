// Sugestão de progressão de carga por regras simples (sem IA): olha a última
// sessão em que o exercício foi feito e sugere aumentar carga, repetir ou
// focar em mais uma repetição, com base em reps e RPE.

function parseRepRange(targetReps) {
  if (!targetReps) return [8, 12]
  const match = String(targetReps).match(/(\d+)\D+(\d+)/)
  if (!match) return [8, 12]
  return [Number(match[1]), Number(match[2])]
}

function weightIncrement(weight) {
  if (weight <= 10) return 1
  if (weight <= 30) return 2
  if (weight <= 60) return 2.5
  return 5
}

// Recebe os sets da última sessão (mesmo exercício, treino anterior) e
// retorna { weight, reps, note } com a sugestão para a próxima vez.
export function suggestNextLoad(previousSets, targetReps) {
  if (!previousSets || previousSets.length === 0) return null

  const weighted = previousSets.filter((s) => s.weight_kg != null && s.weight_kg > 0)
  const rpes = previousSets.map((s) => s.rpe).filter((r) => r != null)
  const avgRpe = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null

  // Exercício de peso corporal (sem carga registrada): progressão é por reps.
  if (weighted.length === 0) {
    const reps = previousSets.map((s) => s.reps).filter((r) => r != null)
    if (reps.length === 0) return null
    const avgReps = reps.reduce((a, b) => a + b, 0) / reps.length
    const [, repMax] = parseRepRange(targetReps)
    if (avgReps >= repMax) {
      return { weight: null, reps: Math.round(avgReps) + 2, note: `Última vez: ${Math.round(avgReps)} reps. Tente ${Math.round(avgReps) + 2} reps.` }
    }
    return { weight: null, reps: Math.round(avgReps) + 1, note: `Última vez: ${Math.round(avgReps)} reps. Tente ${Math.round(avgReps) + 1} reps.` }
  }

  const workingWeight = Math.max(...weighted.map((s) => s.weight_kg))
  const repsAtWorkingWeight = weighted.filter((s) => s.weight_kg === workingWeight).map((s) => s.reps).filter((r) => r != null)
  const avgReps = repsAtWorkingWeight.length ? repsAtWorkingWeight.reduce((a, b) => a + b, 0) / repsAtWorkingWeight.length : null
  const [repMin, repMax] = parseRepRange(targetReps)

  const hardSession = avgRpe != null && avgRpe >= 9
  const easySession = (avgRpe != null && avgRpe <= 7) || (avgReps != null && avgReps >= repMax)
  const missedTarget = avgReps != null && avgReps < repMin

  if (hardSession || missedTarget) {
    return {
      weight: workingWeight,
      reps: null,
      note: `Última vez: ${avgReps ? Math.round(avgReps) : '-'} reps @ ${workingWeight}kg. Mantenha a carga e foque na técnica.`,
    }
  }

  if (easySession) {
    const next = Math.round((workingWeight + weightIncrement(workingWeight)) * 2) / 2
    return {
      weight: next,
      reps: null,
      note: `Última vez: ${avgReps ? Math.round(avgReps) : '-'} reps @ ${workingWeight}kg. Sugestão: ${next}kg.`,
    }
  }

  return {
    weight: workingWeight,
    reps: avgReps ? Math.round(avgReps) + 1 : null,
    note: `Última vez: ${avgReps ? Math.round(avgReps) : '-'} reps @ ${workingWeight}kg. Tente 1 rep a mais com a mesma carga.`,
  }
}
