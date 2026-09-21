// Shared recipe database types (kept separate to avoid import cycles).

export type Difficulty = "easy" | "medium" | "hard";
export type SpiceLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type DbRecipe = {
  id: string;
  /** Authentic Bengali dish name — never generated or invented. */
  name_bn: string;
  name_en: string;
  ingredients: string[];
  staples: string[];
  steps_bn: string[];
  steps_en: string[];
  cookTime: number;
  difficulty: Difficulty;
  spiceLevel: SpiceLevel;
  tags: string[];
  region?: string;
  popularity?: number;
};
