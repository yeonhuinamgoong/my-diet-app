import { GoogleGenAI, Type } from "@google/genai";
import type { UserProfile, Meal } from "../types";

// 🔐 환경변수에서 API 키 읽기 (Vite 방식)
const rawKey = import.meta.env.VITE_API_KEY;

// 빌드/런타임 전에 키가 꼭 있어야 한다는 걸 보장
if (!rawKey) {
  throw new Error("VITE_API_KEY is not set");
}

// 여기까지 왔으면 rawKey는 string 으로 확정됨
const ai = new GoogleGenAI({ apiKey: rawKey });

export async function getMealRecommendation(
  profile: UserProfile,
  fridgeItems: string[],
  pastMeals: Meal[]
): Promise<any> {
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
