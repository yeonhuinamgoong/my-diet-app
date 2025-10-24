import { GoogleGenAI, Type } from "@google/genai";
import type { UserProfile, Meal } from "../types";

/**
 * Gemini 클라이언트를 만든다.
 * - Netlify/Vite 환경 변수에서 API 키 읽음
 * - 없으면 바로 에러 (명확한 메시지)
 */
function getGeminiClient(): GoogleGenAI {
  const key = import.meta.env.VITE_API_KEY;

  if (!key) {
    throw new Error(
      "VITE_API_KEY is not defined. Please set it in Netlify environment variables."
    );
  }

  return new GoogleGenAI({ apiKey: key });
}

/**
 * 사용자 정보 기반으로 식단 추천을 요청한다.
 */
export async function getMealRecommendation(
  profile: UserProfile,
  fridgeItems: string[],
  pastMeals: Meal[]
): Promise<any> {
  // 1) Gemini 클라이언트 준비
  const ai = getGeminiClient();

  // 2) 과거 식단 요약
  const pastMealNames =
    pastMeals.map((m) => m.menu_name).join(", ") || "none";

  // 3) 프롬프트 구성
  const prompt = `
    Based on the following user data, recommend one new meal.
    - Fridge Inventory: [${fridgeItems.join(", ")}]
    - Preferences: [${profile.preferences.join(", ")}]
    - Allergies/Dislikes: [${profile.allergies.join(", ")}]
    - Diet Goal: ${profile.dietaryGoal}
    - Past Meals (recently eaten): [${pastMealNames}]

    Prioritize using ingredients from the fridge, suggest something different from past meals,
    and align with the user's diet goal.
    Generate a unique menu_id starting with 'M' followed by 4 random digits.
  `;

  try {
    // 4) Gemini 호출
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

    // 5) 결과 파싱
    const jsonText = response.text;
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("Error getting meal recommendation:", err);
    throw new Error("Failed to get meal recommendation from Gemini API.");
  }
}
