import { GoogleGenAI, Type } from "@google/genai";
import type { UserProfile, Meal } from "../types";

/**
 * Gemini 클라이언트 생성
 * - Netlify 환경변수(VITE_API_KEY)에서 키를 읽음
 * - 없으면 명확히 에러 발생시킴
 */
function getGeminiClient(): GoogleGenAI {
  const key = import.meta.env.VITE_API_KEY;

  if (!key) {
    throw new Error(
      "VITE_API_KEY is not defined. Please set it in Netlify Environment variables."
    );
  }

  return new GoogleGenAI({ apiKey: key });
}

/**
 * Gemini 모델을 사용해 식단 추천
 */
export async function getMealRecommendation(
  profile: UserProfile,
  fridgeItems: string[],
  pastMeals: Meal[]
): Promise<any> {
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
                type: Type.ARRAY
