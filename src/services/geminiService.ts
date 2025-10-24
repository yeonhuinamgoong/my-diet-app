import { GoogleGenAI, Type } from "@google/genai";
import type { UserProfile, Meal } from "../types";

/**
 * 내부 전용 헬퍼:
 * - 환경변수에서 API 키를 읽고
 * - 없으면 명확하게 에러를 던지고
 * - 있으면 GoogleGenAI 클라이언트를 만들어서 돌려준다
 */
function getGeminiClient(): GoogleGenAI {
  // Netlify 환경변수 → Vite 런타임으로 노출된 값
  const key = import.meta.env.VITE_API_KEY;

  // 런타임 보장: 키가 없으면 여기서 바로 죽여서
  // 이후 코드에서는 key가 string이라고 확정됨
  if (!key) {
    throw new Error(
      "VITE_API_KEY is not defined. Set it in Netlify (Site settings → Build & deploy → Environment)."
    );
  }

  return new GoogleGenAI({ apiKey: key });
}

/**
 * 식단 추천:
 * 사용자 프로필 / 냉장고 재고 / 최근 먹은 식단을 보고
 * 새로운 한 끼 식단을 제안
 */
export async function getMealRecommendation(
  profile: UserProfile,
  fridgeItems: string[],
  pastMeals: Meal[]
): Promise<any> {
  // 항상 함수 안에서 클라이언트 생성
  const ai = getGeminiClient();

  const pastMealNames =
    pastMeals.map((m) => m.menu_name).join(", ") || "none";

  const prompt = `
    Based on the following user data, recommend one new meal.
    - Fridge Inventory: [${fridgeItems.join(", ")}]
    - Preferences: [${profile.preferences.join(", ")}]
    - Allergies/Dislikes: [${profile.allergies.join(", ")}]
    - Diet Goal: ${profile.dietaryGoal}
    - Past Meals (recently eaten): [${pastMealNames}]

    Prioritize using ingredients from the fridge, suggest something different from past meals, and align with the user's diet goal.
    Generate a unique menu_id starting with 'M' followed by 4 random digits.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              menu_id: { type: Type.STRING },
              menu_name: { type: Type.STRING },
              required_ingredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              reasoning: { type: Type.STRING }
            },
            required: [
              "menu_id",
              "menu_name",
              "required_ingredients",
              "reasoning"
            ]
          }
        }
      }
    });

    // SDK가 response.text 또는 response.text() 등 형태일 수 있는데
    // 네 코드에서는 response.text 라고 썼으므로 그대로 둔다
    const jsonText = response.text;
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("Error getting meal recommendation:", err);
    throw new Error("Failed to get meal recommendation from AI.");
  }
}
