import React, { useState, useEffect } from 'react';

const ModelManager = () => {
    const [cacheSize, setCacheSize] = useState('Calculated...');
    const [files, setFiles] = useState([]);
    const [provider, setProvider] = useState(localStorage.getItem('ai_provider') || 'poe');

    const checkCache = async () => {
        if ('caches' in window) {
            try {
                const keys = await caches.keys();
                const fileList = [];
                for (const key of keys) {
                    const cache = await caches.open(key);
                    const requests = await cache.keys();
                    for (const request of requests) {
                        fileList.push(request.url);
                    }
                }
                setFiles(fileList);
                setCacheSize(`${fileList.length} files cached`);
            } catch (e) {
                setCacheSize('Error accessing cache');
            }
        } else {
            setCacheSize('Cache API not supported');
        }
    };

    useEffect(() => {
        checkCache();
    }, []);

    const handleProviderChange = (e) => {
        const newProvider = e.target.value;
        setProvider(newProvider);
        localStorage.setItem('ai_provider', newProvider);
    };

    const clearCache = async () => {
        if (window.confirm("Are you sure you want to delete all downloaded models? You will need to re-download them to use offline features.")) {
            if ('caches' in window) {
                const keys = await caches.keys();
                for (const key of keys) {
                    await caches.delete(key);
                }
                checkCache();
                alert("Cache cleared.");
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-8 animate-in fade-in duration-700">
            <div className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl pointer-events-none">⚙️</div>
                <h1 className="text-3xl font-black mb-2">Neural Orchestrator</h1>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">System & Model Management</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* AI Provider Section */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-xl border border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                        <span className="text-blue-500">🧠</span> AI Engine Provider
                    </h2>
                    <div className="space-y-4">
                        <p className="text-xs text-slate-500 font-medium mb-4">
                            Choose between Cloud-based POE (High Performance) or Local-based OLLAMA (Private & Local).
                        </p>
                        <div className="flex flex-col gap-3">
                            <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${provider === 'poe' ? 'border-blue-500 bg-blue-500/5' : 'border-slate-100 dark:border-slate-800'}`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">☁️</span>
                                    <div>
                                        <div className="font-black text-sm">POE API (Cloud)</div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-tight">GPT-4o Class Performance</div>
                                    </div>
                                </div>
                                <input 
                                    type="radio" 
                                    name="provider" 
                                    value="poe" 
                                    checked={provider === 'poe'} 
                                    onChange={handleProviderChange}
                                    className="w-5 h-5 accent-blue-500"
                                />
                            </label>

                            <label className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${provider === 'ollama' ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-100 dark:border-slate-800'}`}>
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🏠</span>
                                    <div>
                                        <div className="font-black text-sm">OLLAMA (Local)</div>
                                        <div className="text-[10px] text-slate-400 uppercase tracking-tight">Mistral / Llama Local Inference</div>
                                    </div>
                                </div>
                                <input 
                                    type="radio" 
                                    name="provider" 
                                    value="ollama" 
                                    checked={provider === 'ollama'} 
                                    onChange={handleProviderChange}
                                    className="w-5 h-5 accent-indigo-500"
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Local Storage Section */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-xl border border-slate-100 dark:border-slate-800">
                    <h2 className="text-xl font-black mb-6 flex items-center gap-3">
                        <span className="text-green-500">💾</span> Local Model Assets
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <p className="text-xs text-slate-500 font-medium mb-2">Browser Cache Status</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{cacheSize}</p>
                        </div>
                        
                        <button
                            onClick={clearCache}
                            className="w-full py-4 px-6 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-500/20 transition-all border border-red-200 dark:border-red-500/30"
                        >
                            Purge Cached Assets
                        </button>
                    </div>
                </div>
            </div>

            {/* Technical Trace */}
            <div className="bg-slate-50 dark:bg-slate-950/50 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-4">System Trace Logs</h3>
                <div className="max-h-48 overflow-y-auto bg-white dark:bg-slate-900 p-4 rounded-2xl text-[10px] font-mono break-all border border-slate-100 dark:border-slate-800 shadow-inner">
                    {files.length > 0 ? files.map((f, i) => (
                        <div key={i} className="mb-1 text-slate-500 dark:text-slate-400 opacity-60">
                            <span className="text-blue-500 mr-2">[CACHED]</span> {f}
                        </div>
                    )) : (
                        <div className="text-slate-400 italic">No local model traces found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModelManager;
