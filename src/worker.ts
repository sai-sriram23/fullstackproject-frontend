const MYMEMORY_API = 'https://api.mymemory.translated.net/get';

async function translateText(text: string, srcLang: string, tgtLang: string): Promise<string> {
    const langPair = `${srcLang}|${tgtLang}`;
    const lines = text.split('\n');
    const translatedLines: string[] = [];

    for (const line of lines) {
        if (!line.trim()) {
            translatedLines.push(line);
            continue;
        }

        const segments = splitIntoSegments(line, 450);

        for (const segment of segments) {
            const url = `${MYMEMORY_API}?q=${encodeURIComponent(segment)}&langpair=${encodeURIComponent(langPair)}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            if (data.responseStatus === 200) {
                translatedLines.push(data.responseData.translatedText);
            } else {
                throw new Error(data.responseDetails || 'Translation failed');
            }
        }
    }

    return translatedLines.join('\n').replace(/\n{3,}/g, '\n\n');
}

function splitIntoSegments(text: string, maxLen: number): string[] {
    if (text.length <= maxLen) return [text];
    const segments: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let current = '';
    for (const sentence of sentences) {
        if ((current + ' ' + sentence).trim().length > maxLen && current) {
            segments.push(current.trim());
            current = sentence;
        } else {
            current = current ? current + ' ' + sentence : sentence;
        }
    }
    if (current.trim()) segments.push(current.trim());
    return segments;
}

self.addEventListener('message', async (event) => {
    const { text, src_lang, tgt_lang } = event.data;
    try {
        self.postMessage({ status: 'initiate' });
        const translatedText = await translateText(text, src_lang, tgt_lang);
        const output = [{ translation_text: translatedText }];
        self.postMessage({
            status: 'complete',
            output: output,
        });
    } catch (e: any) {
        self.postMessage({ status: 'error', error: e?.message || String(e) });
    }
});
