import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { saveHistory } from '../services/api';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Greetings! I am your AI Assistant. I can help you with any scenario. I prioritize local Ollama for speed, but I can also use Poe if needed. What is on your mind?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState('Initializing...');
  const [selectedProvider, setSelectedProvider] = useState('auto'); // 'auto', 'ollama', 'poe'
  const [localModel, setLocalModel] = useState('mistral');
  const scrollRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

  // Fetch config from backend on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/ai/config`);
        if (res.data.ollamaModel) setLocalModel(res.data.ollamaModel);
        setActiveProvider('Ready');
      } catch (err) {
        console.error("Failed to fetch AI config", err);
        setActiveProvider('Limited Mode');
      }
    };
    fetchConfig();
  }, [API_URL]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let responseData = null;
      let usedProvider = '';

      // Try Ollama if auto or specifically selected
      if (selectedProvider === 'auto' || selectedProvider === 'ollama') {
        usedProvider = 'Ollama (Local)';
        try {
          // PROXY through backend to avoid Browser CORS issues
          const ollamaResponse = await axios.post(`${API_URL}/api/ai/ollama-proxy`, {
            model: localModel, 
            messages: [{ role: 'user', content: input }],
            stream: false,
          }, { timeout: 10000 });

          // Ollama via proxy returns a string that needs parsing if it's raw JSON
          let data = ollamaResponse.data;
          if (typeof data === 'string') {
              try { data = JSON.parse(data); } catch(e) {}
          }

          if (data && data.message && data.message.content) {
            responseData = data.message.content;
          } else if (data && data.response) {
            responseData = data.response;
          } else if (data && data.error) {
              throw new Error(data.error);
          }
        } catch (err) {
          console.warn("Ollama proxy attempt failed:", err.message);
          if (selectedProvider === 'ollama') {
            throw new Error(`Ollama Proxy Failure: ${err.message}. Ensure Ollama is running at the server's localhost.`);
          }
        }
      }

      // Try Poe (via Backend) if still no response and auto or specifically selected
      if (!responseData && (selectedProvider === 'auto' || selectedProvider === 'poe')) {
        usedProvider = 'Poe API';
        const backendResponse = await axios.post(`${API_URL}/api/ai/assistant`, {
          input: input,
          provider: 'poe'
        });

        if (backendResponse.data && backendResponse.data.response) {
          responseData = backendResponse.data.response;
          // Check if it's an error message string from backend
          if (responseData.includes("Failure") || responseData.includes("Error")) {
              throw new Error(responseData);
          }
        } else {
            throw new Error("Poe API returned an empty or invalid response.");
        }
      }

      if (responseData) {
        setActiveProvider(usedProvider);
        setMessages(prev => [...prev, { role: 'assistant', content: responseData }]);
        
        // Save to global history
        const username = localStorage.getItem('username') || 'Guest';
        saveHistory({
          username,
          type: 'ASSISTANT',
          sourceText: input,
          resultText: responseData.length > 50 ? responseData.substring(0, 50) + '...' : responseData
        }).catch(() => {});
      } else {
        throw new Error("All AI systems (Local & Cloud) failed to respond.");
      }

    } catch (error) {
      console.error('AI Assistant Error:', error);
      setActiveProvider('Offline');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `System Warning: ${error.message}\n\nTroubleshooting:\n1. Ensure Backend (8081) is running.\n2. Ensure Ollama is running locally.\n3. Check Poe API Key in application.properties.` 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-[40px] shadow-2xl overflow-hidden border border-white/20 dark:border-gray-800 animate-in fade-in zoom-in duration-500">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-400/20 blur-2xl rounded-full -ml-10 -mb-10"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center text-3xl backdrop-blur-xl border border-white/30 shadow-2xl">
              🤖
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">Neural Assistant</h1>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${activeProvider.includes('Offline') ? 'bg-red-400' : 'bg-emerald-400'} shadow-lg`}></span>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{activeProvider}</p>
                </div>
                <div className="flex bg-black/20 p-1 rounded-xl backdrop-blur-md border border-white/10">
                    <button onClick={() => setSelectedProvider('auto')} className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${selectedProvider === 'auto' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/60 hover:text-white'}`}>Auto</button>
                    <button onClick={() => setSelectedProvider('ollama')} className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${selectedProvider === 'ollama' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/60 hover:text-white'}`}>Ollama</button>
                    <button onClick={() => setSelectedProvider('poe')} className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${selectedProvider === 'poe' ? 'bg-white text-blue-600 shadow-lg' : 'text-white/60 hover:text-white'}`}>Poe</button>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-center md:items-end gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Local Model</p>
            <input 
              type="text" 
              value={localModel} 
              onChange={(e) => setLocalModel(e.target.value)}
              className="bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-xs font-bold text-white outline-none focus:bg-white/10 w-32 md:w-auto text-center md:text-right"
              placeholder="e.g. mistral"
            />
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-8 bg-transparent custom-scrollbar"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
            {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs mr-3 mt-1 shadow-lg shrink-0">AI</div>
            )}
            <div className={`max-w-[75%] p-6 rounded-[32px] shadow-xl group transition-all hover:scale-[1.01] ${
              m.role === 'user' 
                ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-tr-none' 
                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
            }`}>
              <p className="text-base leading-relaxed font-medium whitespace-pre-wrap">{m.content}</p>
              <p className={`text-[9px] mt-3 font-black uppercase tracking-widest opacity-40 ${m.role === 'user' ? 'text-white' : 'text-slate-500'}`}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs mr-3 shadow-lg shrink-0 animate-spin">⚡</div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-[32px] rounded-tl-none border border-gray-100 dark:border-gray-700 shadow-xl flex gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-.5s]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-8 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800">
        <div className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="w-full p-6 pr-32 bg-white dark:bg-gray-800 rounded-[24px] border-2 border-slate-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-semibold text-gray-800 dark:text-gray-100 shadow-inner"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-3 top-3 bottom-3 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[18px] font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-30 disabled:hover:scale-100"
          >
            {isLoading ? 'SYNCING' : 'SEND'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
