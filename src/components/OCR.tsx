// ─────────────────────────────────────────────────────────────────────────────
// OCR.tsx — Extract text from images using Tesseract.js.
// OCR = Optical Character Recognition: reads text from photos/screenshots.
// Includes two modes: Document (normal pages) and Diagram/Flowchart (scattered text).
// ─────────────────────────────────────────────────────────────────────────────

// useState — store UI state: uploaded image, extracted text, loading status, etc.
import React, { useState } from 'react';

// Tesseract — the OCR engine. tesseract.js is a WebAssembly port of the Tesseract
// C++ OCR engine, capable of recognising text in 100+ languages in the browser.
import Tesseract from 'tesseract.js';

// preprocessImageForOCR — enhances the image before OCR (contrast boost, grayscale, threshold).
// cleanOCRText          — removes OCR noise (random symbols, short garbage tokens).
import { preprocessImageForOCR, cleanOCRText } from '../utils/imagePreprocessing';
import { arrangeOCRText } from '../utils/ocrFormatter';

// OcrMode — a TypeScript "type alias" for the two possible mode strings.
// This is purely for type safety; it doesn't affect runtime behaviour.
type OcrMode = 'auto' | 'sparse';

const OCR: React.FC = () => {
    // ── State ──────────────────────────────────────────────────────────────────

    // image — the data URL / object URL of the uploaded image.
    // null means no image has been uploaded yet.
    const [image, setImage] = useState<string | null>(null);

    // text — the final cleaned text extracted by Tesseract.
    const [text, setText] = useState('');

    // progress — a number 0–100 representing OCR recognition progress.
    const [progress, setProgress] = useState(0);

    // status — a human-readable status message like "recognizing text".
    const [status, setStatus] = useState('');

    // isLoading — true while OCR is running; disables the button to prevent double-clicks.
    const [isLoading, setIsLoading] = useState(false);

    // mode — which Tesseract Page Segmentation Mode to use:
    //   'auto'   → PSM.AUTO (3): standard document mode, assumes reading order.
    //   'sparse' → PSM.SPARSE_TEXT (11): treats each text fragment independently.
    //              Best for diagrams/flowcharts where text is scattered around.
    const [mode, setMode] = useState<OcrMode>('auto');

    // copied — controls the "✅ Copied!" feedback on the copy button.
    const [copied, setCopied] = useState(false);

    // isFormatted — toggle between raw and arranged text.
    const [isFormatted, setIsFormatted] = useState(false);

    // ── Image Upload Handler ────────────────────────────────────────────────────
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // e.target.files is a FileList; the ?. (optional chaining) safely accesses [0].
        if (e.target.files?.[0]) {
            // URL.createObjectURL() creates a temporary memory URL pointing to the file.
            // This is more efficient than reading the file as a base64 string.
            setImage(URL.createObjectURL(e.target.files[0]));
            // Reset all previous results when a new image is uploaded.
            setText('');
            setProgress(0);
            setStatus('');
        }
    };

    // ── Main OCR Pipeline ───────────────────────────────────────────────────────
    const handleOCR = async () => {
        if (!image) return; // guard: do nothing if no image is loaded
        setIsLoading(true);
        setText('');

        try {
            setStatus('Optimizing image...');
            // Step 1: Preprocess the image.
            // This improves OCR accuracy by: scaling 2x, converting to grayscale,
            // boosting contrast, and thresholding (every pixel → black or white).
            const processedImage = await preprocessImageForOCR(image);

            setStatus('Starting OCR engine...');
            // Step 2: Create a Tesseract worker.
            // A "worker" here is Tesseract's internal processing thread (different
            // from a Web Worker — it manages its own WASM execution).
            // 'eng' = use English language data. 1 = verbosity level (medium logging).
            const worker = await Tesseract.createWorker('eng', 1, {
                // The logger callback is called frequently during OCR.
                // m.status is a string like 'loading tesseract core', 'recognizing text'.
                // m.progress is a float 0–1; we multiply by 100 for a percentage.
                logger: (m: any) => {
                    if (m.status === 'recognizing text') setProgress(m.progress * 100);
                    setStatus(m.status);
                },
            });

            // Step 3: Set the Page Segmentation Mode.
            // PSM.SPARSE_TEXT (11) — Tesseract does NOT assume any reading order.
            // It finds text fragments anywhere on the image, ideal for flowcharts.
            // PSM.AUTO (3) — Tesseract assumes a standard document reading flow.
            await worker.setParameters({
                tessedit_pageseg_mode:
                    mode === 'sparse'
                        ? Tesseract.PSM.SPARSE_TEXT  // value: 11
                        : Tesseract.PSM.AUTO,         // value: 3
            });

            // Step 4: Run OCR — returns all detected text and confidence scores.
            const result = await worker.recognize(processedImage);

            // Step 5: Terminate the worker to free WebAssembly memory.
            // Not doing this causes memory leaks in long-running sessions.
            await worker.terminate();

            // Step 6: Clean up the raw text by removing noise tokens.
            // result.data.text is the raw multi-line string Tesseract produced.
            setText(cleanOCRText(result.data.text));
        } catch (err) {
            console.error(err);
            setStatus('Error: ' + err);
        } finally {
            // "finally" runs whether the try succeeded or the catch triggered.
            // Always re-enable the button after processing finishes.
            setIsLoading(false);
        }
    };

    // ── Smart Arrange ──────────────────────────────────────────────────────────
    const handleSmartArrange = () => {
        if (!text) return;
        const arranged = arrangeOCRText(text);
        setText(arranged);
        setIsFormatted(true);
    };

    // ── Copy to Clipboard ────────────────────────────────────────────────────────
    const handleCopy = () => {
        // navigator.clipboard.writeText() is the modern async Clipboard API.
        navigator.clipboard.writeText(text);
        setCopied(true);
        // After 2000ms (2 seconds), reset the copied state — button label reverts.
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-700">
            {/* Page header */}
            <div className="text-center space-y-1">
                <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                    OCR Engine
                </h1>
                <p className="text-sm text-slate-400">Extract text from images, diagrams, and documents</p>
            </div>

            {/* ── Mode Toggle ── */}
            {/* Renders a segmented control with two buttons */}
            <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit mx-auto">
                {/* Array of modes mapped to buttons.
                    "as OcrMode[]" = TypeScript type assertion: treat these literals as OcrMode. */}
                {(['auto', 'sparse'] as OcrMode[]).map((m) => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        // Active mode gets a white card + shadow, inactive gets muted text.
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === m
                                ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        {/* Ternary to show the right label for each mode */}
                        {m === 'auto' ? '📄 Document' : '🗺️ Diagram / Flowchart'}
                    </button>
                ))}
            </div>

            {/* ── Upload Area ── */}
            {/* The <label> wraps the <input type="file"> so clicking anywhere on the 
                upload area opens the file picker. This is a CSS trick for custom file inputs. */}
            <label className="block w-full cursor-pointer">
                <div className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all
                    ${image
                        ? 'border-emerald-500/40 bg-emerald-500/5'  // image loaded: green tint
                        : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400 hover:bg-emerald-500/5'
                    }`}>
                    {/* Conditional rendering: show image preview OR upload prompt */}
                    {image ? (
                        <img src={image} alt="Source" className="max-h-72 rounded-2xl mx-auto shadow-xl object-contain" />
                    ) : (
                        <div className="space-y-3 text-slate-400">
                            <p className="text-5xl">🖼️</p>
                            <p className="font-semibold">Drop an image or click to upload</p>
                            <p className="text-xs">PNG, JPG, WEBP supported</p>
                        </div>
                    )}
                </div>
                {/* Hidden file input — triggered by clicking the label above */}
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>

            {/* ── Extract Button ── */}
            <button
                onClick={handleOCR}
                // disabled when no image is loaded or OCR is already running
                disabled={!image || isLoading}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
            >
                {isLoading ? (
                    // Spinner + dynamic status text while OCR runs
                    <>
                        {/* Spinning border animation using CSS border trick */}
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {status}{progress > 0 ? ` (${Math.round(progress)}%)` : ''}
                    </>
                ) : (
                    <><span>Extract Text</span><span className="text-lg">→</span></>
                )}
            </button>

            {/* ── Result Card — only renders when there's text ── */}
            {text && (
                <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    {/* Card header with copy button */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-500/10">
                        <div className="flex items-center gap-3">
                            <h3 className="font-black text-emerald-600 dark:text-emerald-400">📄 Extracted Text</h3>
                            <button
                                onClick={handleSmartArrange}
                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                                    ${isFormatted
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                                    }`}
                            >
                                {isFormatted ? '✨ Arranged' : '✨ Smart Arrange'}
                            </button>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                            {copied ? '✅ Copied!' : '📋 Copy'}
                        </button>
                    </div>
                    {/* Extracted text — whitespace-pre-wrap preserves line breaks from OCR */}
                    <div className="px-6 py-5 whitespace-pre-wrap text-sm leading-relaxed dark:text-slate-200">
                        {text}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OCR;
