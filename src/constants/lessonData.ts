export const SKILLS = [
  "Basics 1", "Basics 2", "Food & Drink", "Animals", "Family",
  "Plurals", "Clothing", "Colors", "Directions", "Verbs: Present",
  "Abstract Objects", "Communication", "Time & Date", "Emotions"
];

export const DAILY_THEMES = [
  "Daily Routine", "Common Objects", "Nature", "Social Media", "Shopping"
];

export const DIFFICULTY_LEVELS = [
  { id: 'beginner', label: 'Beginner', icon: '🌱' },
  { id: 'intermediate', label: 'Intermediate', icon: '🌿' },
  { id: 'advanced', label: 'Advanced', icon: '🌳' }
];

export const VOCAB_SEEDS: Record<string, Record<string, string[]>> = {
  "Basics 1": {
    beginner: ["Hello", "Good morning", "Boy", "Girl", "Man", "Woman", "Apple", "Eat"],
    intermediate: ["Friend", "Teacher", "Student", "School", "Book", "Write"],
    advanced: ["Knowledge", "Education", "Wisdom", "Curiosity", "Scholar", "Philosophy"]
  },
  "Food & Drink": {
    beginner: ["Water", "Milk", "Bread", "Rice", "Tea", "Coffee", "Fruit", "Vegetable"],
    intermediate: ["Breakfast", "Lunch", "Dinner", "Recipe", "Plate", "Sugar", "Salt", "Spicy"],
    advanced: ["Fermentation", "Gourmet", "Nutrition", "Ingredient", "Appetizer", "Main course"]
  },
  "Animals": {
    beginner: ["Dog", "Cat", "Bird", "Fish", "Horse", "Cow", "Pig", "Lion"],
    intermediate: ["Tiger", "Elephant", "Monkey", "Giraffe", "Snake", "Insect", "Wildlife", "Habitat"],
    advanced: ["Biodiversity", "Ecosystem", "Carnivore", "Herbivore", "Migration", "Evolution"]
  },
  "Family": {
    beginner: ["Mother", "Father", "Brother", "Sister", "Baby", "Family"],
    intermediate: ["Grandmother", "Grandfather", "Cousin", "Aunt", "Uncle", "Parents"],
    advanced: ["Ancestry", "Genealogy", "Relationship", "Heritage", "Generation", "Sibling"]
  },
  "Verbs: Present": {
    beginner: ["Run", "Walk", "Sleep", "Talk", "See", "Hear", "Wait"],
    intermediate: ["Thinking", "Helping", "Learning", "Traveling", "Creating", "Planning"],
    advanced: ["Considering", "Implementing", "Analyzing", "Synthesizing", "Collaborating"]
  }
};

export const COMMON_PHRASES: Record<string, string[]> = {
  beginner: ["How are you?", "My name is...", "Where is...?", "I am hungry", "I am happy"],
  intermediate: ["I would like a glass of water", "Where is the nearest bank?", "How much does this cost?", "I don't understand"],
  advanced: ["Could you please explain this concept?", "I'm looking forward to meeting you", "It's a pleasure to be here", "What do you recommend?"]
};

export const XP_PER_CORRECT = 10;
export const XP_PER_LESSON_COMPLETE = 50; 
