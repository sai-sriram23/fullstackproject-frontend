import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export interface SentimentAnalysis {
    tone: 'formal' | 'informal' | 'aggressive' | 'sarcastic' | 'friendly';
    politeness: number; // 0-100
    subtext: string;
    intensity: 'high' | 'medium' | 'low';
    recommendedResponses: string[];
}

class SentimentEngine {
    async analyze(text: string, country: string, goal: string): Promise<SentimentAnalysis> {
        try {
            const response = await axios.post(`${API_URL}/api/ai/decode`, {
                text: text,
                country: country,
                goal: goal
            });

            const raw = response.data.rawResponse;
            const parsed = JSON.parse(raw);

            return {
                tone: parsed.tone || 'friendly',
                politeness: parsed.politeness || 80,
                subtext: parsed.subtext || "No deep subtext detected.",
                intensity: parsed.intensity || 'medium',
                recommendedResponses: parsed.recommendations || []
            };
        } catch (error: any) {
            console.error("AI Analysis Error:", error);
            return {
                tone: 'friendly',
                politeness: 50,
                subtext: "Neural Analysis failed. Please check your backend connection.",
                intensity: 'low',
                recommendedResponses: ["Backend Error: " + error.message]
            };
        }
    }
}

export default new SentimentEngine();
