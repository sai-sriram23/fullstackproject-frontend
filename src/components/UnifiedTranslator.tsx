import React, { useEffect, useRef, useState, useCallback } from 'react';
import { languages } from '../constants/languages';
import { saveHistory } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = 'text-text' | 'text-speech' | 'speech-text' | 'speech-speech';

const MODES: { id: Mode; label: string; icon: string; color: string; active: string }[] = [
    { id: 'text-text', label: 'Text → Text', icon: '📝', color: 'text-blue-500', active: 'bg-blue-600 text-white shadow-blue-500/30' },
    { id: 'text-speech', label: 'Text → Speech', icon: '📝🔊', color: 'text-purple-500', active: 'bg-purple-600 text-white shadow-purple-500/30' },
    { id: 'speech-text', label: 'Speech → Text', icon: '🎙️📝', color: 'text-emerald-500', active: 'bg-emerald-600 text-white shadow-emerald-500/30' },
    { id: 'speech-speech', label: 'Speech → Speech', icon: '🎙️🔊', color: 'text-amber-500', active: 'bg-amber-500 text-white shadow-amber-500/30' },
];

// ─── TTS helper ───────────────────────────────────────────────────────────────
const speak = (text: string, speechCode: string, onStart: () => void, onEnd: () => void) => {
    if (!window.speechSynthesis || !text) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = speechCode;
    utt.onstart = onStart;
    utt.onend = onEnd;
    utt.onerror = onEnd;
    window.speechSynthesis.speak(utt);
};

