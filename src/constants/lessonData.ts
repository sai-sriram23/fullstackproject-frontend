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

export const DIFFICULTY_LEVELS = [
  { id: 'beginner', label: 'Beginner', icon: '🌱', xpMultiplier: 1 },
  { id: 'intermediate', label: 'Intermediate', icon: '🌿', xpMultiplier: 1.5 },
  { id: 'advanced', label: 'Advanced', icon: '🌳', xpMultiplier: 2 },
  { id: 'native', label: 'Native', icon: '🏙️', xpMultiplier: 3 },
  { id: 'citizen', label: 'Citizen', icon: '⚖️', xpMultiplier: 5 }
];

export const VOCAB_SEEDS: Record<string, Record<string, string[]>> = {
  "Travel & Adventure": {
    beginner: ["Airport", "Passport", "Luggage", "Ticket", "Hotel", "Map"],
    intermediate: ["Itinerary", "Reservation", "Customs", "Souvenir", "Sightseeing", "Currency"],
    advanced: ["Layover", "Embassy", "Expedition", "Backpacking", "Jet lag", "Hitchhiking"],
    native: ["Red-eye flight", "Globetrotting", "Off the beaten path", "Tourist trap", "Roughing it"],
    citizen: ["Visa waiver program", "Dual nationality", "Deportation order", "Consular assistance", "Naturalization certificate"]
  },
  "Science & Technology": {
    beginner: ["Computer", "Robot", "Space", "Internet", "Screen", "Mouse"],
    intermediate: ["Algorithm", "Experiment", "Laboratory", "Database", "Software", "Hardware"],
    advanced: ["Cryptography", "Neural network", "Superconductor", "Nanotechnology", "Quantum entanglement"],
    native: ["Cutting-edge", "Disruptive tech", "Silicon Valley", "Open-source", "Vaporware"],
    citizen: ["Intellectual property", "Patent infringement", "Digital sovereignty", "GDPR compliance", "Net neutrality"]
  },
  "Food & Culture": {
    beginner: ["Apple", "Bread", "Water", "Milk", "Rice", "Tea"],
    intermediate: ["Recipe", "Spices", "Cuisine", "Nutrition", "Appetizer", "Dessert"],
    advanced: ["Gourmet", "Fermentation", "Delicacy", "Sommelier", "Charcuterie", "Gastronomy"],
    native: ["Umami", "Farm-to-table", "Street food", "Comfort food", "Acquired taste"],
    citizen: ["Protected Designation of Origin", "Food security", "Agricultural subsidies", "Genetically modified", "Fair trade certification"]
  },
  "Business & Finance": {
    beginner: ["Money", "Work", "Office", "Sale", "Price"],
    intermediate: ["Contract", "Meeting", "Company", "Investment", "Marketing", "Economy"],
    advanced: ["Bankruptcy", "Acquisition", "Shareholder", "Liability", "Arbitrage", "Liquidity"],
    native: ["Bottom line", "Scalability", "Synergy", "Blue-chip company", "Ballpark figure"],
    citizen: ["Corporate governance", "Anti-trust regulations", "Tax evasions", "Fiscal transparency", "Public-private partnership"]
  },
  "History & Society": {
    beginner: ["King", "War", "Old", "City", "Flag"],
    intermediate: ["Century", "Culture", "Empire", "Revolution", "Democracy", "Freedom"],
    advanced: ["Archaeology", "Feudalism", "Civilization", "Renaissance", "Colonialism", "Heritage"],
    native: ["Turning point", "Melting pot", "Dark horse", "Status quo", "Silver lining"],
    citizen: ["Social contract", "Human rights", "Constitutional amendment", "Sovereignty", "Electoral college"]
  }
};

export const COMMON_PHRASES: Record<string, string[]> = {
  beginner: ["Hello", "How are you?", "Thank you", "Please", "Excuse me"],
  intermediate: ["Where is the nearest station?", "I would like to order", "What time is it?", "How much is this?"],
  advanced: ["Could you please elaborate on that?", "I am looking for a professional opinion", "That is a valid point", "I'm looking forward to our collaboration"],
  native: ["I'm feeling a bit under the weather", "That's a piece of cake", "Break a leg", "Don't count your chickens before they hatch"],
  citizen: ["I solemnly swear to uphold the constitution", "I request an extension on my filing", "According to the penal code", "The burden of proof lies with the prosecution"]
};

export const XP_PER_CORRECT = 10;
export const XP_PER_LESSON_COMPLETE = 100; // Increased for dynamic challenges
