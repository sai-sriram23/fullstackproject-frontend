// ─────────────────────────────────────────────────────────────────────────────
// worker.ts — Web Worker for AI Translation using NLLB-200 model.
// A Web Worker runs on a SEPARATE background thread from the main browser thread.
// This is critical because the AI model is heavy — running it on the main thread
// would freeze the UI. The worker runs in parallel and posts results back.
// ─────────────────────────────────────────────────────────────────────────────

// Import "pipeline" and "env" from @xenova/transformers.
// @xenova/transformers is a JavaScript port of Hugging Face's Transformers library.
// It can run AI models (like translation, text classification) directly in the browser
// using ONNX format models and WebAssembly (WASM).
import { pipeline, env } from '@xenova/transformers';

// Import our phrasebook lookup function.
// For very common phrases like "hello", this bypasses the AI model entirely
// and returns a pre-verified correct translation instantly.
import { lookupPhrase } from './constants/phrasebook';

// ── Model Environment Configuration ──────────────────────────────────────────

// allowLocalModels = false → don't try to load models from the local filesystem.
// Models must come from the Hugging Face Hub (downloaded over the internet on first use).
env.allowLocalModels = false;

// useBrowserCache = true → after the first download, store the model in the browser's
// Cache API. Next time the user opens the app, the model loads from cache instantly.
env.useBrowserCache = true;

// useCustomCache = false → don't use any custom cache implementation.
env.useCustomCache = false;

// numThreads = 1 → run ONNX inference on a single thread.
// Browsers often block multi-threaded WASM unless the page uses COOP/COEP headers,
// which our dev server doesn't set. 1 thread avoids "Can't create session" errors.
env.backends.onnx.wasm.numThreads = 1;

// proxy = false → run WASM directly in this worker thread.
// If true, it would create another nested worker — unnecessary here.
env.backends.onnx.wasm.proxy = false;

// ── Translation Pipeline Singleton ───────────────────────────────────────────
// A singleton ensures we only download and initialise the model ONCE,
// even if the worker receives multiple translation requests.
class TranslationPipeline {
    // The task we want the pipeline to perform.
    static task = 'translation';

    // The specific AI model to load from Hugging Face Hub.
    // NLLB-200 supports 200 languages. "distilled-600M" is a smaller,
    // faster version (600 million parameters) suitable for browser use.
    static model = 'Xenova/nllb-200-distilled-600M';

    // Stores the loaded model instance. Starts as null (not loaded yet).
    static instance: any = null;

    // Returns the existing instance, or creates a new one on first call.
    // progress_callback is called during model download to report progress (0–100%).
    static async getInstance(progress_callback: any = null) {
        if (this.instance === null) {
            // pipeline() downloads the model, compiles it to WASM/ONNX, and returns
            // a translation function. This is the slow step (first use only).
            this.instance = await pipeline(this.task as any, this.model, { progress_callback });
        }
        return this.instance;
    }
}

