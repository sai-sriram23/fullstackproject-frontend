import { TOPICS, DAILY_THEMES, VOCAB_SEEDS, COMMON_PHRASES } from '../constants/lessonData';

/**
 * ScenarioEngine generates dynamic language lessons algorithmically.
 */
class ScenarioEngine {
  /**
   * Generates a lesson based on a topic or today's date.
   * @param topic Optional topic. If not provided, it generates a daily challenge based on today's date.
   */
  async generateLesson(topic?: string) {
    const isDaily = !topic;
    const finalTopic = topic || this.getDailyTopic();
    
    // Randomly decide between a vocabulary lesson or a dialogue scenario (60/40 split)
    const useDialogue = Math.random() > 0.6;

    if (useDialogue) {
        return this.generateDialogueLesson(finalTopic, isDaily);
    }

    const seedWords = this.getSeedWords(finalTopic);
    
    // Construct lesson items
    const items = [];
    
    // Add 5-6 vocabulary items
    const vocabCount = Math.min(6, seedWords.length);
    for (let i = 0; i < vocabCount; i++) {
        items.push({
            word: seedWords[i],
            hint: `Vocabulary related to ${finalTopic}`
        });
    }

    // Add 2-3 contextual phrases
    const phrases = this.getRandomPhrases(finalTopic, 2);
    phrases.forEach(p => {
        items.push({
            word: p,
            hint: `Contextual phrase for ${finalTopic}`
        });
    });

    return {
      title: isDaily ? `Daily Challenge: ${finalTopic}` : `Explore: ${finalTopic}`,
      icon: isDaily ? '🔥' : '🔍',
      type: 'standard',
      items: items.sort(() => Math.random() - 0.5)
    };
  }

  private async generateDialogueLesson(topic: string, isDaily: boolean) {
    const speakers = ['Alex', 'Jordan', 'Sam', 'Casey'];
    const s1 = speakers[Math.floor(Math.random() * speakers.length)];
    const s2 = speakers.filter(s => s !== s1)[Math.floor(Math.random() * (speakers.length - 1))];

    // Simple dialogue template generation
    const items = [
        { word: `Hello ${s2}, how is the ${topic.toLowerCase()} today?`, hint: `${s1} starts the conversation`, speaker: s1 },
        { word: `It is very busy, but interesting! Do you like ${topic.toLowerCase()}?`, hint: `${s2} responds`, speaker: s2 },
        { word: `Yes, I think ${topic.toLowerCase()} is the key to the future.`, hint: `${s1} gives an opinion`, speaker: s1 },
        { word: `That is true. Let us explore more about ${topic.toLowerCase()} together!`, hint: `Closing the dialogue`, speaker: s2 }
    ];

    return {
        title: isDaily ? `Daily Scenario: ${topic}` : `Conversation: ${topic}`,
        icon: '💬',
        type: 'dialogue',
        items: items
    };
  }

  private getDailyTopic() {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return DAILY_THEMES[dayOfYear % DAILY_THEMES.length];
  }

  private getSeedWords(topic: string): string[] {
    if (VOCAB_SEEDS[topic]) return [...VOCAB_SEEDS[topic]];
    const fallback = ["Success", "Progress", "Language", "Learning", "Dynamic", "Future", "Experience", "Challenge"];
    return fallback.sort(() => Math.random() - 0.5);
  }

  private getRandomPhrases(topic: string, count: number): string[] {
    const selected = COMMON_PHRASES.sort(() => Math.random() - 0.5).slice(0, count);
    return selected.map(p => `${p} ${topic.toLowerCase()}.`);
  }
}

export const scenarioEngine = new ScenarioEngine();
export default scenarioEngine;
