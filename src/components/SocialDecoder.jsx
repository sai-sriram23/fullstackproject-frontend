import React, { useState, useEffect } from 'react';
import SentimentEngine from '../services/SentimentEngine';

const SocialDecoder = () => {
    const [input, setInput] = useState('');
    const [goal, setGoal] = useState('Build rapport/friendship');
    const [country, setCountry] = useState('France');
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [history, setHistory] = useState([]);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const result = await SentimentEngine.analyze(input, country, goal);
            const completeAnalysis = { ...result, timestamp: new Date() };
            setAnalysis(completeAnalysis);
            setHistory(prev => [completeAnalysis, ...prev.slice(0, 4)]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const targetGoals = [
        "Build rapport/friendship",
        "Maintain professional distance",
        "Resolve a misunderstanding",
        "Incorporate local humour",
        "Navigate a tricky refusal",
        "Evaluate romantic interest",
        "Scan for hidden sarcasm"
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-16 duration-1000 pb-20">
            {/* Neural Matrix Header */}
            <div className="relative overflow-hidden p-8 lg:p-12 bg-slate-900 text-white rounded-[40px] lg:rounded-[70px] border border-white/5 shadow-2xl group min-h-[200px] lg:min-h-[300px] flex items-center">
                <div className="absolute top-0 right-0 p-8 lg:p-16 opacity-5 text-[150px] lg:text-[280px] pointer-events-none group-hover:scale-110 transition-transform duration-[6000ms] text-blue-500">🧬</div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-600/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 lg:gap-16">
                    <div className="w-32 h-32 lg:w-48 lg:h-48 bg-slate-800 rounded-[35px] lg:rounded-[55px] border border-white/5 flex items-center justify-center text-5xl lg:text-7xl shadow-[0_40px_80px_rgba(0,0,0,0.5)] relative overflow-hidden group/icon">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 animate-pulse" />
                        <span className="relative z-10 group-hover/icon:scale-110 transition-transform duration-700">🔬</span>
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-4 lg:space-y-6">
                        <div className="inline-flex items-center gap-3 px-4 py-2 lg:px-6 lg:py-3 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-blue-500/20 shadow-lg">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                            Neural Decryption v5.0
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black tracking-tight leading-none mb-2">
                            Decode <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent italic">Subtext</span>.
                        </h1>
                        <p className="text-slate-400 max-w-2xl text-sm lg:text-lg font-medium leading-relaxed opacity-80">
                            Mistral-Logic enabled analysis. Paste any text to uncover hidden cultural layers.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,450px] gap-12">
                <div className="space-y-10">
                    {/* Input Lab */}
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-[60px] border border-slate-100 dark:border-slate-800/50 shadow-2xl relative">
                        <div className="absolute top-8 right-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Lab Status: Ready</div>
                        <div className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 ml-4">Target Culture</label>
                                    <select 
                                        value={country} 
                                        onChange={(e) => setCountry(e.target.value)}
                                        className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 font-bold text-sm outline-none focus:ring-8 focus:ring-blue-500/10 transition-all cursor-pointer shadow-sm hover:bg-white dark:hover:bg-slate-750"
                                    >
                                        <option>France</option>
                                        <option>Japan</option>
                                        <option>Germany</option>
                                        <option>UK</option>
                                        <option>Spain</option>
                                        <option>Italy</option>
                                        <option>Mexico</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 ml-4">Intended Outcome</label>
                                    <select 
                                        value={goal} 
                                        onChange={(e) => setGoal(e.target.value)}
                                        className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 font-bold text-sm outline-none focus:ring-8 focus:ring-blue-500/10 transition-all cursor-pointer shadow-sm hover:bg-white dark:hover:bg-slate-750"
                                    >
                                        {targetGoals.map(g => <option key={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 ml-4">Full Interaction Transcript</label>
                                <textarea 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Paste the message or conversation snippet here for deep evaluation..."
                                    className="w-full h-56 p-8 bg-slate-50 dark:bg-slate-800 rounded-[40px] border border-slate-200 dark:border-slate-700 outline-none focus:ring-8 focus:ring-blue-500/10 transition-all font-medium text-lg leading-relaxed shadow-inner resize-none"
                                />
                            </div>
                            <button 
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !input.trim()}
                                className="w-full py-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[30px] font-black text-2xl shadow-[0_30px_60px_rgba(37,99,235,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-6 disabled:opacity-50 overflow-hidden relative group"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                {isAnalyzing ? (
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        <span className="relative z-10">Running Neural Scanning...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span className="relative z-10 uppercase tracking-[0.2em]">Initiate Decoder</span>
                                        <span className="text-3xl relative z-10 group-hover:rotate-12 transition-transform">⚡</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Result Lab */}
                    {analysis && (
                        <div className="animate-in zoom-in-95 duration-1000 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="bg-slate-900 text-white p-12 rounded-[60px] border border-blue-500/20 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-10 opacity-5 text-9xl group-hover:rotate-12 transition-transform">💡</div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-8 flex items-center gap-4">
                                        <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                                        Logic Extraction
                                    </h3>
                                    <p className="text-2xl font-black italic leading-tight text-white mb-4">
                                        "{analysis.subtext}"
                                    </p>
                                    <div className="pt-6 border-t border-white/5 text-xs text-slate-400 font-bold tracking-widest uppercase italic">
                                        Probability: 92.4% Neural Confidence
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-12 rounded-[60px] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-8 flex items-center gap-4">
                                            <span className="w-2 h-6 bg-slate-300 rounded-full"></span>
                                            Metrics Dashboard
                                        </h3>
                                        <div className="space-y-10">
                                            <div>
                                                <div className="flex justify-between text-[11px] font-black text-slate-500 mb-4 uppercase tracking-[0.2em]">
                                                    <span>Politeness Saturation</span>
                                                    <span className="text-blue-500">{analysis.politeness}%</span>
                                                </div>
                                                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner p-1">
                                                    <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-1500 ease-out" style={{ width: `${analysis.politeness}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-6">
                                                <div className="flex-1 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 text-center group hover:bg-blue-600/5 transition-colors">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-blue-500 transition-colors">Detected Tone</p>
                                                    <p className="text-lg font-black capitalize tracking-tight">{analysis.tone}</p>
                                                </div>
                                                <div className="flex-1 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 text-center group hover:bg-emerald-600/5 transition-colors">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-emerald-500 transition-colors">Interaction Intensity</p>
                                                    <p className="text-lg font-black capitalize tracking-tight">{analysis.intensity}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-16 rounded-[70px] shadow-3xl relative overflow-hidden border border-white/5">
                                <div className="absolute top-0 right-0 p-16 opacity-10 text-[200px] pointer-events-none mb-4">✨</div>
                                <h3 className="text-xs font-black uppercase tracking-[0.5em] text-blue-400 mb-12 flex items-center gap-4">
                                    <span className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></span>
                                    AI-Optimized Counter-Strategies
                                </h3>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {analysis.recommendedResponses.map((resp, i) => {
                                        const [title, content] = resp.includes(':') ? resp.split(':') : ['Strategy', resp];
                                        return (
                                            <div key={i} className="bg-white/5 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 hover:bg-white/10 transition-all group cursor-pointer hover:-translate-y-2">
                                                <div className="p-3 bg-blue-600/20 rounded-2xl w-fit mb-6 text-blue-400 font-black text-[10px] uppercase tracking-widest leading-none">
                                                    {title}
                                                </div>
                                                <p className="text-lg font-medium italic opacity-80 group-hover:opacity-100 transition-opacity leading-relaxed">
                                                    "{content.trim()}"
                                                </p>
                                                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Copy Protocol</span>
                                                    <span className="text-xl">📋</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Interaction Log */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-slate-900 p-12 rounded-[60px] shadow-2xl border border-slate-100 dark:border-slate-800 space-y-10 h-fit sticky top-24">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2 flex items-center gap-4">
                            <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                            Neural Memory Hub
                        </h2>
                        <div className="space-y-6">
                            {history.length > 0 ? history.map((item, i) => (
                                <div key={i} className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[40px] border border-slate-100 dark:border-slate-800 relative group overflow-hidden hover:border-blue-600/30 transition-all cursor-pointer">
                                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Load ↗</span>
                                    </div>
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.tone}</p>
                                    </div>
                                    <p className="text-sm font-black truncate leading-tight italic text-slate-700 dark:text-slate-300">"{item.subtext}"</p>
                                </div>
                            )) : (
                                <div className="py-32 text-center opacity-20 italic space-y-6">
                                    <div className="text-7xl">🌫️</div>
                                    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-900 dark:text-white">Neural Void</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-10 mt-10 border-t border-slate-100 dark:border-slate-800">
                            <div className="p-8 bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-transparent rounded-[40px] border border-blue-500/10 group overflow-hidden relative">
                                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-600/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                                    <span className="text-2xl group-hover:rotate-12 transition-transform">🧠</span>
                                    Neural Insight
                                </p>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-chill opacity-80">
                                    Always consider the "High-Low Context" spectrum. In Germany, subtext is minimal (Direct). In Japan, subtext is everything (Indirect).
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SocialDecoder;
