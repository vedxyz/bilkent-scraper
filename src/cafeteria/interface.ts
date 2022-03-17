import { Dayjs } from "dayjs";

export interface MealName {
  tr: string;
  eng: string;
}

export interface Meal {
  /**
   * Standard plates. There should always be 4 of these.
   */
  plates: MealName[];
  vegetarianPlate: MealName;
  calories: {
    standard: string;
    vegetarian: string;
  };
}

export interface MealDay {
  date: Dayjs;
  lunch: Meal;
  dinner: Meal;
}

/**
 * The entire list for the current week.
 */
export interface MealList {
  /**
   * The ETag header that was received alongside this object's contents.
   */
  entityTag: string;
  /**
   * `[0]..[6]` = `monday..sunday`
   */
  days: MealDay[];
}
