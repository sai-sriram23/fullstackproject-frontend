import { pipeline, env } from '@xenova/transformers';
import { lookupPhrase } from './constants/phrasebook';
env.allowLocalModels = false;
env.useBrowserCache = true;
env.useCustomCache = false;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;
class TranslationPipeline {
    static task = 'translation';
    static model = 'Xenova/nllb-200-distilled-600M';
    static instance: any = null;
    static async getInstance(progress_callback: any = null) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task as any, this.model, { progress_callback });
        }
        return this.instance;
    }
}
self.addEventListener('message', async (event) => {
    const { text, src_lang, tgt_lang } = event.data;
    try {
        const translator = await TranslationPipeline.getInstance((x: any) => {
            self.postMessage(x);
        });
        const rawLines = text.split('\n');
        const chunks: string[] = [];
        for (const line of rawLines) {
            if (line.length < 200) {
                chunks.push(line);
            } else {
                const subChunks = line.split(/(?<=[.,!?])\s+/);
                for (let sub of subChunks) {
                    while (sub.length > 200) {
                        chunks.push(sub.substring(0, 200));
                        sub = sub.substring(200);
                    }
                    if (sub) chunks.push(sub);
                }
            }
        }
        const translatedChunks: string[] = [];
        for (const chunk of chunks) {
            if (!chunk.trim()) {
                translatedChunks.push(chunk);
                continue;
            }
            const phraseHit = lookupPhrase(chunk, src_lang, tgt_lang);
            if (phraseHit) {
                translatedChunks.push(phraseHit);
                continue;
            }
            const wordCount = chunk.trim().split(/\s+/).length;
            const max_new_tokens = Math.min(256, Math.max(32, wordCount * 4));
            const out = await translator(chunk, {
                src_lang: src_lang,
                tgt_lang: tgt_lang,
                num_beams: 10,
                length_penalty: 1.0,
                early_stopping: true,
                no_repeat_ngram_size: 3,
                max_new_tokens,
            });
            translatedChunks.push(out[0]?.translation_text || '');
        }
        const output = [{ translation_text: translatedChunks.join('\n').replace(/\n+/g, '\n') }];
        self.postMessage({
            status: 'complete',
            output: output,
        });
    } catch (e: any) {
        self.postMessage({ status: 'error', error: e?.message || String(e) });
    }
});

