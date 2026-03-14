import React, { useState, useEffect, useRef } from 'react';
import ChatService from '../services/CulturalChatService';

const SituationalAI = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [country, setCountry] = useState('France');
    const [isTyping, setIsTyping] = useState(false);
    const [typingState, setTypingState] = useState('');
    const scrollRef = useRef(null);

    useEffect(() => {
        const init = ChatService.getInitialMessage(country);
        setMessages([init]);
    }, [country]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (text) => {
        const userMsg = {
            id: `user-${Date.now()}`,
            text: text || input,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);
        
        const states = ["Synthesizing Cultural Database...", "Analyzing Local Sentiments...", "Consulting Etiquette Protocols...", "Generating Strategy..."];
        let stateIdx = 0;
        const interval = setInterval(() => {
            setTypingState(states[stateIdx % states.length]);
            stateIdx++;
        }, 1200);

        try {
            const resp = await ChatService.getResponse(text || input, country);
            setMessages(prev => [...prev, resp]);
        } catch (e) {
            console.error(e);
        } finally {
            clearInterval(interval);
            setIsTyping(false);
            setTypingState('');
        }
    };

    const scenarios = [
        { label: "Make friends with locals", icon: "🤝" },
        { label: "Introduce self to colleagues", icon: "👔" },
        { label: "Meeting people at a cafe", icon: "☕" },
        { label: "Dining at a local restaurant", icon: "🍷" },
        { label: "Asking for directions", icon: "🗺️" },
        { label: "Handle a polite refusal", icon: "✋" }
    ];

    const countries = ["France", "Japan", "Germany", "Spain", "China", "Mexico", "Italy", "UK", "USA", "UAE"];

    const formatAIRestponse = (text) => {
        if (!text) return null;
        const sections = text.split(/\d\.\s/);
        if (sections.length < 2) return <p className="leading-relaxed">{text}</p>;

        return (
            <div className="space-y-4">
                {sections.map((section, idx) => {
                    if (!section.trim()) return null;
                    const parts = section.split(':');
                    const title = parts[0];
                    const content = parts.slice(1).join(':');

                    return (
                        <div key={idx} className="bg-white/10 dark:bg-black/20 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">{title}</h4>
                            <p className="text-sm font-medium leading-relaxed opacity-90">{content || title}</p>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-4 lg:gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-10">
            {/* Ultra-Premium Header - Now much more compact */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 text-white p-4 lg:p-6 rounded-[30px] lg:rounded-[40px] shadow-2xl relative overflow-hidden group border border-white/10">
                <div className="absolute top-0 right-0 p-4 lg:p-8 opacity-10 text-[80px] lg:text-[120px] pointer-events-none group-hover:scale-110 transition-transform duration-[4000ms]">🤖</div>
                <div className="relative z-10 flex items-center gap-4 lg:gap-6">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl lg:rounded-2xl flex items-center justify-center text-2xl lg:text-3xl shadow-lg animate-pulse">
                        🎛️
                    </div>
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight">Cultural <span className="text-blue-500">Concierge</span></h1>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em] flex items-center gap-2 mt-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Neural Native Protocols
                        </p>
                    </div>
                </div>
                <div className="flex flex-col gap-1 bg-white/5 p-3 lg:p-4 rounded-2xl border border-white/10 backdrop-blur-md min-w-[200px]">
                    <span className="text-[8px] lg:text-[9px] font-black px-2 text-slate-400 uppercase tracking-widest">Target Geography</span>
                    <select 
                        value={country} 
                        onChange={(e) => setCountry(e.target.value)}
                        className="bg-transparent text-sm lg:text-lg font-black p-1 rounded-lg outline-none cursor-pointer hover:text-blue-400 transition-colors"
                    >
                        {countries.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6 lg:gap-8 min-h-[500px]">
                {/* Chat Window */}
                <div className="flex flex-col bg-white dark:bg-slate-900 rounded-[30px] lg:rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative min-h-[450px]">
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-8">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                                <div className={`max-w-[80%] p-8 rounded-[40px] shadow-xl text-sm font-medium leading-relaxed
                                    ${msg.sender === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-100 dark:border-slate-700'}`}>
                                    {msg.sender === 'ai' ? formatAIRestponse(msg.text) : msg.text}
                                    <div className={`text-[10px] mt-4 font-black opacity-30 uppercase tracking-[0.2em] ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                        {msg.sender === 'user' ? 'Transmission sent' : 'Neural Core'} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[40px] rounded-tl-none border border-slate-100 dark:border-slate-700 flex flex-col gap-4">
                                    <div className="flex gap-2">
                                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></span>
                                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                    <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.3em]">{typingState}</p>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>

                    <div className="p-8 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                        <div className="relative group">
                            <input 
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && input.trim() && handleSend()}
                                placeholder="Consult the Neural native engine..."
                                className="w-full bg-white dark:bg-slate-800 py-6 pl-10 pr-24 rounded-[30px] border border-slate-200 dark:border-slate-700 outline-none focus:ring-8 focus:ring-blue-500/10 transition-all font-bold text-lg shadow-inner"
                            />
                            <button 
                                onClick={() => input.trim() && handleSend()}
                                disabled={!input.trim() || isTyping}
                                className="absolute right-4 top-1/2 -translate-y-1/2 px-10 h-14 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[20px] shadow-xl hover:scale-105 active:scale-95 disabled:opacity-30 transition-all flex items-center justify-center font-black uppercase tracking-widest text-xs"
                            >
                                Send Data
                            </button>
                        </div>
                        <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-[0.3em] opacity-40">Mistral-7B Class Neural Interaction Layer</p>
                    </div>
                </div>

                {/* Intelligent Sidebar */}
                <div className="flex flex-col gap-8">
                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[60px] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col h-fit overflow-hidden relative">
                        <div className="absolute -top-4 -right-4 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl pointer-events-none"></div>
                        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8 flex items-center gap-4">
                            <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                            Neural Templates
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            {scenarios.map((s, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleSend(s.label)}
                                    className="w-full text-left p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/40 hover:bg-blue-600/[0.04] transition-all group relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-5 relative z-10 transition-transform group-hover:translate-x-2">
                                        <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all">{s.icon}</span>
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 leading-tight uppercase tracking-widest">{s.label}</span>
                                    </div>
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 dark:text-white text-6xl pointer-events-none transform translate-x-3 duration-500">✦</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[60px] text-white shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner animate-bounce">⚡</div>
                            <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-4 opacity-80">Pro Cultural Secret</h3>
                            <p className="text-sm font-medium leading-relaxed italic opacity-90">
                                Language is only 20% of the conversation. In high-context cultures like Japan or France, silence and pauses carry more weight than words.
                            </p>
                        </div>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity duration-1000" />
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SituationalAI;
