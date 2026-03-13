import { TOPICS, DAILY_THEMES, VOCAB_SEEDS, COMMON_PHRASES } from '../constants/lessonData';

/**
 * ScenarioEngine generates dynamic language lessons algorithmically.
 */
class ScenarioEngine {
  /**
   * Generates a lesson based on a topic or today's date.
   * @param topic Optional topic. If not provided, it generates a daily challenge based on today's date.
   */
  async generateLesson(topic?: string, difficulty: string = 'beginner') {
    const isDaily = !topic;
    const finalTopic = topic || this.getDailyTopic();
    
    const useDialogue = Math.random() > 0.6;

    if (useDialogue) {
        return this.generateDialogueLesson(finalTopic, isDaily, difficulty);
    }

    const seedWords = this.getSeedWords(finalTopic, difficulty);
    
    const items = [];
    const vocabCount = Math.min(6, seedWords.length);
    for (let i = 0; i < vocabCount; i++) {
        items.push({
            word: seedWords[i],
            hint: `Vocabulary (${difficulty}) related to ${finalTopic}`
        });
    }

    const phrases = this.getRandomPhrases(difficulty, 2);
    phrases.forEach(p => {
        items.push({
            word: p,
            hint: `Contextual phrase (${difficulty})`
        });
    });

    return {
      title: isDaily ? `${difficulty.toUpperCase()} Challenge: ${finalTopic}` : `${difficulty.toUpperCase()} Explore: ${finalTopic}`,
      icon: isDaily ? '🔥' : '🔍',
      type: 'standard',
      difficulty,
      items: items.sort(() => Math.random() - 0.5)
    };
  }

  private async generateDialogueLesson(topic: string, isDaily: boolean, difficulty: string) {
    const speakers = ['Alex', 'Jordan', 'Sam', 'Casey'];
    const s1 = speakers[Math.floor(Math.random() * speakers.length)];
    const s2 = speakers.filter(s => s !== s1)[Math.floor(Math.random() * (speakers.length - 1))];

    const templates: Record<string, any[]> = {
      beginner: [
        { word: `Hi, is this ${topic.toLowerCase()}?`, hint: `Greeting`, speaker: s1 },
        { word: `Yes, welcome!`, hint: `Response`, speaker: s2 }
      ],
      citizen: [
        { word: `Pursuant to the local ordinances regarding ${topic.toLowerCase()}, I must inquire about your status.`, hint: `Formal inquiry`, speaker: s1 },
        { word: `I am fully compliant with the regulatory framework aforementioned.`, hint: `Formal response`, speaker: s2 }
      ]
    };

    const items = templates[difficulty] || [
        { word: `Hello ${s2}, how is the ${topic.toLowerCase()} today?`, hint: `${s1} starts the conversation`, speaker: s1 },
        { word: `It is very busy, but interesting! Do you like ${topic.toLowerCase()}?`, hint: `${s2} responds`, speaker: s2 }
    ];

    return {
        title: isDaily ? `${difficulty.toUpperCase()} Scenario: ${topic}` : `${difficulty.toUpperCase()} Conversation: ${topic}`,
        icon: '💬',
        type: 'dialogue',
        difficulty,
        items
    };
  }

  private getDailyTopic() {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_THEMES[dayOfYear % DAILY_THEMES.length];
  }

  private getSeedWords(topic: string, difficulty: string): string[] {
    if (VOCAB_SEEDS[topic] && VOCAB_SEEDS[topic][difficulty]) return [...VOCAB_SEEDS[topic][difficulty]];
    const fallback = ["Success", "Progress", "Language", "Learning"];
    return fallback.sort(() => Math.random() - 0.5);
  }

  private getRandomPhrases(difficulty: string, count: number): string[] {
    const pool = COMMON_PHRASES[difficulty] || ["Please help."];
    return pool.sort(() => Math.random() - 0.5).slice(0, count);
  }
}

export const scenarioEngine = new ScenarioEngine();
export default scenarioEngine;