// ── Message Handler ───────────────────────────────────────────────────────────
// "self" refers to the Worker's global scope (not window).
// We listen for messages posted from the main thread (e.g. Translator.tsx).
// The main thread calls: worker.postMessage({ text, src_lang, tgt_lang })
self.addEventListener('message', async (event) => {
    // Destructure the incoming message data.
    const { text, src_lang, tgt_lang } = event.data;

    try {
        // Get (or create) the translation pipeline.
        // The arrow function here IS the progress_callback.
        // For each chunk of model data downloaded, it posts a progress message
        // back to the main thread so the UI can show a progress bar.
        const translator = await TranslationPipeline.getInstance((x: any) => {
            self.postMessage(x); // x contains { status: 'progress', progress: 45, file: '...' }
        });

        // ── Smart Text Chunking ───────────────────────────────────────────────
        // NLLB-200 has a max input length. We split long text into chunks
        // to avoid exceeding the model's token limit.

        // First split by newlines to preserve paragraph/line structure.
        const rawLines = text.split('\n');

        // "chunks" will hold the final list of text pieces to translate one by one.
        const chunks: string[] = [];

        for (const line of rawLines) {
            if (line.length < 200) {
                // Short lines can be translated as-is.
                chunks.push(line);
            } else {
                // Long lines: split at sentence boundaries (after . , ! ?)
                // (?<=[.,!?]) is a "lookbehind" — split AFTER punctuation, not before.
                const subChunks = line.split(/(?<=[.,!?])\s+/);
                for (let sub of subChunks) {
                    // If a sub-chunk is still > 200 chars, force-split it every 200 chars.
                    while (sub.length > 200) {
                        chunks.push(sub.substring(0, 200)); // take first 200 chars
                        sub = sub.substring(200);            // continue with the rest
                    }
                    if (sub) chunks.push(sub); // push the final remainder
                }
            }
        }

        // ── Translate Each Chunk ──────────────────────────────────────────────
        const translatedChunks: string[] = [];

        for (const chunk of chunks) {
            // Skip empty lines — preserve whitespace structure in the output.
            if (!chunk.trim()) {
                translatedChunks.push(chunk);
                continue;
            }

            // ── Phrasebook Fast-path ──────────────────────────────────────────
            // Check if the chunk is a common phrase (hello, thank you, etc.).
            // If it matches, use the pre-verified translation WITHOUT calling the AI.
            // This fixes the issue where "hello" was translated to "Je vous en prie".
            const phraseHit = lookupPhrase(chunk, src_lang, tgt_lang);
            if (phraseHit) {
                translatedChunks.push(phraseHit);
                continue; // skip the AI model call
            }

            // ── Dynamic Token Budget ──────────────────────────────────────────
            // The number of output tokens we allow scales with the input word count.
            // Short inputs get fewer tokens (prevents hallucination / over-generation).
            // min 32 tokens, max 256 tokens, scaling: 4 tokens per input word.
            const wordCount = chunk.trim().split(/\s+/).length;
            const max_new_tokens = Math.min(256, Math.max(32, wordCount * 4));

            // ── Call the AI Translation Model ─────────────────────────────────
            const out = await translator(chunk, {
                src_lang: src_lang,   // source language NLLB code (e.g. 'eng_Latn')
                tgt_lang: tgt_lang,   // target language NLLB code (e.g. 'fra_Latn')

                // num_beams: 10 — beam search with 10 candidates.
                // Instead of greedily picking the highest-probability token at each step
                // (which leads to formal/wrong translations for short phrases),
                // beam search tracks 10 candidate sequences and picks the overall best.
                num_beams: 10,

                // length_penalty: 1.0 — neutral. 
                // Values < 1 penalise longer outputs (bad for multi-word translations).
                // Values > 1 encourage longer outputs.
                length_penalty: 1.0,

                // early_stopping: true — stop generation as soon as every beam has
                // produced an end-of-sequence token. Avoids unnecessary computation.
                early_stopping: true,

                // no_repeat_ngram_size: 3 — prevents the model from repeating
                // any 3-word sequence (avoids outputs like "hello hello hello").
                no_repeat_ngram_size: 3,

                max_new_tokens,
            });

            // out[0].translation_text is the translated string for this chunk.
            translatedChunks.push(out[0]?.translation_text || '');
        }

        // ── Reassemble and Send Result ────────────────────────────────────────
        // Join all translated chunks back with newlines.
        // .replace(/\n+/g, '\n') collapses multiple consecutive newlines into one.
        const output = [{ translation_text: translatedChunks.join('\n').replace(/\n+/g, '\n') }];

        // Post the final translation result back to the main thread.
        // The main thread's "message" event listener catches this.
        self.postMessage({
            status: 'complete',
            output: output,
        });

    } catch (e: any) {
        // If anything goes wrong, post an error message back to the main thread.
        // e?.message safely accesses the error message (if e is undefined, returns undefined).
        // String(e) is a fallback in case e is not an Error object.
        self.postMessage({ status: 'error', error: e?.message || String(e) });
    }
});
