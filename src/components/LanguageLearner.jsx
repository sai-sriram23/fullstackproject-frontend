import React, { useState, useEffect, useRef, useCallback } from 'react';
import { languages } from '../constants/languages';
import { TOPICS, DAILY_THEMES, XP_PER_CORRECT, XP_PER_LESSON_COMPLETE, DIFFICULTY_LEVELS } from '../constants/lessonData';
import scenarioEngine from '../services/ScenarioEngine';
import GlobeSelector from './GlobeSelector';

const MYMEMORY_API = 'https://api.mymemory.translated.net/get';
const STORAGE_KEY = 'neura_learn_progress';
const DAILY_GOAL_MINS = 10;

const getProgress = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            // Reset daily time if it's a new day
            const todayStr = new Date().toDateString();
            if (parsed.lastActiveDate !== todayStr) {
                parsed.timeToday = 0;
                parsed.lastActiveDate = todayStr;
            }
            return parsed;
        }
    } catch {}
    return { xp: 0, activeDates: [], completedLessons: [], timeToday: 0, lastActiveDate: new Date().toDateString() };
};

const saveProgress = (progress) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

const updateStreak = (progress) => {
    const today = new Date().toDateString();
    let dates = progress.activeDates || [];
    if (!dates.includes(today)) {
        dates = [...dates, today];
    }
    return { ...progress, activeDates: dates, lastActiveDate: today };
};

const getStreakCount = (dates) => {
    if (!dates || dates.length === 0) return 0;
    let count = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);
    const todayStr = current.toDateString();
    const yesterday = new Date(current);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    if (!dates.includes(todayStr) && !dates.includes(yesterdayStr)) return 0;
    let checkDate = dates.includes(todayStr) ? new Date(current) : new Date(yesterday);
    while (true) {
        if (dates.includes(checkDate.toDateString())) {
            count++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }
    return count;
};

