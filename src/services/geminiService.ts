import type { UserProfile, Meal } from "../types";

// 임시: 실제 Gemini 호출 안 하고 mock 결과만 돌려줌
export async function getMealRecommendation(
  profile: UserProfile,
  fridgeItems: string[],
  pastMeals: Meal[]
): Promise<any> {
  const pastMealNames =
    pastMeals.map((m) => m.menu_name).join(", ") || "none";

  // 가짜 한 끼 제안
  return [
    {
      menu_id: "M1234",
      menu_name: "Grilled Chicken Salad",
      required_ingredients: [
        "chicken breast",
        "mixed greens",
        "olive oil",
        "lemon"
      ],
      reasoning: `Using fridge items: [${fridgeItems.join(
        ", "
      )}], avoiding dislikes/allergies: [${profile.allergies.join(
        ", "
      )}], not repeating: [${pastMealNames}], and matching goal: ${
        profile.dietaryGoal
      }.`
    }
  ];
}
