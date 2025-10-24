// Gemini API 호출 비활성화 버전
// Netlify 배포용 (Gemini 호출 없이 임시 데이터 반환)

import type { UserProfile, Meal } from "../types";

export async function getMealRecommendation(
  profile: UserProfile,
  fridgeItems: string[],
  pastMeals: Meal[]
): Promise<any> {
  // 임시 로직: 실제 AI 호출 대신 더미 추천 반환
  const pastMealNames =
    pastMeals.map((m) => m.menu_name).join(", ") || "none";

  const prompt = `
    Based on the following user data, recommend one new meal.
    - Fridge Inventory: [${fridgeItems.join(", ")}]
    - Preferences: [${profile.preferences.join(", ")}]
    - Allergies/Dislikes: [${profile.allergies.join(", ")}]
    - Diet Goal: ${profile.dietaryGoal}
    - Past Meals: [${pastMealNames}]
  `;

  console.log("Prompt (for debug):", prompt);

  // 실제 API 대신 예시 데이터 반환
  return [
    {
      menu_id: "M1234",
      menu_name: "Grilled Chicken Salad",
      required_ingredients: ["chicken breast", "lettuce", "olive oil"],
      reasoning:
        "High protein, low carb meal aligned with diet goal using fridge items."
    }
  ];
}
