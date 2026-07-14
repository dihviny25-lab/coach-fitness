// Sugestão de cardápio baseada em regras simples (sem IA): distribui a meta
// diária de calorias entre as refeições, escolhe uma fonte de proteína e uma
// de carboidrato da biblioteca de alimentos (filtrada por padrão alimentar)
// e calcula a quantidade em gramas para bater a meta de cada refeição.

const MEAL_SHARE = { cafe: 0.25, almoco: 0.35, jantar: 0.3, lanche: 0.1 }
const VEGGIE_NAMES = ['Brócolis cozido', 'Alface', 'Tomate']

function isDietCompatible(food, pattern) {
  if (pattern === 'vegano') return food.diet_type === 'vegano'
  if (pattern === 'vegetariano') return food.diet_type === 'vegano' || food.diet_type === 'vegetariano'
  return true
}

function pickHighest(foods, scoreFn) {
  return [...foods].sort((a, b) => scoreFn(b) - scoreFn(a))[0]
}

function pickLowest(foods, key) {
  return [...foods].sort((a, b) => a[key] - b[key])[0]
}

function buildItem(food, grams) {
  const factor = grams / 100
  return {
    food_id: food.id,
    food_name: food.name,
    quantity_g: grams,
    calories: Math.round(food.calories_per_100g * factor),
    protein_g: Math.round(food.protein_g * factor * 10) / 10,
    carbs_g: Math.round(food.carbs_g * factor * 10) / 10,
    fat_g: Math.round(food.fat_g * factor * 10) / 10,
  }
}

export function generateMealPlan({ targets, dietaryPattern }, foodsLibrary) {
  const pool = foodsLibrary.filter((f) => isDietCompatible(f, dietaryPattern) && f.meal_types?.length > 0)
  const lowCarb = dietaryPattern === 'low_carb'
  const proteinShare = lowCarb ? 0.65 : 0.55
  const carbShare = lowCarb ? 0.2 : 0.45

  const meals = Object.keys(MEAL_SHARE).map((type) => {
    const mealCalories = targets.calories * MEAL_SHARE[type]
    const eligible = pool.filter((f) => f.meal_types.includes(type))
    // Vegetais de acompanhamento (muito pouco calóricos) ficam de fora da escolha
    // de fonte principal de proteína/carbo, senão a conta de gramas explode.
    const mainCandidates = eligible.filter((f) => !VEGGIE_NAMES.includes(f.name))
    const proteinFood = pickHighest(mainCandidates, (f) => f.protein_g / f.calories_per_100g)
    const carbCandidates = mainCandidates.filter((f) => f.id !== proteinFood?.id)
    const carbFood = lowCarb ? pickLowest(carbCandidates, 'carbs_g') : pickHighest(carbCandidates, (f) => f.carbs_g)

    const items = []
    if (proteinFood) {
      const grams = Math.min(400, Math.max(20, Math.round((mealCalories * proteinShare) / (proteinFood.calories_per_100g / 100) / 5) * 5))
      items.push(buildItem(proteinFood, grams))
    }
    if (carbFood && carbFood.id !== proteinFood?.id) {
      const grams = Math.min(400, Math.max(20, Math.round((mealCalories * carbShare) / (carbFood.calories_per_100g / 100) / 5) * 5))
      items.push(buildItem(carbFood, grams))
    }
    if (type === 'almoco' || type === 'jantar') {
      const veggie = eligible.find((f) => VEGGIE_NAMES.includes(f.name) && f.id !== proteinFood?.id && f.id !== carbFood?.id)
      if (veggie) items.push(buildItem(veggie, 80))
    }

    const totals = items.reduce(
      (acc, it) => {
        acc.calories += it.calories
        acc.protein_g += it.protein_g
        acc.carbs_g += it.carbs_g
        acc.fat_g += it.fat_g
        return acc
      },
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
    )

    return { type, items, totals }
  })

  return { meals }
}
