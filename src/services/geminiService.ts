import { GoogleGenAI, Type } from "@google/genai";
import type { UserProfile, Meal } from "../types";

/**
 * Gemini 클라이언트 생성 함수
 * - 환경변수에서 API 키를 읽고
 * - 없으면 에러
 * - 있으면 GoogleGenAI 인스턴스를 반환
 *
 * 이 함수 말고 다른 곳(파일 아래쪽 등)에서는 절대 import.meta.env.VITE_API_KEY 직접 쓰지 마!
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
 * 유저 정보 기반 식단 추천 요청
 */
export async function getMealRecommendation(
  profile: UserProfile,
  fridgeItems: string[],
  pastMeals: Meal[]
): Promise<any> {
  // 항상 여기서만 Gemini 클라이언트 만든다
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

    Prioritize using ingredients from the fridge, suggest something different from past meals,
    and align with the user's diet goal.
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
    throw new Error("Failed to get meal recommendation from Gemini API.");
  }
}

