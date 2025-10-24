import { GoogleGenAI, Type } from "@google/genai";
import type { UserProfile, Meal } from "../types";

/**
 * 안전하게 Gemini 클라이언트를 만든다.
 * - Netlify 환경변수(VITE_API_KEY)를 읽는다.
 * - 없으면 에러로 중단한다.
 */
function getGeminiClient(): GoogleGenAI {
  // Vite에서 노출된 env. env.d.ts에서 string으로 선언되어 있어야 함.
  const key = import.meta.env.VITE_API_KEY;

  // 런타임 방어. 실제로 없으면 바로 중단.
  if (!key) {
    throw new Error(
      "VITE_API_KEY is not defined. Please set it in Netlify environment variables."
    );
  }

  // 여기서 key는 string으로 확정된 상태라 TypeScript도 OK여야 한다.
  return new GoogleGenAI({ apiKey: key });
}

/**
 * 식단 추천: 사용자 정보/냉장고 재고/최근 식단을 보고 새 식단 아이디어를 만든다.
 */
export async function getMealRecommendation(
  profile: UserProfile,
  fridgeItems: string[],
  pastMeals: Meal[]
): Promise<any> {
  // 항상 여기서 클라이언트 받아와 (다른 곳에서 만들지 말기!)
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

    const jsonText = response.text;
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("Error getting meal recommendation:", err);
    throw new Error("Failed to get meal recommendation from AI.");
  }
}
