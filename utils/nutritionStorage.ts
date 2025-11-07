import AsyncStorage from '@react-native-async-storage/async-storage';

const MEALS_KEY = 'nutrition_meals';
const CALORIE_GOAL_KEY = 'nutrition_calorie_goal';

export interface Meal {
  id: string;
  name: string;
  calories: number;
  date: string; // ISO date string
  time: string; // Time string HH:MM
  imageUri?: string;
  notes?: string;
  addedBy: 'manual' | 'ai';
}

export interface CalorieGoal {
  dailyGoal: number;
  updatedAt: string;
}

export interface DayMeals {
  date: string; // Format: YYYY-MM-DD
  meals: Meal[];
  totalCalories: number;
}

export class NutritionStorage {
  // Get all meals
  static async getAllMeals(): Promise<Meal[]> {
    try {
      const mealsJson = await AsyncStorage.getItem(MEALS_KEY);
      if (mealsJson) {
        return JSON.parse(mealsJson);
      }
      return [];
    } catch (error) {
      console.error('Error loading meals:', error);
      return [];
    }
  }

  // Get meals for a specific date
  static async getMealsByDate(date: string): Promise<Meal[]> {
    try {
      const allMeals = await this.getAllMeals();
      const dateStr = date.split('T')[0]; // Get YYYY-MM-DD part
      return allMeals.filter(meal => meal.date.split('T')[0] === dateStr);
    } catch (error) {
      console.error('Error loading meals by date:', error);
      return [];
    }
  }

  // Get meals grouped by date (last N days)
  static async getMealsGroupedByDate(days: number = 7): Promise<DayMeals[]> {
    try {
      const allMeals = await this.getAllMeals();
      const today = new Date();
      const groupedMeals: { [key: string]: Meal[] } = {};

      // Initialize last N days
      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        groupedMeals[dateStr] = [];
      }

      // Group meals by date
      allMeals.forEach(meal => {
        const dateStr = meal.date.split('T')[0];
        if (groupedMeals[dateStr]) {
          groupedMeals[dateStr].push(meal);
        }
      });

      // Convert to array and calculate totals
      const result: DayMeals[] = Object.keys(groupedMeals)
        .sort((a, b) => b.localeCompare(a)) // Sort descending (newest first)
        .map(date => ({
          date,
          meals: groupedMeals[date].sort((a, b) => b.time.localeCompare(a.time)),
          totalCalories: groupedMeals[date].reduce((sum, meal) => sum + meal.calories, 0),
        }));

      return result;
    } catch (error) {
      console.error('Error loading grouped meals:', error);
      return [];
    }
  }

  // Add a new meal
  static async addMeal(meal: Omit<Meal, 'id'>): Promise<Meal> {
    try {
      const allMeals = await this.getAllMeals();
      const newMeal: Meal = {
        ...meal,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      };
      allMeals.push(newMeal);
      await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(allMeals));
      return newMeal;
    } catch (error) {
      console.error('Error adding meal:', error);
      throw error;
    }
  }

  // Update a meal
  static async updateMeal(id: string, updates: Partial<Meal>): Promise<void> {
    try {
      const allMeals = await this.getAllMeals();
      const index = allMeals.findIndex(meal => meal.id === id);
      if (index !== -1) {
        allMeals[index] = { ...allMeals[index], ...updates };
        await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(allMeals));
      }
    } catch (error) {
      console.error('Error updating meal:', error);
      throw error;
    }
  }

  // Delete a meal
  static async deleteMeal(id: string): Promise<void> {
    try {
      const allMeals = await this.getAllMeals();
      const filteredMeals = allMeals.filter(meal => meal.id !== id);
      await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(filteredMeals));
    } catch (error) {
      console.error('Error deleting meal:', error);
      throw error;
    }
  }

  // Get calorie goal
  static async getCalorieGoal(): Promise<number> {
    try {
      const goalJson = await AsyncStorage.getItem(CALORIE_GOAL_KEY);
      if (goalJson) {
        const goal: CalorieGoal = JSON.parse(goalJson);
        return goal.dailyGoal;
      }
      return 2000; // Default goal
    } catch (error) {
      console.error('Error loading calorie goal:', error);
      return 2000;
    }
  }

  // Set calorie goal
  static async setCalorieGoal(dailyGoal: number): Promise<void> {
    try {
      const goal: CalorieGoal = {
        dailyGoal,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(CALORIE_GOAL_KEY, JSON.stringify(goal));
    } catch (error) {
      console.error('Error setting calorie goal:', error);
      throw error;
    }
  }

  // Get today's total calories
  static async getTodayCalories(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayMeals = await this.getMealsByDate(today);
      return todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
    } catch (error) {
      console.error('Error calculating today calories:', error);
      return 0;
    }
  }

  // Clear all nutrition data
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(MEALS_KEY);
      await AsyncStorage.removeItem(CALORIE_GOAL_KEY);
    } catch (error) {
      console.error('Error clearing nutrition data:', error);
      throw error;
    }
  }
}

