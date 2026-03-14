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
        <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 pb-20">
            {/* Neural Matrix Header */}
            <div className="relative overflow-hidden p-6 lg:p-10 bg-slate-900 text-white rounded-[30px] lg:rounded-[50px] border border-white/5 shadow-2xl group min-h-[180px] lg:min-h-[250px] flex items-center">
                <div className="absolute top-0 right-0 p-6 lg:p-12 opacity-5 text-[100px] lg:text-[180px] pointer-events-none group-hover:scale-110 transition-transform duration-[6000ms] text-blue-500">🧬</div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-600/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 lg:gap-10">
                    <div className="w-24 h-24 lg:w-32 lg:h-32 bg-slate-800 rounded-2xl lg:rounded-[40px] border border-white/5 flex items-center justify-center text-4xl lg:text-5xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group/icon">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 animate-pulse" />
                        <span className="relative z-10 group-hover/icon:scale-110 transition-transform duration-700">🔬</span>
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-3 lg:space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 lg:px-5 lg:py-2 bg-blue-500/10 text-blue-400 rounded-full text-[9px] font-black uppercase tracking-[0.3em] border border-blue-500/20 shadow-lg">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                            Neural Decryption v5.0
                        </div>
                        <h1 className="text-3xl lg:text-5xl font-black tracking-tight leading-none">
                            Decode <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent italic">Subtext</span>.
                        </h1>
                        <p className="text-slate-400 max-w-2xl text-xs lg:text-sm font-medium leading-relaxed opacity-80">
                            Mistral-Logic enabled analysis. Paste any text for deep cultural evaluation.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr,350px] gap-6 lg:gap-8">
                <div className="space-y-10">
                    {/* Input Lab */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800/50 shadow-2xl relative">
                        <div className="absolute top-6 right-8 text-[8px] font-black uppercase tracking-[0.2em] text-slate-300">Lab Status: Ready</div>
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">Culture</label>
                                    <select 
                                        value={country} 
                                        onChange={(e) => setCountry(e.target.value)}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer shadow-sm hover:bg-white dark:hover:bg-slate-750"
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
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">Goal</label>
                                    <select 
                                        value={goal} 
                                        onChange={(e) => setGoal(e.target.value)}
                                        className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-xs outline-none focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer shadow-sm hover:bg-white dark:hover:bg-slate-750"
                                    >
                                        {targetGoals.map(g => <option key={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4">Interaction Transcript</label>
                                <textarea 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Paste message for deep evaluation..."
                                    className="w-full h-40 p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-sm leading-relaxed shadow-inner resize-none"
                                />
                            </div>
                            <button 
                                onClick={handleAnalyze}
                                disabled={isAnalyzing || !input.trim()}
                                className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl font-black text-xl shadow-[0_20px_40px_rgba(37,99,235,0.2)] hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 overflow-hidden relative group"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                {isAnalyzing ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                                        <span className="relative z-10 text-base">Scanning Neural Matrix...</span>
                                    </div>
                                ) : (
                                    <>
                                        <span className="relative z-10 uppercase tracking-[0.2em] text-sm lg:text-base">Initiate Decoder</span>
                                        <span className="text-2xl relative z-10 group-hover:rotate-12 transition-transform">⚡</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Result Lab */}
                    {analysis && (
                        <div className="animate-in zoom-in-95 duration-1000 space-y-6 lg:space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
                                <div className="bg-slate-900 text-white p-8 rounded-[40px] border border-blue-500/20 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-6 opacity-5 text-7xl group-hover:rotate-12 transition-transform">💡</div>
                                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-400 mb-6 flex items-center gap-3">
                                        <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                                        Logic Extraction
                                    </h3>
                                    <p className="text-xl font-black italic leading-tight text-white mb-4">
                                        "{analysis.subtext}"
                                    </p>
                                    <div className="pt-4 border-t border-white/5 text-[9px] text-slate-400 font-bold tracking-widest uppercase italic">
                                        Neural Confidence: 94.8%
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 flex items-center gap-3">
                                            <span className="w-1.5 h-4 bg-slate-300 rounded-full"></span>
                                            Metrics Dashboard
                                        </h3>
                                        <div className="space-y-6">
                                            <div>
                                                <div className="flex justify-between text-[10px] font-black text-slate-500 mb-2 uppercase tracking-[0.1em]">
                                                    <span>Politeness Saturation</span>
                                                    <span className="text-blue-500">{analysis.politeness}%</span>
                                                </div>
                                                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner p-0.5">
                                                    <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-1500 ease-out" style={{ width: `${analysis.politeness}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center group hover:bg-blue-600/5 transition-colors">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">Tone</p>
                                                    <p className="text-base font-black capitalize tracking-tight">{analysis.tone}</p>
                                                </div>
                                                <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-center group hover:bg-emerald-600/5 transition-colors">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-emerald-500 transition-colors">Intensity</p>
                                                    <p className="text-base font-black capitalize tracking-tight">{analysis.intensity}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-10 lg:p-14 rounded-[50px] shadow-3xl relative overflow-hidden border border-white/5">
                                <div className="absolute top-0 right-0 p-12 opacity-10 text-[150px] pointer-events-none mb-4">✨</div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400 mb-8 lg:mb-10 flex items-center gap-3">
                                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping"></span>
                                    AI-Optimized Counter-Strategies
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                                    {analysis.recommendedResponses.map((resp, i) => {
                                        const [title, content] = resp.includes(':') ? resp.split(':') : ['Strategy', resp];
                                        return (
                                            <div key={i} className="bg-white/5 backdrop-blur-xl p-6 rounded-[30px] border border-white/10 hover:bg-white/10 transition-all group cursor-pointer hover:-translate-y-1">
                                                <div className="p-2 bg-blue-600/20 rounded-xl w-fit mb-4 text-blue-400 font-black text-[9px] uppercase tracking-widest leading-none">
                                                    {title}
                                                </div>
                                                <p className="text-base font-medium italic opacity-80 group-hover:opacity-100 transition-opacity leading-relaxed">
                                                    "{content.trim()}"
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Interaction Log */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 space-y-8 h-fit sticky top-24">
                        <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 flex items-center gap-3">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                            Neural Memory Hub
                        </h2>
                        <div className="space-y-4">
                            {history.length > 0 ? history.map((item, i) => (
                                <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[30px] border border-slate-100 dark:border-slate-800 relative group overflow-hidden transition-all cursor-pointer hover:border-blue-500/20">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.tone}</p>
                                    </div>
                                    <p className="text-xs font-black truncate text-slate-700 dark:text-slate-300 italic">"{item.subtext}"</p>
                                </div>
                            )) : (
                                <div className="py-20 text-center opacity-20 italic">
                                    <div className="text-5xl mb-4">🌫️</div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white">Neural Void</p>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/50">
                            <div className="p-6 bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-transparent rounded-[30px] border border-blue-500/10">
                                <p className="text-[10px] font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                    <span className="text-xl">🧠</span>
                                    Neural Insight
                                </p>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed opacity-80">
                                    Cultural context is the hidden dimension of language.
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
