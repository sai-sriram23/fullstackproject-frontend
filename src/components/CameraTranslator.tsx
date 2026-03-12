// ─────────────────────────────────────────────────────────────────────────────
// CameraTranslator.tsx — Live camera → OCR → translation pipeline.
// Uses the MediaDevices API (getUserMedia) for real camera access,
// the Canvas API to capture still frames, Tesseract.js for OCR,
// and the NLLB-200 Web Worker for translation.
// ─────────────────────────────────────────────────────────────────────────────

// useState  — component-level state (captured image, OCR result, etc.)
// useEffect — lifecycle hooks (start camera on mount, cleanup on unmount)
// useRef    — persistent mutable values (video element, canvas, worker, stream)
// useCallback — memoises functions so they aren't re-created on every render
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Tesseract — OCR engine running in-browser via WebAssembly.
import Tesseract from 'tesseract.js';

// saveHistory — POSTs completed translations to the backend history log.
import { saveHistory } from '../services/api';

// languages — full list of NLLB + speech API codes for the language selector.
import { languages } from '../constants/languages';

// preprocessImageForOCR — enhances image quality before OCR.
// cleanOCRText          — filters out OCR garbage tokens.
import { preprocessImageForOCR, cleanOCRText } from '../utils/imagePreprocessing';

// InputMode — TypeScript type alias for the two input source options.
type InputMode = 'camera' | 'upload';

