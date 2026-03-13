import { SKILLS, DAILY_THEMES, VOCAB_SEEDS, COMMON_PHRASES } from '../constants/lessonData';

/**
 * ScenarioEngine generates dynamic language lessons focused on Skill Trees.
 */
class ScenarioEngine {
  async generateLesson(skill?: string, difficulty: string = 'beginner', unitId?: number) {
    const finalSkill = skill || this.getDailySkill();
    
    // Skill Tree lessons focus on vocab drills and matching
    const randomSeed = Math.random();
    const useMatch = randomSeed > 0.6;
    const useWordBank = randomSeed < 0.3;

    const seedWords = this.getSeedWords(finalSkill, difficulty);
    const items = [];
    const vocabCount = Math.min(6, seedWords.length);
    for (let i = 0; i < vocabCount; i++) {
        items.push({
            word: seedWords[i],
            hint: `Concept (${difficulty}): ${finalSkill}`,
            tokens: this.tokenize(seedWords[i])
        });
    }

    const phrases = this.getRandomPhrases(difficulty, 1);
    phrases.forEach(p => {
        items.push({
            word: p,
            hint: `Common usage`,
            tokens: this.tokenize(p)
        });
    });

    return {
      title: `${difficulty.toUpperCase()} • ${finalSkill}`,
      icon: '💎',
      type: useMatch ? 'match' : (useWordBank ? 'wordbank' : 'standard'),
      difficulty,
      items: items.sort(() => Math.random() - 0.5)
    };
  }

  private tokenize(text: string): string[] {
    return text.split(' ').filter(word => word.length > 0);
  }

  public getLearningPath() {
    // A hierarchical Skill Tree structure
    return [
      { id: 1, title: 'Basics 1', icon: '🥚', topic: 'Basics 1', difficulty: 'beginner' },
      { id: 2, title: 'Food & Drink', icon: '🍎', topic: 'Food & Drink', difficulty: 'beginner' },
      { id: 3, title: 'Animals', icon: '🐱', topic: 'Animals', difficulty: 'beginner' },
      { id: 4, title: 'Basics 2', icon: '📖', topic: 'Basics 1', difficulty: 'intermediate' },
      { id: 5, title: 'Family', icon: '👨‍👩‍👧', topic: 'Family', difficulty: 'beginner' },
      { id: 6, title: 'Verbs', icon: '🏃', topic: 'Verbs: Present', difficulty: 'beginner' },
    ];
  }

  private getDailySkill() {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return SKILLS[dayOfYear % SKILLS.length];
  }

  private getSeedWords(skill: string, difficulty: string): string[] {
    if (VOCAB_SEEDS[skill] && VOCAB_SEEDS[skill][difficulty]) return [...VOCAB_SEEDS[skill][difficulty]];
    // Fallback if the skill isn't in VOCAB_SEEDS (some NEW SKILLS might not have seeds yet)
    return ["Learn", "Practice", "Improve", "Master"].sort(() => Math.random() - 0.5);
  }

  private getRandomPhrases(difficulty: string, count: number): string[] {
    const pool = COMMON_PHRASES[difficulty] || ["Hello."];
    return pool.sort(() => Math.random() - 0.5).slice(0, count);
  }
}

export const scenarioEngine = new ScenarioEngine();
export default scenarioEngine;
