import { GoogleGenAI, Type } from "@google/genai";
import type { UserProfile, Meal } from "../types";

/**
 * 안전하게 Gemini 클라이언트를 만들어서 반환한다.
 * - 환경변수에서 API 키를 읽는다.
 * - 없으면 바로 에러 던진다 (undefined 불허)
 * => 함수가 성공적으로 리턴됐다는 건 apiKey가 string으로 확정됐다는 뜻이라
 *    TypeScript가 더 이상 string | undefined라고 불평하지 않는다.
 */
function getGeminiClient(): GoogleGenAI {
  const apiKey = import.meta.env.VITE_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_API_KEY is not set");
  }

  return new GoogleGenAI({ apiKey });
}

export async function getMealRecommendation(
  profile: UserProfile,
  fridgeItems: string[],
  pastMeals: Meal[]
): Promise<any> {
  // 여기서 클라이언트 생성 (이 시점에는 apiKey가 string으로 확정된 상태)
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
  } catch (error) {
    console.error("Error getting meal recommendation:", error);
    throw new Error("Failed to get meal recommendation from AI.");
  }
}
