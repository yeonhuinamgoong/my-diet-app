export interface UserProfile {
  preferences: string[];
  allergies: string[];
  dietaryGoal: string;
}

export interface Meal {
  menu_id: string;
  menu_name: string;
  required_ingredients: string[];
  reasoning?: string;
}

export interface RecommendedMeal extends Meal {
  reasoning: string;
}

// New types for the weekly planner
export type MealTime = '아침' | '점심' | '저녁';

export type DayPlan = Record<MealTime, Meal[]>;

export type WeeklyPlan = Record<string, DayPlan>;