const translateWord = async (word, srcLang, tgtLang) => {
    const url = `${MYMEMORY_API}?q=${encodeURIComponent(word)}&langpair=${encodeURIComponent(srcLang + '|' + tgtLang)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.responseStatus === 200) return data.responseData.translatedText;
    throw new Error(data.responseDetails || 'Translation failed');
};

const MODES = [
    { id: 'flashcard', label: 'Flashcards', icon: '🃏', desc: 'Flip to learn' },
    { id: 'translate', label: 'Translate', icon: '✍️', desc: 'Type the translation' },
    { id: 'listen', label: 'Listening', icon: '👂', desc: 'Hear & type' },
    { id: 'speak', label: 'Speaking', icon: '🗣️', desc: 'Say it aloud' },
    { id: 'quiz', label: 'Quiz', icon: '🧩', desc: 'Pick the right answer' },
];

const speak = (text, langCode) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
    if (voice) utterance.voice = voice;
    utterance.lang = langCode;
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
};

const LanguageLearner = () => {
    const [progress, setProgress] = useState(getProgress);
    const [nativeLang, setNativeLang] = useState('en');
    const [targetLang, setTargetLang] = useState('fr');
    const [view, setView] = useState('home');
    const [activeMode, setActiveMode] = useState(null);
    const [activeLesson, setActiveLesson] = useState(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [translations, setTranslations] = useState({});
    const [loadingTranslations, setLoadingTranslations] = useState(false);
    const [flipped, setFlipped] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState(null);
    const [quizOptions, setQuizOptions] = useState([]);
    const [sessionXP, setSessionXP] = useState(0);
    const [showCelebration, setShowCelebration] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [customTopic, setCustomTopic] = useState('');
    const [generating, setGenerating] = useState(false);
    const [difficulty, setDifficulty] = useState('beginner');
    
    const recognitionRef = useRef(null);
    const inputRef = useRef(null);

    // Time tracking effect
    useEffect(() => {
        let timer;
        if (view === 'exercise') {
            timer = setInterval(() => {
                setProgress(prev => {
                    const updated = { ...prev, timeToday: (prev.timeToday || 0) + 1 };
                    saveProgress(updated);
                    return updated;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [view]);

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const streakCount = getStreakCount(progress.activeDates);
    const timeInMins = Math.floor((progress.timeToday || 0) / 60);
    const goalProgress = Math.min(100, (timeInMins / DAILY_GOAL_MINS) * 100);

    const getLast7Days = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push({
                date: d.toDateString(),
                label: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
                active: (progress.activeDates || []).includes(d.toDateString())
            });
        }
        return days;
    };

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
        }
    }, []);

    const loadTranslations = useCallback(async (lesson) => {
        setLoadingTranslations(true);
        const t = {};
        for (const item of lesson.items) {
            try {
                t[item.word] = await translateWord(item.word, nativeLang, targetLang);
            } catch {
                t[item.word] = '...';
            }
        }
        setTranslations(t);
        setLoadingTranslations(false);
        return t;
    }, [nativeLang, targetLang]);

    const handleGenerateDynamic = async (topic) => {
        setGenerating(true);
        try {
            const lesson = await scenarioEngine.generateLesson(topic, difficulty);
            const defaultMode = lesson.type === 'dialogue' ? 'translate' : 'quiz';
            startLesson(lesson, defaultMode);
        } catch (error) {
            console.error(error);
        }
        setGenerating(false);
    };

    const startLesson = useCallback(async (lesson, mode) => {
        setActiveLesson(lesson);
        setActiveMode(mode);
        setCurrentIdx(0);
        setFlipped(false);
        setUserInput('');
        setFeedback(null);
        setSessionXP(0);
        setView('exercise');
        const t = await loadTranslations(lesson);
        if (mode === 'quiz' && lesson.type !== 'dialogue') {
            generateQuizOptions(lesson.items[0], t, lesson.items);
        }
    }, [loadTranslations]);

    const generateQuizOptions = (item, trans, allItems) => {
        const correct = trans[item.word] || '...';
        const others = allItems
            .filter(i => i.word !== item.word)
            .map(i => trans[i.word] || '...')
            .filter(t => t !== correct && t !== '...');
        const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [...shuffled, correct].sort(() => Math.random() - 0.5);
        setQuizOptions(options);
    };

    const awardXP = (amount) => {
        setSessionXP(prev => prev + amount);
        setProgress(prev => {
            const updated = updateStreak({ ...prev, xp: prev.xp + amount });
            saveProgress(updated);
            return updated;
        });
    };

    const checkAnswer = (answer) => {
        if (!activeLesson) return;
        const item = activeLesson.items[currentIdx];
        const correct = translations[item.word] || '';
        const isCorrect = answer.trim().toLowerCase() === correct.trim().toLowerCase();
        if (isCorrect) {
            awardXP(XP_PER_CORRECT);
            setFeedback({ correct: true, expected: correct });
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 1200);
        } else {
            setFeedback({ correct: false, expected: correct });
        }
    };

    const nextItem = () => {
        if (!activeLesson) return;
        const next = currentIdx + 1;
        if (next >= activeLesson.items.length) {
            awardXP(XP_PER_LESSON_COMPLETE);
            setProgress(prev => {
                const lessonKey = `${activeLesson.title}_${targetLang}`;
                const completed = (prev.completedLessons || []).includes(lessonKey)
                    ? prev.completedLessons
                    : [...(prev.completedLessons || []), lessonKey];
                const updated = { ...prev, completedLessons: completed };
                saveProgress(updated);
                return updated;
            });
            setView('complete');
            return;
        }
        setCurrentIdx(next);
        setFlipped(false);
        setUserInput('');
        setFeedback(null);
        if (activeMode === 'quiz' && activeLesson.type !== 'dialogue') {
            generateQuizOptions(activeLesson.items[next], translations, activeLesson.items);
        }
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const handleSpeak = () => {
        if (!recognitionRef.current || !activeLesson) return;
        const item = activeLesson.items[currentIdx];
        const targetLangObj = languages.find(l => l.code === targetLang);
        const speechLang = targetLangObj?.speech || targetLang;
        recognitionRef.current.lang = speechLang;
        recognitionRef.current.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setUserInput(transcript);
            setIsRecording(false);
            const correct = translations[item.word] || '';
            const isCorrect = transcript.trim().toLowerCase().includes(correct.trim().toLowerCase().substring(0, Math.max(3, correct.length * 0.5)));
            if (isCorrect) {
                awardXP(XP_PER_CORRECT);
                setFeedback({ correct: true, expected: correct });
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 1200);
            } else {
                setFeedback({ correct: false, expected: correct, got: transcript });
            }
        };
        recognitionRef.current.onerror = () => setIsRecording(false);
        recognitionRef.current.onend = () => setIsRecording(false);
        setIsRecording(true);
        recognitionRef.current.start();
    };

    const targetLangObj = languages.find(l => l.code === targetLang);
    const targetSpeech = targetLangObj?.speech || targetLang;

    if (view === 'complete') {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-in fade-in duration-700">
                <div className="text-8xl mb-6 animate-bounce">🎉</div>
                <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
                    Lesson Complete!
                </h1>
                <p className="text-slate-500 mb-8">Amazing work! You earned <span className="font-black text-blue-600">{sessionXP} XP</span> this session.</p>
                <div className="flex gap-6 justify-center mb-10">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 w-36">
                        <p className="text-3xl font-black text-blue-600">{progress.xp}</p>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">Total XP</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 w-36">
                        <p className="text-3xl font-black text-orange-500">🔥 {streakCount}</p>
                        <p className="text-xs text-slate-400 font-bold uppercase mt-1">Day Streak</p>
                    </div>
                </div>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => setView('home')} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:scale-105 transition-all">
                        Back to Lessons
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'exercise' && activeLesson && activeMode) {
        const item = activeLesson.items[currentIdx];
        const translated = translations[item.word] || '...';
        const progressPct = ((currentIdx + (feedback ? 1 : 0)) / activeLesson.items.length) * 100;

        return (
            <div className="max-w-3xl mx-auto px-4 py-8 animate-in fade-in duration-500 pb-24">
                {showCelebration && (
                    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                        <div className="text-8xl animate-ping">✨</div>
                    </div>
                )}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setView('home')} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 font-bold text-sm">
                        ← Exit
                    </button>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-blue-600">+{sessionXP} XP</span>
                        <span className="text-sm font-bold text-slate-400">{currentIdx + 1}/{activeLesson.items.length}</span>
                    </div>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 mb-8 overflow-hidden shadow-inner">
                    <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${progressPct}%` }} />
                </div>

                {activeLesson.type === 'dialogue' ? (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl p-8 border border-slate-100 dark:border-slate-700">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-xl text-white shadow-lg">
                                    {item.speaker?.charAt(0) || '👤'}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">{item.speaker}</p>
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 relative">
                                        <p className="text-xl font-bold leading-relaxed">{item.word}</p>
                                        <button onClick={() => speak(item.word, 'en-US')} className="absolute top-4 right-4 text-slate-400 hover:text-blue-500 transition-colors">🔊</button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pl-16 space-y-4">
                                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Your Turn — Translate this</p>
                                <input 
                                    ref={inputRef}
                                    type="text" 
                                    value={userInput}
                                    onChange={e => setUserInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !feedback) checkAnswer(userInput); }}
                                    placeholder={`Type in ${languages.find(l => l.code === targetLang)?.name}...`}
                                    disabled={!!feedback}
                                    className="w-full p-5 text-lg rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-blue-500 font-bold transition-all shadow-sm"
                                    autoFocus
                                />
                                {feedback ? (
                                    <div className={`p-6 rounded-2xl animate-in slide-in-from-top-4 duration-300 ${feedback.correct ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                        <p className="font-black text-lg mb-1">{feedback.correct ? '✅ Perfect!' : '❌ Not quite'}</p>
                                        <p className="text-sm opacity-70">Correct: <span className="font-bold">{feedback.expected}</span></p>
                                        <button onClick={nextItem} className="mt-4 w-full py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                                            Continue Dialogue →
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => checkAnswer(userInput)}
                                        disabled={!userInput.trim()}
                                        className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                                        Send Message
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="text-center mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {MODES.find(m => m.id === activeMode)?.label} — {activeLesson.title}
                            </span>
                        </div>

                        {loadingTranslations ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                                <p className="text-sm font-bold text-slate-400">Preparing lesson...</p>
                            </div>
                        ) : activeMode === 'flashcard' ? (
                            <div className="flex flex-col items-center w-full">
                                <div
                                    onClick={() => {
                                        setFlipped(!flipped);
                                        if (!flipped) speak(translated, targetSpeech);
                                    }}
                                    className="w-full max-w-md h-72 cursor-pointer perspective-1000 group"
                                >
                                    <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}
                                        style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : '' }}>
                                        <div className="absolute inset-0 backface-hidden bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl border-2 border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center p-8"
                                            style={{ backfaceVisibility: 'hidden' }}>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                                                {languages.find(l => l.code === nativeLang)?.name}
                                            </p>
                                            <p className="text-3xl font-black text-center">{item.word}</p>
                                            <p className="text-sm text-slate-400 mt-6">Tap to flip</p>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[32px] shadow-2xl flex flex-col items-center justify-center p-8"
                                            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-4">
                                                {languages.find(l => l.code === targetLang)?.name}
                                            </p>
                                            <p className="text-3xl font-black text-white text-center">{translated}</p>
                                            <button onClick={(e) => { e.stopPropagation(); speak(translated, targetSpeech); }}
                                                className="mt-6 p-3 bg-white/20 rounded-2xl text-white hover:bg-white/30 transition-colors text-xl">
                                                🔊
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 mt-8">
                                    <button onClick={() => { awardXP(XP_PER_CORRECT); nextItem(); }}
                                        className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-xl hover:scale-105 transition-all">
                                        ✅ I knew this
                                    </button>
                                    <button onClick={nextItem}
                                        className="px-8 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold hover:scale-105 transition-all border border-slate-200 dark:border-slate-700">
                                        Next →
                                    </button>
                                </div>
                            </div>
                        ) : activeMode === 'translate' ? (
                            <div className="flex flex-col items-center w-full">
                                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-700 p-8 mb-6">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Translate this</p>
                                    <p className="text-2xl font-black">{item.word}</p>
                                </div>
                                <div className="w-full max-w-md">
                                    <input ref={inputRef} type="text" value={userInput}
                                        onChange={e => setUserInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !feedback) checkAnswer(userInput); }}
                                        placeholder={`Type in ${languages.find(l => l.code === targetLang)?.name}...`}
                                        disabled={!!feedback}
                                        className="w-full p-5 text-lg rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-blue-500 font-bold transition-colors shadow-sm"
                                        autoFocus
                                    />
                                </div>
                                {feedback ? (
                                    <div className={`w-full max-w-md mt-4 p-5 rounded-2xl ${feedback.correct ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                        <p className="font-black text-lg">{feedback.correct ? '✅ Correct!' : '❌ Not quite'}</p>
                                        <p className="text-sm mt-1 opacity-70">Answer: <span className="font-bold">{feedback.expected}</span></p>
                                        <button onClick={nextItem} className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:scale-105 transition-all w-full">
                                            Continue →
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => checkAnswer(userInput)}
                                        disabled={!userInput.trim()}
                                        className="mt-6 px-12 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 hover:scale-105 transition-all disabled:opacity-50">
                                        Check Answer
                                    </button>
                                )}
                            </div>
                        ) : activeMode === 'listen' ? (
                            <div className="flex flex-col items-center w-full">
                                <div className="w-full max-w-md bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[32px] shadow-2xl p-8 mb-6 text-center text-white">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-4">Listen carefully</p>
                                    <button onClick={() => speak(translated, targetSpeech)}
                                        className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center text-5xl hover:bg-white/30 transition-all hover:scale-110 mx-auto shadow-inner">
                                        🔊
                                    </button>
                                    <p className="text-sm mt-4 text-white/60">Tap to hear the word</p>
                                </div>
                                <div className="w-full max-w-md">
                                    <input ref={inputRef} type="text" value={userInput}
                                        onChange={e => setUserInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !feedback) checkAnswer(userInput); }}
                                        placeholder="Type what you heard..."
                                        disabled={!!feedback}
                                        className="w-full p-5 text-lg rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:border-purple-500 font-bold transition-colors shadow-sm"
                                        autoFocus
                                    />
                                </div>
                                {feedback ? (
                                    <div className={`w-full max-w-md mt-4 p-5 rounded-2xl ${feedback.correct ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                        <p className="font-black text-lg">{feedback.correct ? '✅ Correct!' : '❌ Not quite'}</p>
                                        <p className="text-sm mt-1 opacity-70">Answer: <span className="font-bold">{feedback.expected}</span></p>
                                        <button onClick={nextItem} className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:scale-105 transition-all w-full">
                                            Continue →
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => checkAnswer(userInput)}
                                        disabled={!userInput.trim()}
                                        className="mt-6 px-12 py-4 bg-purple-600 text-white rounded-2xl font-black shadow-xl shadow-purple-500/20 hover:scale-105 transition-all disabled:opacity-50">
                                        Check Answer
                                    </button>
                                )}
                            </div>
                        ) : activeMode === 'speak' ? (
                            <div className="flex flex-col items-center w-full">
                                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-700 p-8 mb-4 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Say this in {languages.find(l => l.code === targetLang)?.name}</p>
                                    <p className="text-2xl font-black mb-4">{translated}</p>
                                    <button onClick={() => speak(translated, targetSpeech)}
                                        className="px-6 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-sm font-bold hover:scale-105 transition-all flex items-center gap-2 mx-auto">
                                        🔊 Hear Again
                                    </button>
                                </div>
                                <button onClick={handleSpeak}
                                    className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl shadow-2xl transition-all ${isRecording
                                        ? 'bg-red-500 text-white animate-pulse scale-110'
                                        : 'bg-blue-600 text-white hover:scale-110 shadow-blue-500/40'}`}
                                >
                                    {isRecording ? '⏹️' : '🎙️'}
                                </button>
                                {userInput && (
                                    <p className="mt-4 text-sm text-slate-500">You said: <span className="font-bold text-slate-700 dark:text-slate-300">"{userInput}"</span></p>
                                )}
                                {feedback ? (
                                    <div className={`w-full max-w-md mt-6 p-5 rounded-2xl ${feedback.correct ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                                        <p className="font-black text-lg">{feedback.correct ? '✅ Great pronunciation!' : '❌ Try again'}</p>
                                        <p className="text-sm mt-1 opacity-70">Expected: <span className="font-bold">{feedback.expected}</span></p>
                                        <button onClick={nextItem} className="mt-4 w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:scale-105 transition-all">
                                            Continue →
                                        </button>
                                    </div>
                                ) : null}
                            </div>
                        ) : activeMode === 'quiz' ? (
                            <div className="flex flex-col items-center w-full">
                                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-700 p-8 mb-6 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">What is the translation of</p>
                                    <p className="text-2xl font-black">{item.word}</p>
                                </div>
                                <div className="w-full max-w-md grid grid-cols-1 gap-3">
                                    {quizOptions.map((opt, i) => {
                                        const isCorrect = opt.trim().toLowerCase() === translated.trim().toLowerCase();
                                        const wasSelected = feedback && (feedback.selected === opt);
                                        let btnClass = 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-500/5';
                                        if (feedback) {
                                            if (isCorrect) btnClass = 'bg-emerald-500/10 border-2 border-emerald-500 text-emerald-700';
                                            else if (wasSelected && !isCorrect) btnClass = 'bg-red-500/10 border-2 border-red-500 text-red-700';
                                            else btnClass = 'bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 opacity-50';
                                        }
                                        return (
                                            <button key={i}
                                                onClick={() => {
                                                    if (feedback) return;
                                                    const isReallyCorrect = opt.trim().toLowerCase() === translated.trim().toLowerCase();
                                                    if (isReallyCorrect) {
                                                        awardXP(XP_PER_CORRECT);
                                                        setFeedback({ correct: true, expected: translated, selected: opt });
                                                        setShowCelebration(true);
                                                        setTimeout(() => setShowCelebration(false), 1200);
                                                    } else {
                                                        setFeedback({ correct: false, expected: translated, selected: opt });
                                                    }
                                                }}
                                                className={`w-full p-5 rounded-2xl font-bold text-left text-lg transition-all shadow-sm ${btnClass}`}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>
                                {feedback && (
                                    <button onClick={nextItem} className="mt-6 px-12 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all w-full max-w-md text-center">
                                        Continue →
                                    </button>
                                )}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        );
    }

    const todayDayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const dailyTopic = DAILY_THEMES[todayDayOfYear % DAILY_THEMES.length];

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700 pb-24">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left space-y-2">
                    <div className="inline-block px-4 py-1.5 bg-emerald-600/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-1 border border-emerald-600/10">
                        Dynamic AI Learner
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-br from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Personalized Path
                    </h1>
                    <p className="text-slate-500 font-medium">Choose your own adventure or follow the daily mission.</p>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center">
                    <div className="text-3xl font-black text-slate-800 dark:text-white tabular-nums">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 group hover:scale-[1.02] transition-all">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">⚡</div>
                    <div>
                        <p className="text-3xl font-black text-blue-600">{progress.xp}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Experience</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center gap-2 group hover:scale-[1.02] transition-all">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-orange-500 font-black">
                            <span className="text-2xl group-hover:animate-bounce">🔥</span> {streakCount} Days
                        </div>
                        <div className="relative w-12 h-12">
                            <svg className="w-12 h-12 transform -rotate-90">
                                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * goalProgress) / 100} className="text-orange-500 transition-all duration-1000" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black">{Math.round(goalProgress)}%</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {getLast7Days().map((day, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <div className={`w-full h-1.5 rounded-full transition-all ${day.active ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]' : 'bg-slate-100 dark:bg-slate-700'}`} />
                                <span className="text-[9px] font-bold text-slate-400">{day.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 group hover:scale-[1.02] transition-all">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">⏱️</div>
                    <div>
                        <p className="text-3xl font-black text-purple-600">{timeInMins}<span className="text-sm">m</span></p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spent Today</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600 rounded-[40px] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-40 -mt-40 blur-3xl transition-transform group-hover:scale-125 duration-1000" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32 blur-2xl" />
                    
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="text-center lg:text-left space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                                Daily Objective
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Mastering: {dailyTopic}</h2>
                            <p className="text-indigo-100 max-w-lg text-lg font-medium opacity-90">Jump into today's AI-generated scenario and earn bonus XP while practicing contextual communication.</p>
                            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                                <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold border border-white/20">4 Dialogues</span>
                                <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold border border-white/20">Listening Practice</span>
                                <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold border border-white/20">+50 XP Bonus</span>
                            </div>
                        </div>
                        <button 
                            disabled={generating}
                            onClick={() => handleGenerateDynamic()}
                            className="w-full lg:w-auto px-12 py-6 bg-white text-indigo-700 rounded-[24px] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all text-xl flex items-center justify-center gap-4 group/btn disabled:opacity-50"
                        >
                            {generating ? (
                                <span className="w-6 h-6 border-3 border-indigo-700 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>🚀 Launch Mission <span className="group-hover:translate-x-2 transition-transform">→</span></>
                            )}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Native Language</label>
                        <select value={nativeLang} onChange={e => setNativeLang(e.target.value)}
                            className="w-full p-5 bg-white dark:bg-slate-800 rounded-[28px] shadow-lg border-2 border-slate-100 dark:border-slate-700 font-bold text-sm outline-none focus:border-blue-500 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Target Language</label>
                        <select value={targetLang} onChange={e => setTargetLang(e.target.value)}
                            className="w-full p-5 bg-white dark:bg-slate-800 rounded-[28px] shadow-lg border-2 border-slate-100 dark:border-slate-700 font-bold text-sm outline-none focus:border-emerald-500 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            {languages.filter(l => l.code !== nativeLang).map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="pt-8">
                    <GlobeSelector 
                        onSelectLanguage={(lang) => setTargetLang(lang)}
                        currentLanguage={targetLang}
                    />
                </div>

                    <div className="bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Learning Depth (Difficulty)</p>
                        <div className="grid grid-cols-5 gap-2">
                            {DIFFICULTY_LEVELS.map(level => (
                                <button
                                    key={level.id}
                                    onClick={() => setDifficulty(level.id)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border-2 ${difficulty === level.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-900 border-transparent text-slate-500 hover:border-slate-300'}`}
                                >
                                    <span className="text-xl mb-1">{level.icon}</span>
                                    <span className="text-[8px] font-black uppercase text-center leading-tight">{level.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-[40px] p-8 md:p-12 shadow-xl border border-slate-200 dark:border-slate-700 text-center space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
                    <div>
                        <h2 className="text-3xl font-black mb-3">Scenario Explorer</h2>
                        <p className="text-slate-500 max-w-md mx-auto font-medium">Create any situation you'd like to practice. Our AI will guide the conversation.</p>
                    </div>
                    
                    <div className="max-w-2xl mx-auto space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input 
                                type="text" 
                                placeholder="Try 'Ordering coffee in Paris' or 'Lost in a Tokyo subway'..."
                                value={customTopic}
                                onChange={(e) => setCustomTopic(e.target.value)}
                                className="flex-1 p-6 bg-slate-100 dark:bg-slate-900/50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all text-lg"
                            />
                            <button 
                                disabled={!customTopic.trim() || generating}
                                onClick={() => handleGenerateDynamic(customTopic)}
                                className="px-10 py-6 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all text-lg disabled:opacity-50"
                            >
                                Generate
                            </button>
                        </div>

                        <div className="flex flex-wrap justify-center gap-2 pt-2">
                            {TOPICS.slice(0, 8).map(topic => (
                                <button 
                                    key={topic}
                                    onClick={() => handleGenerateDynamic(topic)}
                                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-900/50 rounded-xl text-[11px] font-black text-slate-500 hover:text-blue-500 hover:bg-blue-500/10 transition-all border-2 border-transparent hover:border-blue-500/20 uppercase tracking-wider"
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LanguageLearner;
