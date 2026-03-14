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
            
            if (!raw || typeof raw !== 'string' || !raw.includes('{')) {
                throw new Error(raw || "Neural cluster returned malformed data.");
            }

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
            const errMsg = error.response?.data?.message || error.message || "Unknown Connection Fault";
            return {
                tone: 'friendly',
                politeness: 50,
                subtext: "Neural Analysis failed. " + errMsg,
                intensity: 'low',
                recommendedResponses: ["Strategy: Ensure your Poe API key is valid and backend is reachable.", "System Trace: " + (error.response?.status ? `HTTP ${error.response.status}` : errMsg)]
            };
        }
    }
}

export default new SentimentEngine();
