export const TOPICS = [
  "At a Restaurant", "Space Exploration", "Quantum Physics", "Cyberpunk Future", 
  "Medieval Fantasy", "Deep Sea Diving", "A Sunny Beach", "Airport Chaos",
  "Cooking Pizza", "Zombie Apocalypse", "Romantic Date", "Job Interview",
  "Lost in a Forest", "Superhero Training", "Art Gallery", "Music Festival"
];

export const DAILY_THEMES = [
  "Travel & Adventure", "Science & Technology", "Nature & Wildlife", 
  "Food & Culture", "Arts & Entertainment", "Business & Finance",
  "Health & Wellness", "History & Society"
];

export const VOCAB_SEEDS: Record<string, string[]> = {
  "Travel & Adventure": ["Airport", "Passport", "Adventure", "Destination", "Passenger", "Luggage", "Souvenir", "Flight"],
  "Science & Technology": ["Computer", "Algorithm", "Experiment", "Discovery", "Robot", "Space", "Internet", "Code"],
  "Nature & Wildlife": ["Forest", "Mountain", "Animal", "Ocean", "Garden", "Bird", "River", "Flower"],
  "Food & Culture": ["Kitchen", "Delicious", "Recipe", "Tradition", "Market", "Spices", "Bread", "Dinner"],
  "Arts & Entertainment": ["Painting", "Music", "Cinema", "Concert", "Stage", "Gallery", "Dance", "Actor"],
  "Business & Finance": ["Meeting", "Office", "Project", "Contract", "Economy", "Invest", "Company", "Market"],
  "Health & Wellness": ["Doctor", "Exercise", "Healthy", "Medicine", "Meditation", "Sport", "Nurse", "Sleep"],
  "History & Society": ["History", "Ancient", "Culture", "Century", "Politics", "Leader", "Nations", "War"]
};

export const COMMON_PHRASES = [
  "I want to learn more about", "Where can I find the", "That is very interesting",
  "Could you please help me?", "How much does this cost?", "I really enjoy this",
  "Can you explain the significance?", "This is a beautiful example of"
];

export const XP_PER_CORRECT = 10;
export const XP_PER_LESSON_COMPLETE = 100; // Increased for dynamic challenges
