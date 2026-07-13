import { supabase } from './supabase'
import { generateWorkoutPlan } from './planGenerator'

// Gera um novo plano de treino a partir do perfil e grava no banco,
// substituindo qualquer plano anterior do usuário.
export async function createWorkoutPlan(userId, profileFields) {
  const { data: exercises, error: exError } = await supabase.from('exercises').select('id, name, muscle_group, equipment')
  if (exError) throw exError

  const plan = generateWorkoutPlan(profileFields, exercises || [])

  await supabase.from('workout_plans').delete().eq('user_id', userId)

  const { data: planRow, error: planError } = await supabase
    .from('workout_plans')
    .insert({ user_id: userId, goal: profileFields.goal, split_type: plan.splitType, weekly_frequency: plan.weeklyFrequency })
    .select()
    .single()
  if (planError) throw planError

  for (const [i, day] of plan.days.entries()) {
    const { data: dayRow, error: dayError } = await supabase
      .from('workout_plan_days')
      .insert({ plan_id: planRow.id, day_index: i, weekday: day.weekday, name: day.name, muscle_focus: day.muscleFocus })
      .select()
      .single()
    if (dayError) throw dayError

    if (day.exercises.length) {
      const rows = day.exercises.map((ex) => ({
        plan_day_id: dayRow.id,
        exercise_id: ex.exerciseId,
        order_index: ex.orderIndex,
        target_sets: ex.targetSets,
        target_reps: ex.targetReps,
      }))
      const { error: rowsError } = await supabase.from('workout_plan_exercises').insert(rows)
      if (rowsError) throw rowsError
    }
  }

  return planRow
}

export async function loadActivePlan(userId) {
  const { data, error } = await supabase
    .from('workout_plans')
    .select('*, workout_plan_days(*, workout_plan_exercises(*, exercises(name, muscle_group, equipment)))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (data?.workout_plan_days) {
    data.workout_plan_days.sort((a, b) => a.day_index - b.day_index)
    for (const day of data.workout_plan_days) {
      day.workout_plan_exercises?.sort((a, b) => a.order_index - b.order_index)
    }
  }
  return data
}
