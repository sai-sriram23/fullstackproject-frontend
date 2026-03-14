import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    type?: 'text' | 'advice' | 'suggestion';
}

class CulturalChatService {
    async getResponse(userInput: string, country: string): Promise<ChatMessage> {
        try {
            const provider = localStorage.getItem('ai_provider') || 'poe';
            const response = await axios.post(`${API_URL}/api/ai/chat`, {
                input: userInput,
                country: country,
                provider: provider
            });

            return {
                id: `ai-${Date.now()}`,
                text: response.data.response,
                sender: 'ai',
                timestamp: new Date()
            };
        } catch (error: any) {
            console.error("AI Error:", error);
            const errMsg = error.response?.data?.message || error.message || "Connection Offline";
            return {
                id: `err-${Date.now()}`,
                text: `My neural sensors are currently offline. Error: ${errMsg}. Please ensure the backend is connected and the POE API key is valid.`,
                sender: 'ai',
                timestamp: new Date()
            };
        }
    }

    getInitialMessage(country: string): ChatMessage {
        return {
            id: 'init',
            text: `Bonjour! I am your Neural Cultural Concierge. I see you are in ${country}. As a live AI assistant, I can help you navigate local customs, introduce yourself, or become friends with locals. How can I assist you today?`,
            sender: 'ai',
            timestamp: new Date()
        };
    }
}

export default new CulturalChatService();