const CameraTranslator: React.FC = () => {
    // ── State ──────────────────────────────────────────────────────────────────

    // inputMode — whether the user is using the live camera or uploading a file.
    const [inputMode, setInputMode] = useState<InputMode>('camera');

    // image — a data URL (PNG from canvas capture) or object URL (uploaded file).
    const [image, setImage] = useState<string | null>(null);

    // ocrText — cleaned text extracted from the image by Tesseract.
    const [ocrText, setOcrText] = useState('');

    // translatedText — the AI translation of the OCR text.
    const [translatedText, setTranslatedText] = useState('');

    // tgtLang — NLLB code of the translation target language.
    const [tgtLang, setTgtLang] = useState('fra_Latn');

    // ocrProgress — 0–100, reported by Tesseract during 'recognizing text' phase.
    const [ocrProgress, setOcrProgress] = useState(0);

    // transProgress — model loading progress data from the Web Worker.
    const [transProgress, setTransProgress] = useState<any>(null);

    // status — human-readable status string shown during processing.
    const [status, setStatus] = useState('');

    // isLoading — true while either OCR or translation is running.
    const [isLoading, setIsLoading] = useState(false);

    // camActive — true while the live camera stream is running.
    const [camActive, setCamActive] = useState(false);

    // camError — error message string if camera access was denied or not found.
    const [camError, setCamError] = useState('');

    // facingMode — 'user' = front camera (selfie), 'environment' = rear camera.
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

    // ── Refs ───────────────────────────────────────────────────────────────────

    // worker — the Web Worker running NLLB-200 translation (persistent across renders).
    const worker = useRef<Worker | null>(null);

    // ocrRef — a ref holding the latest ocrText, used inside async callbacks to
    // avoid stale closure bugs (where the callback captures an old value of ocrText).
    const ocrRef = useRef('');

    // videoRef — reference to the <video> DOM element that shows the live camera feed.
    const videoRef = useRef<HTMLVideoElement>(null);

    // canvasRef — an invisible <canvas> element used to grab still frames from the video.
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // streamRef — the MediaStream object from getUserMedia. We hold it in a ref so
    // we can call .stop() on all its tracks when the camera needs to shut down.
    const streamRef = useRef<MediaStream | null>(null);

    // fileInputRef — reference to the hidden file <input> for the upload mode.
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync ocrRef whenever ocrText state changes.
    useEffect(() => { ocrRef.current = ocrText; }, [ocrText]);

    // ── Translation Worker Setup ───────────────────────────────────────────────
    useEffect(() => {
        // Create the Web Worker once on mount.
        if (!worker.current) {
            worker.current = new Worker(new URL('../worker.ts', import.meta.url), { type: 'module' });
        }

        // Handle messages from the worker (progress updates and final results).
        const onMsg = (e: MessageEvent) => {
            const { status: s, output, error } = e.data;
            if (s === 'progress') {
                setTransProgress(e.data); // update loading bar
            } else if (s === 'complete') {
                const translated = output[0].translation_text;
                setTranslatedText(translated);
                setTransProgress(null);    // hide loading bar
                setIsLoading(false);
                setStatus('✅ Done');

                // Save the result to the backend history.
                const username = localStorage.getItem('username') || 'anonymous';
                saveHistory({ username, type: 'CAMERA_TRANSLATE', sourceText: ocrRef.current, resultText: translated })
                    .catch(() => { }); // silently ignore history save failures
            } else if (s === 'error') {
                setStatus('Translation error: ' + error);
                setIsLoading(false);
            }
        };

        worker.current.addEventListener('message', onMsg);
        // Cleanup: remove message listener when component unmounts.
        return () => worker.current?.removeEventListener('message', onMsg);
    }, []);

    // ── Camera Control Functions ────────────────────────────────────────────────

    // stopCamera — stops all camera tracks and clears the stream.
    // useCallback ensures this function instance is stable (doesn't change on every render),
    // which prevents infinite loops when used as a useEffect dependency.
    const stopCamera = useCallback(() => {
        // getTracks() returns an array of MediaStreamTrack objects (video/audio streams).
        // We call .stop() on each to physically close the camera hardware.
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setCamActive(false);
    }, []);

    // startCamera — requests camera access via the MediaDevices API and starts the stream.
    const startCamera = useCallback(async () => {
        setCamError('');
        stopCamera(); // stop any existing stream before starting a new one

        try {
            // navigator.mediaDevices.getUserMedia() asks the browser for camera access.
            // The browser will show a permission dialog to the user.
            // Returns a MediaStream containing the camera video feed.
            const stream = await navigator.mediaDevices.getUserMedia({
                // video constraints: which camera and ideal resolution.
                video: {
                    facingMode,              // 'environment' = rear camera, 'user' = front
                    width: { ideal: 1280 }, // request HD width (browser may give less)
                    height: { ideal: 720 },  // request HD height
                },
                audio: false, // we don't want audio from the camera
            });

            streamRef.current = stream; // save the stream for later cleanup

            if (videoRef.current) {
                // Attach the stream to the <video> element.
                // The video element then renders the live camera frame.
                videoRef.current.srcObject = stream;
                videoRef.current.play(); // start playing the video feed
            }
            setCamActive(true);
        } catch (err: any) {
            // Handle specific error types with friendly messages.
            const msg = err?.name === 'NotAllowedError'
                ? 'Camera access denied. Please allow camera permissions in your browser settings.'
                : err?.name === 'NotFoundError'
                    ? 'No camera found on this device.'
                    : 'Could not open camera: ' + err?.message;
            setCamError(msg);
        }
    }, [facingMode, stopCamera]);

    // Restart camera when the user flips between front/back camera.
    // This effect runs whenever facingMode changes.
    useEffect(() => {
        if (camActive) startCamera();
    }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

    // Stop camera when the component unmounts (user navigates away).
    // The cleanup function returned from useEffect runs on unmount.
    useEffect(() => () => stopCamera(), [stopCamera]);

    // Stop camera when user switches to "Upload" mode (camera not needed).
    useEffect(() => {
        if (inputMode === 'upload') stopCamera();
    }, [inputMode, stopCamera]);

    // ── Frame Capture ──────────────────────────────────────────────────────────
    // captureFrame — draws the current video frame onto the canvas and saves as PNG data URL.
    const captureFrame = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        // Set canvas size to match the actual video resolution
        // (video.videoWidth/videoHeight are the real camera pixel dimensions).
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // getContext('2d') returns the 2D drawing API for the canvas.
        // drawImage(video, 0, 0) copies the current video frame to the canvas.
        canvas.getContext('2d')!.drawImage(video, 0, 0);

        // toDataURL('image/png') serialises the canvas as a PNG in base64 format.
        // This data URL can be passed directly to Tesseract and shown in an <img>.
        const dataUrl = canvas.toDataURL('image/png');
        setImage(dataUrl);

        // Reset any previous results.
        setOcrText('');
        setTranslatedText('');
        setStatus('');
    }, []);

    // ── File Upload Handler ────────────────────────────────────────────────────
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            // Create a temporary object URL pointing to the uploaded file in memory.
            setImage(URL.createObjectURL(e.target.files[0]));
            setOcrText('');
            setTranslatedText('');
            setStatus('');
        }
    };

    // ── OCR + Translation Pipeline ─────────────────────────────────────────────
    const processImage = async () => {
        if (!image) return;
        setIsLoading(true);
        setOcrProgress(0);
        setTransProgress(null);
        setOcrText('');
        setTranslatedText('');

        try {
            // Step 1: Enhance the image for better OCR accuracy.
            setStatus('Optimising image…');
            const processed = await preprocessImageForOCR(image);

            // Step 2: Run OCR on the enhanced image.
            setStatus('Extracting text (OCR)…');
            const result = await Tesseract.recognize(processed, 'eng', {
                // The logger receives updates during OCR. We show progress on the UI.
                logger: (m: any) => {
                    if (m.status === 'recognizing text') setOcrProgress(m.progress * 100);
                    setStatus(m.status);
                },
            });

            // Step 3: Clean the raw OCR output.
            const text = cleanOCRText(result.data.text);
            setOcrText(text);

            if (!text) {
                // Tesseract found no meaningful text in the image.
                setStatus('No readable text found in image.');
                setIsLoading(false);
                return;
            }

            // Step 4: Send the extracted text to the Web Worker for translation.
            // src_lang is always English (we OCR English text from camera captures).
            setStatus('Translating…');
            worker.current?.postMessage({ text, src_lang: 'eng_Latn', tgt_lang: tgtLang });
        } catch (err) {
            setStatus('Error: ' + err);
            setIsLoading(false);
        }
    };

    // Combined progress: show OCR progress while OCRing, else show translation progress.
    // The * 100 converts the worker's 0–1 float to 0–100.
    const progressVal = ocrProgress || (transProgress?.progress * 100) || 0;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700 pb-24">

            {/* ── Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                        Camera Translator
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">Point camera → Extract text → Translate instantly</p>
                </div>
                {/* Target language selector */}
                <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="text-xs font-bold text-slate-400 uppercase ml-2">Translate to:</span>
                    <select value={tgtLang} onChange={e => setTgtLang(e.target.value)}
                        className="bg-transparent text-sm font-bold outline-none cursor-pointer pr-4">
                        {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                    </select>
                </div>
            </div>

            {/* ── Mode Toggle (Camera / Upload) ── */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
                {(['camera', 'upload'] as InputMode[]).map(m => (
                    <button key={m} onClick={() => setInputMode(m)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${inputMode === m
                            ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white'
                            : 'text-slate-400 hover:text-slate-600'}`}>
                        {m === 'camera' ? '📸 Live Camera' : '🖼️ Upload Image'}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ── Input Panel ── */}
                <div className="space-y-4">
                    {inputMode === 'camera' ? (
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            {/* Live video feed area */}
                            <div className="relative bg-black aspect-video w-full">
                                {/* The <video> element renders the camera stream.
                                    autoPlay = starts playing as soon as srcObject is set.
                                    playsInline = required on iOS to avoid fullscreen takeover.
                                    muted = no audio feedback (would cause echo). */}
                                <video ref={videoRef} autoPlay playsInline muted
                                    className={`w-full h-full object-cover ${camActive ? 'opacity-100' : 'opacity-0'}`} />

                                {/* Invisible canvas used only for frame capture — never shown to user */}
                                <canvas ref={canvasRef} className="hidden" />

                                {/* Placeholder shown when camera is off */}
                                {!camActive && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
                                        <span className="text-6xl">📷</span>
                                        <p className="font-bold text-sm text-white/70">Camera is off</p>
                                    </div>
                                )}

                                {/* Flip camera button — toggles facingMode between front/back */}
                                {camActive && (
                                    <button onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')}
                                        className="absolute top-3 right-3 p-2 bg-black/50 rounded-xl text-white text-lg hover:bg-black/70 transition-colors"
                                        title="Flip camera">
                                        🔄
                                    </button>
                                )}
                            </div>

                            {/* Camera control buttons */}
                            <div className="p-4 flex gap-3">
                                {!camActive ? (
                                    // Start Camera button — calls getUserMedia
                                    <button onClick={startCamera}
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                                        📷 Start Camera
                                    </button>
                                ) : (
                                    <>
                                        {/* Capture button — grabs current frame from video */}
                                        <button onClick={captureFrame}
                                            className="flex-1 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2">
                                            📸 Capture
                                        </button>
                                        {/* Stop button — closes the camera (stops tracks) */}
                                        <button onClick={stopCamera}
                                            className="px-5 py-3 bg-red-500/10 text-red-500 rounded-2xl font-bold hover:bg-red-500/20 transition-colors">
                                            Stop
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Camera permission error message */}
                            {camError && (
                                <div className="mx-4 mb-4 p-3 rounded-2xl bg-red-500/10 text-red-500 text-sm font-semibold">
                                    ⚠️ {camError}
                                </div>
                            )}
                        </div>
                    ) : (
                        // ── Upload Mode ──
                        // Clicking the label triggers the hidden file input below.
                        <label className="block cursor-pointer">
                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-3xl p-10 text-center hover:border-blue-400 hover:bg-blue-500/5 transition-all">
                                <span className="text-5xl">🖼️</span>
                                <p className="font-semibold text-slate-500 mt-3">Click to upload an image</p>
                                <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP</p>
                            </div>
                            {/* Hidden file input — opened by the <label> above */}
                            <input ref={fileInputRef} type="file" accept="image/*"
                                onChange={handleFileChange} className="hidden" />
                        </label>
                    )}

                    {/* Captured / uploaded image preview + "Extract & Translate" button */}
                    {image && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-400">
                            <img src={image} alt="Captured"
                                className="w-full h-48 object-cover rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg" />
                            <button onClick={processImage} disabled={isLoading}
                                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                                {isLoading
                                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{status}</>
                                    : '⚡ Extract & Translate'}
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Results Panel ── */}
                <div className="space-y-6">
                    {/* Progress bar — visible while OCR or translation is running */}
                    {isLoading && (
                        <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-3xl">
                            <p className="text-xs font-black text-blue-500 mb-3 uppercase tracking-widest">{status}</p>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                                {/* width is driven by progressVal (0–100) */}
                                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${progressVal}%` }} />
                            </div>
                            <p className="text-right text-xs text-slate-400 mt-1">{Math.round(progressVal)}%</p>
                        </div>
                    )}

                    {/* OCR text result card */}
                    {ocrText && (
                        <ResultCard icon="📄" title="Extracted Text" text={ocrText} color="slate" />
                    )}
                    {/* Translation result card */}
                    {translatedText && (
                        <ResultCard
                            icon="🌐"
                            title={`Translation → ${languages.find(l => l.code === tgtLang)?.name}`}
                            text={translatedText}
                            color="indigo"
                        />
                    )}

                    {/* Placeholder shown before any results */}
                    {!ocrText && !translatedText && !isLoading && (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-200 dark:text-slate-800 border-2 border-dashed border-slate-100 dark:border-slate-900 rounded-3xl">
                            <span className="text-6xl mb-3">🔍</span>
                            <p className="font-bold">Results appear here</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── ResultCard — reusable output card ─────────────────────────────────────────
// A simple presentational component (no state) that renders a titled text card.
// Props are destructured directly in the function signature using TypeScript types.
const ResultCard = ({ icon, title, text, color }: { icon: string; title: string; text: string; color: string }) => (
    <div className={`p-6 bg-white dark:bg-slate-800/60 rounded-3xl shadow-xl border
        ${color === 'indigo' ? 'border-indigo-500/20' : 'border-slate-200 dark:border-slate-700'}
        animate-in slide-in-from-bottom-4 duration-500`}>
        <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center text-xl">
                {icon}
            </div>
            <h3 className="font-black">{title}</h3>
        </div>
        <p className="text-base leading-relaxed text-slate-700 dark:text-slate-200">{text}</p>
    </div>
);

export default CameraTranslator;
