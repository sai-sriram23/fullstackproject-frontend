import React, { useState, useEffect, useRef } from 'react';
import { languages, getLanguageName } from '../constants/languages';
import { saveHistory } from '../services/api';
import axios from 'axios';

const Translator = () => {
    const [mode, setMode] = useState('text-to-text');
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [srcLang, setSrcLang] = useState('en');
    const [tgtLang, setTgtLang] = useState('fr');
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState(null);
    const [insight, setInsight] = useState(null);
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const worker = useRef(null);
    const recognition = useRef(null);
    const synthesis = useRef(window.speechSynthesis);

    useEffect(() => {
        if (!worker.current) {
            worker.current = new Worker(new URL('../worker.ts', import.meta.url), { type: 'module' });
        }
        const onMessage = (e) => {
            const { status, output, error } = e.data;
            if (status === 'initiate') {
                setIsLoading(true);
            } else if (status === 'progress') {
                setProgress(e.data);
            } else if (status === 'complete') {
                setIsLoading(false);
                const translated = output[0].translation_text;
                setOutputText(translated);
                setProgress(null);
                if (mode === 'text-to-speech' || mode === 'speech-to-speech') {
                    speak(translated, tgtLang);
                }
                const username = localStorage.getItem('username') || 'Guest';
                saveHistory({
                    username,
                    type: mode.toUpperCase().replace(/-/g, '_'),
                    sourceText: inputText,
                    resultText: translated
                }).catch(() => {});
            } else if (status === 'error') {
                setIsLoading(false);
                setError(error);
                console.error('Translation Error:', error);
            }
        };
        worker.current.addEventListener('message', onMessage);
        return () => worker.current?.removeEventListener('message', onMessage);
    }, [mode, inputText, tgtLang]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognition.current = new SpeechRecognition();
            recognition.current.continuous = false;
            recognition.current.interimResults = false;
            recognition.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInputText(transcript);
                setIsRecording(false);
            };
            recognition.current.onerror = () => setIsRecording(false);
            recognition.current.onend = () => setIsRecording(false);
        }
    }, []);

    const speak = (text, langCode) => {
        if (!synthesis.current) return;
        synthesis.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = synthesis.current.getVoices();
        const langShort = langCode.split('_')[0];
        const voice = voices.find(v => v.lang.startsWith(langShort));
        if (voice) utterance.voice = voice;
        synthesis.current.speak(utterance);
    };

    const handleTranslate = () => {
        if (!worker.current || !inputText.trim()) return;
        setIsLoading(true);
        setError(null);
        setOutputText('');
        worker.current.postMessage({
            text: inputText,
            src_lang: srcLang,
            tgt_lang: tgtLang
        });
    };

    const toggleRecording = () => {
        if (isRecording) {
            recognition.current?.stop();
        } else {
            setInputText('');
            recognition.current.lang = srcLang.split('_')[0];
            recognition.current?.start();
            setIsRecording(true);
        }
    };

    const handleSwap = () => {
        const temp = srcLang;
        setSrcLang(tgtLang);
        setTgtLang(temp);
        if (outputText) {
            setInputText(outputText);
            setOutputText('');
            setInsight(null);
        }
    };

    const getInsight = async () => {
        if (!outputText) return;
        setIsInsightLoading(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';
            const provider = localStorage.getItem('ai_provider') || 'poe';
            const resp = await axios.post(`${API_URL}/api/ai/translate-insight`, {
                text: inputText,
                translation: outputText,
                targetLang: getLanguageName(tgtLang),
                provider: provider
            });
            setInsight(resp.data.insight);
        } catch (e) {
            console.error(e);
        } finally {
            setIsInsightLoading(false);
        }
    };

    const modes = [
        { id: 'text-to-text', label: 'Text', icon: '📝' },
        { id: 'text-to-speech', label: 'Listen', icon: '🔊' },
        { id: 'speech-to-text', label: 'Dictate', icon: '🎙️' },
        { id: 'speech-to-speech', label: 'Voice Pass', icon: '🗣️' },
    ];

    return (
        <div className="max-w-6xl mx-auto p-4 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-20">
            {/* Header Section */}
            <div className="text-center space-y-6 pt-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/5 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2 border border-blue-500/10 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Neural Multimodal Engine 2.0
                </div>
                <h1 className="text-6xl font-black tracking-tight leading-tight">
                    <span className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-700 dark:from-white dark:via-slate-200 dark:to-blue-400 bg-clip-text text-transparent">
                        Unified Translator
                    </span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-base font-medium leading-relaxed">
                    Bridge language barriers with our state-of-the-art multimodal AI. 
                    Experience instant, local processing with high-fidelity output.
                </p>
            </div>

            {/* Mode Selectors */}
            <div className="flex flex-wrap justify-center gap-4">
                {modes.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`group px-8 py-4 rounded-3xl flex items-center gap-4 transition-all duration-300 font-bold text-sm overflow-hidden relative
                            ${mode === m.id 
                                ? 'bg-blue-600 text-white shadow-[0_20px_50px_rgba(37,99,235,0.3)] scale-105' 
                                : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/20'}`}
                    >
                        <span className="text-2xl transform group-hover:scale-125 transition-transform duration-300">{m.icon}</span>
                        {m.label}
                        {mode === m.id && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                        )}
                    </button>
                ))}
            </div>

            {/* Language Controls */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-6 px-6 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[40px] border border-white dark:border-slate-800 shadow-2xl">
                    <div className="relative group">
                        <label className="absolute -top-3 left-6 px-2 bg-white dark:bg-slate-950 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10">Source Language</label>
                        <select value={srcLang} onChange={(e) => setSrcLang(e.target.value)}
                            className="w-full p-5 bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer pr-12 group-hover:border-blue-500/30">
                            {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">▼</div>
                    </div>

                    <button 
                        onClick={handleSwap}
                        className="w-12 h-12 bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white rounded-full flex items-center justify-center shadow-xl border border-slate-100 dark:border-slate-700 transition-all duration-500 hover:rotate-180 active:scale-90 text-blue-500 group"
                    >
                        <span className="text-2xl font-bold">⇄</span>
                    </button>

                    <div className="relative group">
                        <label className="absolute -top-3 left-6 px-2 bg-white dark:bg-slate-950 text-[10px] font-black text-slate-400 uppercase tracking-widest z-10">Target Language</label>
                        <select value={tgtLang} onChange={(e) => setTgtLang(e.target.value)}
                            className="w-full p-5 bg-white dark:bg-slate-800 rounded-[24px] border border-slate-100 dark:border-slate-700 font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer pr-12 group-hover:border-blue-500/30">
                            {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                        </select>
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">▼</div>
                    </div>
            </div>

            {/* Translation Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Input Area */}
                <div className="space-y-6">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[40px] blur opacity-10 group-hover:opacity-20 transition duration-1000 group-focus-within:opacity-30"></div>
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={isRecording ? "Neural Engine listening..." : "Enter text to translate..."}
                            className={`relative w-full h-[420px] p-10 bg-white dark:bg-slate-900 rounded-[38px] border border-slate-100 dark:border-slate-800 outline-none focus:ring-0 transition-all resize-none text-xl leading-relaxed placeholder:text-slate-300 dark:placeholder:text-slate-700 shadow-2xl
                                ${isRecording ? 'animate-pulse ring-4 ring-red-500/10 border-red-500/20' : ''}`}
                        />
                        {(mode === 'speech-to-text' || mode === 'speech-to-speech') && (
                            <button
                                onClick={toggleRecording}
                                className={`absolute bottom-8 right-8 w-20 h-20 rounded-3xl flex items-center justify-center text-3xl transition-all duration-500 shadow-2xl
                                    ${isRecording 
                                        ? 'bg-red-500 text-white scale-110 rotate-90 rounded-full' 
                                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 rounded-3xl'}`}
                            >
                                {isRecording ? '■' : '🎙️'}
                                {isRecording && (
                                    <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></span>
                                )}
                            </button>
                        )}
                    </div>
                    <button
                        onClick={handleTranslate}
                        disabled={isLoading || !inputText.trim()}
                        className="w-full py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[24px] font-black shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:translate-y-[-2px] active:translate-y-[1px] transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-4 text-xl overflow-hidden relative group"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                <span className="tracking-tight">Synthesizing Neural Logic...</span>
                            </>
                        ) : (
                            <>
                                <span>Execute Neural Translation</span>
                                <span className="text-2xl group-hover:translate-x-2 transition-transform duration-300">✦</span>
                            </>
                        )}
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>

                {/* Output Area */}
                <div className="space-y-6">
                    <div className="relative h-[420px] p-10 bg-slate-900/5 dark:bg-white/5 rounded-[38px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden backdrop-blur-md shadow-inner group">
                        {isLoading && progress && (
                            <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 flex flex-col items-center justify-center p-12 z-20 animate-in fade-in duration-500">
                                <div className="relative mb-8">
                                    <div className="w-24 h-24 bg-blue-600/10 rounded-[32px] flex items-center justify-center text-5xl animate-pulse">⚙️</div>
                                    <div className="absolute inset-0 w-24 h-24 border-4 border-blue-500/20 border-t-blue-500 rounded-[32px] animate-spin"></div>
                                </div>
                                <h3 className="text-sm font-black text-blue-600 tracking-[0.3em] uppercase mb-6">Neural Optimization</h3>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                                    <div className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full transition-all duration-700 relative" style={{ width: `${progress.progress * 100}%` }}>
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)25%,transparent25%,transparent50%,rgba(255,255,255,0.2)50%,rgba(255,255,255,0.2)75%,transparent75%,transparent)] bg-[length:1rem_1rem] animate-pulse" />
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-6 font-mono tracking-tighter opacity-60">Asset: {progress.file}</p>
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Result Console v2.0</h3>
                            </div>
                            <div className="flex gap-2">
                                {outputText && (
                                    <button 
                                        onClick={getInsight} 
                                        disabled={isInsightLoading}
                                        className="px-4 py-2 bg-blue-600/10 text-blue-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all disabled:opacity-30"
                                    >
                                        {isInsightLoading ? '⚛️ Analyzing...' : '🧬 Get Cultural Insight'}
                                    </button>
                                )}
                                {outputText && (
                                    <button onClick={() => speak(outputText, tgtLang)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 shadow-lg rounded-xl hover:scale-110 transition-transform">🔊</button>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="absolute inset-x-0 top-0 mt-6 mx-6 p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-red-500 text-sm font-bold animate-in slide-in-from-top-6 z-30 flex gap-4">
                                <span className="text-2xl">⚠️</span>
                                <div>
                                    <p>{error}</p>
                                    <p className="mt-1 font-normal opacity-70 text-xs">Consider checking your browser's memory allocation.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-auto custom-scrollbar">
                            {outputText ? (
                                <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Input Sequence</h4>
                                            <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">{getLanguageName(srcLang)}</span>
                                        </div>
                                        <div className="p-8 bg-slate-500/5 dark:bg-white/5 rounded-[32px] border border-slate-200/40 dark:border-slate-800/50 backdrop-blur-sm">
                                            <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-300 italic font-medium">
                                                {inputText}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500">Neural Synthesis</h4>
                                            <span className="text-[10px] font-bold text-blue-400/50">{getLanguageName(tgtLang)}</span>
                                        </div>
                                        <div className="p-8 bg-blue-600/[0.03] dark:bg-blue-400/[0.03] rounded-[32px] border border-blue-500/20 backdrop-blur-sm shadow-xl shadow-blue-500/5">
                                            <p className="text-3xl leading-relaxed font-black text-slate-900 dark:text-white tracking-tight">
                                                {outputText}
                                            </p>
                                        </div>
                                    </div>
                                    {insight && (
                                        <div className="mt-8 p-8 bg-blue-500/[0.05] border border-blue-500/10 rounded-[32px] animate-in slide-in-from-top-4 duration-500 overflow-hidden relative group">
                                            <div className="absolute top-0 right-0 p-6 opacity-5 text-6xl group-hover:rotate-12 transition-transform">🛡️</div>
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500 mb-4 flex items-center gap-3">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
                                                AI Cultural Safeguard
                                            </h4>
                                            <p className="text-sm font-medium leading-relaxed italic text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                                                {insight}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 space-y-6 opacity-40">
                                    <div className="text-8xl animate-bounce duration-[2000ms]">🌍</div>
                                    <div className="text-center">
                                        <p className="text-xs font-black uppercase tracking-[0.4em]">Matrix Ready</p>
                                        <p className="text-[10px] mt-1 font-medium italic">Awaiting source vector input...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-blue-500/10 rounded-[32px] flex items-center gap-6 shadow-inner relative overflow-hidden group">
                        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center text-3xl shadow-2xl flex-shrink-0 transform group-hover:rotate-12 transition-transform duration-500">🧞‍♂️</div>
                        <div className="flex-1">
                            <h4 className="font-black text-xs uppercase tracking-widest mb-1 text-slate-900 dark:text-white">Neural Pro Tip</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                Enable the "Voice Pass" engine for real-time conversation threading. This mode optimizes for low-latency speech synthesis.
                            </p>
                        </div>
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl pointer-events-none">✦</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Translator;