// ─── Component ────────────────────────────────────────────────────────────────
const UnifiedTranslator: React.FC = () => {
    const [mode, setMode] = useState<Mode>('text-text');
    const [srcLang, setSrcLang] = useState('eng_Latn');
    const [tgtLang, setTgtLang] = useState('fra_Latn');
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isTranslating, setIsTranslating] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [progress, setProgress] = useState<any>(null);
    const [recognition, setRecognition] = useState<any>(null);

    const worker = useRef<Worker | null>(null);
    const inputRef = useRef('');

    const srcMeta = languages.find(l => l.code === srcLang);
    const tgtMeta = languages.find(l => l.code === tgtLang);
    const inputIsSpeech = mode.startsWith('speech');
    const outputIsSpeech = mode.endsWith('speech');

    // Keep inputRef in sync for history saving
    useEffect(() => { inputRef.current = inputText; }, [inputText]);

    // ── Worker setup ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!worker.current) {
            worker.current = new Worker(new URL('../worker.ts', import.meta.url), { type: 'module' });
        }
        const onMsg = (e: MessageEvent) => {
            const { status, output, error } = e.data;
            if (status === 'progress') { setProgress(e.data); }
            else if (status === 'complete') {
                const translated: string = output[0].translation_text;
                setOutputText(translated);
                setProgress(null);
                setIsTranslating(false);

                if (outputIsSpeech && tgtMeta?.speech) {
                    speak(translated, tgtMeta.speech,
                        () => setIsSpeaking(true),
                        () => setIsSpeaking(false));
                }

                const username = localStorage.getItem('username') || 'anonymous';
                saveHistory({ username, type: 'TRANSLATE', sourceText: inputRef.current, resultText: translated })
                    .catch(() => { });
            } else if (status === 'error') {
                console.error(error);
                setIsTranslating(false);
                alert('Translation failed: ' + error);
            }
        };
        worker.current.addEventListener('message', onMsg);
        return () => worker.current?.removeEventListener('message', onMsg);
    }, [outputIsSpeech, tgtMeta]);

    // ── Speech recognition setup ─────────────────────────────────────────────
    useEffect(() => {
        if (!inputIsSpeech) return;
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SR) return;
        const recog = new SR();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = srcMeta?.speech || 'en-US';
        recog.onresult = (ev: any) => {
            let final = '';
            for (let i = ev.resultIndex; i < ev.results.length; i++) {
                if (ev.results[i].isFinal) final += ev.results[i][0].transcript;
            }
            if (final) setInputText(p => p + (p ? ' ' : '') + final);
        };
        recog.onstart = () => setIsListening(true);
        recog.onend = () => setIsListening(false);
        recog.onerror = (ev: any) => {
            if (ev.error === 'not-allowed') alert('Microphone access denied.');
            setIsListening(false);
        };
        setRecognition(recog);
        return () => { try { recog.stop(); } catch { } };
    }, [inputIsSpeech, srcLang, srcMeta]);

    const toggleListen = useCallback(() => {
        if (!recognition) { alert('Speech Recognition not supported. Use Chrome or Edge.'); return; }
        isListening ? recognition.stop() : recognition.start();
    }, [recognition, isListening]);

    const handleTranslate = useCallback(() => {
        if (!inputText.trim() || !worker.current) return;
        setIsTranslating(true);
        setOutputText('');
        worker.current.postMessage({ text: inputText, src_lang: srcLang, tgt_lang: tgtLang });
    }, [inputText, srcLang, tgtLang]);

    const handleSpeak = () => {
        if (!outputText || !tgtMeta?.speech) return;
        speak(outputText, tgtMeta.speech, () => setIsSpeaking(true), () => setIsSpeaking(false));
    };

    const swapLangs = () => {
        setSrcLang(tgtLang);
        setTgtLang(srcLang);
        setInputText(outputText);
        setOutputText(inputText);
    };

    const activeMode = MODES.find(m => m.id === mode)!;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                    Neural Translator
                </h1>
                <p className="text-slate-400 text-sm">Offline AI translation — 4 modes, 20 languages</p>
            </div>

            {/* Mode Tabs */}
            <div className="flex flex-wrap gap-2 justify-center">
                {MODES.map(m => (
                    <button
                        key={m.id}
                        onClick={() => { setMode(m.id); setInputText(''); setOutputText(''); }}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-lg
                            ${mode === m.id ? m.active + ' scale-105' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:scale-102'}`}
                    >
                        <span>{m.icon}</span> {m.label}
                    </button>
                ))}
            </div>

            {/* Language Selectors */}
            <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">From</label>
                    <select value={srcLang} onChange={e => setSrcLang(e.target.value)}
                        className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-medium appearance-none cursor-pointer">
                        {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                </div>
                <button onClick={swapLangs}
                    className="mt-7 p-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-500 hover:text-white transition-all hover:rotate-180">
                    ⇄
                </button>
                <div className="flex-1 space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">To</label>
                    <select value={tgtLang} onChange={e => setTgtLang(e.target.value)}
                        className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 font-medium appearance-none cursor-pointer">
                        {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                </div>
            </div>

            {/* I/O Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── INPUT PANEL ── */}
                <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
                        {inputIsSpeech ? '🎙️ Voice Input' : '📝 Text Input'}
                    </p>

                    {inputIsSpeech ? (
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center gap-6 min-h-[280px]">
                            {/* Mic button */}
                            <button onClick={toggleListen}
                                className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 relative
                                    ${isListening
                                        ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)] scale-110'
                                        : 'bg-blue-600 shadow-[0_15px_40px_rgba(37,99,235,0.3)] hover:scale-105'}`}>
                                {isListening && <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />}
                                <span className="text-4xl">{isListening ? '🛑' : '🎙️'}</span>
                            </button>
                            <p className={`text-xs font-black uppercase tracking-widest animate-pulse ${isListening ? 'text-red-500' : 'text-slate-400'}`}>
                                {isListening ? 'Listening…' : 'Tap to speak'}
                            </p>
                            {/* Transcript */}
                            <div className="w-full min-h-[80px] p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 relative">
                                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                                    {inputText || 'Your speech will appear here…'}
                                </p>
                                {inputText && (
                                    <button onClick={() => setInputText('')}
                                        className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors text-lg">✕</button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="relative">
                            <textarea
                                className="w-full h-64 p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                placeholder="Type or paste text here…"
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                            />
                            <span className="absolute bottom-5 right-5 text-xs text-slate-400">{inputText.length} chars</span>
                        </div>
                    )}

                    <button
                        onClick={handleTranslate}
                        disabled={isTranslating || !inputText.trim()}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3">
                        {isTranslating ? (
                            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                {progress ? `Loading… ${Math.round(progress.progress || 0)}%` : 'Translating…'}</>
                        ) : (
                            <><span>Translate</span><span className="text-lg">→</span></>
                        )}
                    </button>
                </div>

                {/* ── OUTPUT PANEL ── */}
                <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">
                        {outputIsSpeech ? '🔊 Speech Output' : '📄 Translation Result'}
                    </p>

                    <div className={`min-h-[280px] rounded-3xl border p-6 flex flex-col
                        ${outputIsSpeech
                            ? 'bg-gradient-to-br from-purple-500/10 to-amber-500/5 border-purple-500/20 dark:border-purple-500/10'
                            : 'bg-slate-100 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-700'}`}>

                        {outputIsSpeech && outputText && (
                            <div className="flex flex-col items-center justify-center gap-4 flex-1">
                                {/* Waveform Speaker */}
                                <button onClick={handleSpeak}
                                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300
                                        ${isSpeaking
                                            ? 'bg-purple-600 shadow-[0_0_40px_rgba(147,51,234,0.5)] scale-110 animate-pulse'
                                            : 'bg-purple-500 shadow-[0_10px_30px_rgba(147,51,234,0.3)] hover:scale-105'}`}>
                                    <span className="text-4xl">{isSpeaking ? '🔊' : '▶️'}</span>
                                </button>
                                <p className="text-xs font-bold uppercase tracking-widest text-purple-400">
                                    {isSpeaking ? 'Speaking…' : 'Tap to replay'}
                                </p>
                                <div className="w-full p-4 bg-white/50 dark:bg-slate-800/50 rounded-2xl">
                                    <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200 text-center">
                                        {outputText}
                                    </p>
                                </div>
                            </div>
                        )}

                        {!outputIsSpeech && (
                            <div className="flex flex-col flex-1">
                                {outputText ? (
                                    <p className="text-lg leading-relaxed dark:text-slate-200 animate-in slide-in-from-bottom-2">
                                        {outputText}
                                    </p>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                                        <span className="text-5xl mb-3">{activeMode.icon}</span>
                                        <p className="text-sm font-semibold">Translation will appear here</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {!outputIsSpeech && !outputText && isTranslating && progress && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 dark:bg-slate-900/80 rounded-3xl">
                                <p className="text-xs font-bold text-blue-500 animate-bounce uppercase tracking-widest">Loading AI model…</p>
                                <div className="w-48 h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress.progress}%` }} />
                                </div>
                                <p className="text-[10px] text-slate-400">{progress.file}</p>
                            </div>
                        )}
                    </div>

                    {/* Speak button for text-text / speech-text modes */}
                    {!outputIsSpeech && outputText && tgtMeta?.speech && (
                        <button onClick={handleSpeak}
                            disabled={isSpeaking}
                            className="w-full py-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl font-bold text-sm hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2">
                            <span>{isSpeaking ? '🔊 Speaking…' : '🔊 Read Aloud'}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnifiedTranslator;
