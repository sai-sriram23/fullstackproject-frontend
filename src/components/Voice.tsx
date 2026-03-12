// ─────────────────────────────────────────────────────────────────────────────
// Voice.tsx — Voice input + translation.
// Uses the Web Speech API to capture spoken words, then sends the transcript
// to the NLLB-200 Web Worker for AI translation.
// ─────────────────────────────────────────────────────────────────────────────

// useState  — store component state (transcript, translated text, listening flag, etc.)
// useEffect — run setup code when the component mounts
// useRef    — hold mutable values that don't cause re-renders (worker, recognition, transcript)
import React, { useState, useEffect, useRef } from 'react';

// languages — the full list of supported languages with NLLB and Web Speech API codes.
import { languages } from '../constants/languages';

// saveHistory — POSTs the translation to the backend for the history log.
import { saveHistory } from '../services/api';

const Voice: React.FC = () => {
    // ── State ─────────────────────────────────────────────────────────────────

    // text — the transcribed speech (what was spoken).
    const [text, setText] = useState('');

    // translatedText — the AI's translation of the transcribed text.
    const [translatedText, setTranslatedText] = useState('');

    // isListening — true when SpeechRecognition is actively capturing audio.
    const [isListening, setIsListening] = useState(false);

    // isTranslating — true while the Web Worker is processing the translation.
    const [isTranslating, setIsTranslating] = useState(false);

    // progress — model loading progress data (from the worker during first translation).
    const [progress, setProgress] = useState<any>(null);

    // recognition — the SpeechRecognition instance (Web Speech API).
    // We store it in state so we can call .start() and .stop() from event handlers.
    const [recognition, setRecognition] = useState<any>(null);

    // srcLang — Web Speech API's BCP-47 language code for the speaker's language.
    // Default: 'en-US' (American English). The SpeechRecognition API uses this.
    const [srcLang, setSrcLang] = useState('en-US');

    // tgtLang — NLLB-200 language code for the translation target.
    // Default: 'fra_Latn' (French). Sent to the Web Worker.
    const [tgtLang, setTgtLang] = useState('fra_Latn');

    // ── Refs ──────────────────────────────────────────────────────────────────

    // worker — holds the Web Worker instance.
    // useRef is used (not useState) because changing a ref does NOT trigger a re-render.
    // The worker exists for the entire lifetime of this component.
    const worker = useRef<Worker | null>(null);

    // textRef — keeps a synchronised copy of the "text" state that can be accessed
    // inside the worker's async message callback without stale closure issues.
    const textRef = useRef('');

    // Keep textRef in sync with the text state
    useEffect(() => {
        textRef.current = text;
    }, [text]); // runs every time "text" changes

    // ── Web Worker Setup ─────────────────────────────────────────────────────
    useEffect(() => {
        // Create the translation worker ONCE on component mount.
        // new URL('../worker.ts', import.meta.url) — Vite resolves this to the correct
        // path at build time and creates a separate JS bundle for the worker.
        // { type: 'module' } — enables ES module imports inside the worker.
        if (!worker.current) {
            worker.current = new Worker(new URL('../worker.ts', import.meta.url), {
                type: 'module',
            });
        }

        // onMessage — handles all messages posted from worker.ts back to this component.
        const onMessage = (e: MessageEvent) => {
            const { status, output, error } = e.data;

            if (status === 'progress') {
                // Model loading progress — show a progress bar in the UI.
                setProgress(e.data);

            } else if (status === 'complete') {
                // Translation done! output[0].translation_text is the translated string.
                const translated = output[0].translation_text;
                setTranslatedText(translated);
                setProgress(null);       // hide the progress bar
                setIsTranslating(false); // re-enable the translate button

                // Save this translation to the backend history log.
                const username = localStorage.getItem('username') || 'anonymous';
                saveHistory({
                    username,
                    type: 'VOICE_TRANSLATE',
                    sourceText: textRef.current,  // use ref to avoid stale closure
                    resultText: translated
                }).catch(err => console.error('History save failed', err));

            } else if (status === 'error') {
                console.error('Translation Error:', error);
                alert("Translation Error: " + error);
                setIsTranslating(false);
            }
        };

        // Attach the message listener to the worker.
        worker.current.addEventListener('message', onMessage);

        // Cleanup: remove the listener when the component unmounts.
        // This prevents memory leaks from lingering message listeners.
        return () => worker.current?.removeEventListener('message', onMessage);
    }, []); // empty array = run only once when the component first mounts

    // ── SpeechRecognition Setup ───────────────────────────────────────────────
    useEffect(() => {
        // The Web Speech API is vendor-prefixed in some browsers.
        // window.SpeechRecognition is standard; window.webkitSpeechRecognition is Chrome's version.
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recog = new SpeechRecognition();

            // continuous = true — keeps listening even after pauses (doesn't stop after one sentence).
            recog.continuous = true;

            // interimResults = true — also returns "in-progress" recognised words
            // while the user is still speaking (for live transcript display).
            recog.interimResults = true;

            // lang — the BCP-47 code of the language being spoken (e.g. 'en-US', 'hi-IN').
            recog.lang = srcLang;

            // onresult — fires every time new speech is recognised.
            recog.onresult = (event: any) => {
                let finalTranscript = '';
                // event.results is an array of recognition results.
                // We loop from event.resultIndex (new results only) to avoid duplicating older ones.
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    // isFinal = true means the engine is confident about this phrase.
                    // False = still being processed (interim result).
                    if (event.results[i].isFinal) {
                        // [0] = the most likely transcript (index 0 is always the top alternative).
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    // Append to any previously captured text (supports multiple sentences).
                    // "prev ? prev + ' ' + finalTranscript : finalTranscript"
                    // = if there's existing text, add a space before appending.
                    setText(prev => prev + (prev ? ' ' : '') + finalTranscript);
                }
            };

            // Lifecycle callbacks
            recog.onstart = () => setIsListening(true);   // mic is open
            recog.onend = () => setIsListening(false);  // mic has stopped

            recog.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    alert('Microphone access denied. Please allow microphone permissions in your browser settings.');
                } else if (event.error === 'network') {
                    alert('Network error occurred. The Web Speech API requires an internet connection on some browsers.');
                }
                setIsListening(false);
            };

            setRecognition(recog);
        }
        // Re-run this effect whenever srcLang changes (to use the correct language).
    }, [srcLang]);

    // ── Toggle Listening ──────────────────────────────────────────────────────
    const toggleListening = () => {
        if (!recognition) {
            // SpeechRecognition is not supported on Firefox or non-HTTPS pages.
            alert("Your browser does not support the Web Voice API or blocks it on non-HTTPS connections. Try using Chrome or Edge.");
            return;
        }

        if (isListening) {
            recognition.stop(); // closes the microphone
        } else {
            try {
                recognition.start(); // opens the microphone and begins listening
            } catch (err: any) {
                console.error("Start error:", err);
                alert("Failed to start listening. Ensure microphone permissions are granted.");
            }
        }
    };

    // ── Trigger Translation ────────────────────────────────────────────────────
    const handleTranslate = () => {
        if (!text.trim() || !worker.current) return;
        setIsTranslating(true);
        setTranslatedText('');

        // Find the NLLB code that matches the selected Web Speech API language code.
        // The voice uses the speech code (e.g. 'en-US') but NLLB needs its own code (e.g. 'eng_Latn').
        const srcNllbCode = languages.find(l => l.speech === srcLang)?.code || 'eng_Latn';

        // Send a message to the Web Worker to start translation.
        // The worker's 'message' event listener will pick this up.
        worker.current.postMessage({
            text: text,
            src_lang: srcNllbCode,
            tgt_lang: tgtLang,
        });
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                    Neural Voice Input
                </h1>

                {/* ── Language Selectors ── */}
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Source language: which language the user will SPEAK in */}
                    <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="text-xs font-bold text-slate-400 uppercase ml-2">Dictate:</span>
                        <select
                            value={srcLang}
                            onChange={(e) => setSrcLang(e.target.value)}
                            className="bg-transparent text-sm font-bold outline-none cursor-pointer pr-4"
                        >
                            {/* Map languages array to <option> elements.
                                key={lang.speech} uses the BCP-47 code as the unique key.
                                value={lang.speech} binds the option value to the speech code. */}
                            {languages.map(lang => (
                                <option key={lang.speech} value={lang.speech}>{lang.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Target language: which language to translate INTO */}
                    <div className="flex items-center gap-3 p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
                        <span className="text-xs font-bold text-indigo-400 uppercase ml-2">Translate to:</span>
                        <select
                            value={tgtLang}
                            onChange={(e) => setTgtLang(e.target.value)}
                            className="bg-transparent text-sm font-bold text-indigo-700 dark:text-indigo-300 outline-none cursor-pointer pr-4"
                        >
                            {/* key={lang.code} uses the NLLB code as the key (unique per language) */}
                            {languages.map(lang => (
                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ── Left: Mic + Transcript ── */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center">
                    {/* Big microphone button */}
                    <button
                        onClick={toggleListening}
                        className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isListening
                            ? 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)] scale-110'  // active = red pulsing
                            : 'bg-blue-600 shadow-[0_20px_40px_rgba(37,99,235,0.3)] hover:scale-105' // inactive = blue
                            }`}
                    >
                        {/* Animated ring around button when listening */}
                        {isListening && <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />}
                        <span className="text-4xl">{isListening ? '🛑' : '🎙️'}</span>
                    </button>

                    {/* Status text */}
                    <p className={`mt-8 font-black uppercase tracking-[0.2em] text-sm animate-pulse ${isListening ? 'text-red-500' : 'text-slate-400'}`}>
                        {isListening ? 'LISTENING TO YOUR VOICE...' : 'TAP TO START DICTATION'}
                    </p>

                    {/* Transcript display area */}
                    <div className="w-full mt-10 p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 min-h-[200px] relative">
                        <p className="text-xl leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                            {text || 'Thinking... say something beautiful.'}
                        </p>
                        {/* Show clear button only if there's text */}
                        {text && (
                            <button
                                onClick={() => setText('')}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 transition-colors"
                                title="Clear"
                            >
                                🗑️
                            </button>
                        )}
                    </div>

                    {/* Translate button — only shown once there's a transcript */}
                    {text && (
                        <button
                            onClick={handleTranslate}
                            disabled={isTranslating}
                            className="mt-6 w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex justify-center items-center gap-3"
                        >
                            {isTranslating ? 'TRANSLATING...' : 'TRANSLATE RECORDING'}
                        </button>
                    )}
                </div>

                {/* ── Right: Translation Result ── */}
                <div className="space-y-6">
                    {/* Progress bar — shown while model is loading/translating */}
                    {isTranslating && progress && (
                        <div className="p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-[2rem] backdrop-blur-3xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                            <p className="text-xs font-black text-indigo-500 mb-4 uppercase tracking-[0.3em]">PROCESSING AUDIO TEXT...</p>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-2 shadow-inner">
                                <div
                                    className="bg-indigo-600 h-3 rounded-full transition-all duration-300 shadow-lg shadow-indigo-500/50"
                                    style={{ width: `${progress.progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Translation result card */}
                    <div className="p-8 bg-white dark:bg-slate-800/50 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-700 h-full flex flex-col">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl text-2xl">🌐</div>
                            <h3 className="text-lg font-black tracking-tight text-indigo-900 dark:text-indigo-100">Translation Result</h3>
                        </div>

                        {translatedText ? (
                            // Show translated text
                            <p className="text-slate-600 dark:text-slate-200 text-xl leading-relaxed font-medium pb-8 border-b border-slate-100 dark:border-slate-700/50">
                                {translatedText}
                            </p>
                        ) : (
                            // Placeholder when no translation yet
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 h-64 border-4 border-dashed border-slate-100 dark:border-slate-800/50 rounded-3xl mt-2">
                                <span className="text-6xl mb-4">✨</span>
                                <p className="font-bold">Awaiting Translation</p>
                            </div>
                        )}

                        {/* Show target language badge when translation is ready */}
                        {translatedText && (
                            <div className="mt-8 flex justify-end">
                                <span className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg tracking-widest uppercase">
                                    {/* Find the language name for the current tgtLang code */}
                                    {languages.find(l => l.code === tgtLang)?.name}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Voice;
