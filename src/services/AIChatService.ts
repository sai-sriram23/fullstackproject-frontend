import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

class AIChatService {
    async getResponse(userInput: string): Promise<ChatMessage> {
        try {
            const provider = localStorage.getItem('ai_provider') || 'poe';
            const response = await axios.post(`${API_URL}/api/ai/assistant`, {
                input: userInput,
                provider: provider
            });

            return {
                id: `ai-${Date.now()}`,
                text: response.data.response,
                sender: 'ai',
                timestamp: new Date()
            };
        } catch (error: any) {
            console.error("AI Assistant Error:", error);
            const errMsg = error.response?.data?.message || error.message || "Connection Offline";
            return {
                id: `err-${Date.now()}`,
                text: `I'm currently unable to connect. Error: ${errMsg}. Please ensure the backend is running and your API key is configured.`,
                sender: 'ai',
                timestamp: new Date()
            };
        }
    }

    getInitialMessage(): ChatMessage {
        return {
            id: 'init',
            text: `Hello! I'm your AI Assistant powered by advanced language models. I can help you with anything — answer questions, write code, explain concepts, brainstorm ideas, debug problems, or just chat. What can I help you with today?`,
            sender: 'ai',
            timestamp: new Date()
        };
    }
}

export default new AIChatService();
