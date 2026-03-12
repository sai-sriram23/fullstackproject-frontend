// ─────────────────────────────────────────────────────────────────────────────
// languages.ts — Central list of all supported languages with their codes.
// Used everywhere: Translator, Voice, OCR, CameraTranslator, Dashboard.
// ─────────────────────────────────────────────────────────────────────────────

// Each language object has four properties:
//   name    — Human-readable name shown in dropdowns
//   code    — NLLB/FLORES-200 code used by the AI translation model (NLLB-200)
//   ocr     — Tesseract.js language code used for OCR text detection
//   speech  — BCP-47 language tag used by the Web Speech API (recognition + synthesis)

// "export" means this variable is accessible in other files via import.
// "const" means this variable cannot be reassigned.
// The square brackets [] denote an array of objects.
export const languages = [
    // English — NLLB code: eng_Latn (Latin script), speech: en-US (American English)
    { name: 'English', code: 'eng_Latn', ocr: 'eng', speech: 'en-US' },
    { name: 'French', code: 'fra_Latn', ocr: 'fra', speech: 'fr-FR' },
    { name: 'Spanish', code: 'spa_Latn', ocr: 'spa', speech: 'es-ES' },
    { name: 'German', code: 'deu_Latn', ocr: 'deu', speech: 'de-DE' },
    // hin_Deva — Hindi uses the Devanagari script (hence "Deva")
    { name: 'Hindi', code: 'hin_Deva', ocr: 'hin', speech: 'hi-IN' },
    // zho_Hans — Simplified Chinese (Hans = Hanzi Simplified)
    { name: 'Chinese (Simplified)', code: 'zho_Hans', ocr: 'chi_sim', speech: 'zh-CN' },
    // jpn_Jpan — Japanese (uses its own script family: Hiragana, Katakana, Kanji)
    { name: 'Japanese', code: 'jpn_Jpan', ocr: 'jpn', speech: 'ja-JP' },
    // kor_Hang — Korean (Hangul script)
    { name: 'Korean', code: 'kor_Hang', ocr: 'kor', speech: 'ko-KR' },
    // rus_Cyrl — Russian (Cyrillic script)
    { name: 'Russian', code: 'rus_Cyrl', ocr: 'rus', speech: 'ru-RU' },
    // arb_Arab — Arabic (Arabic script, right-to-left)
    { name: 'Arabic', code: 'arb_Arab', ocr: 'ara', speech: 'ar-SA' },
    { name: 'Portuguese', code: 'por_Latn', ocr: 'por', speech: 'pt-PT' },
    { name: 'Italian', code: 'ita_Latn', ocr: 'ita', speech: 'it-IT' },
    // ben_Beng — Bengali (Bengali script)
    { name: 'Bengali', code: 'ben_Beng', ocr: 'ben', speech: 'bn-IN' },
    // tel_Telu — Telugu (Telugu script, south Indian)
    { name: 'Telugu', code: 'tel_Telu', ocr: 'tel', speech: 'te-IN' },
    // mar_Deva — Marathi (shares Devanagari script with Hindi)
    { name: 'Marathi', code: 'mar_Deva', ocr: 'mar', speech: 'mr-IN' },
    // tam_Taml — Tamil (Tamil script, south Indian)
    { name: 'Tamil', code: 'tam_Taml', ocr: 'tam', speech: 'ta-IN' },
    // urd_Arab — Urdu (uses Arabic script, written right-to-left)
    { name: 'Urdu', code: 'urd_Arab', ocr: 'urd', speech: 'ur-PK' },
    // mal_Mlym — Malayalam (Malayalam script, Kerala)
    { name: 'Malayalam', code: 'mal_Mlym', ocr: 'mal', speech: 'ml-IN' },
    // kan_Knda — Kannada (Kannada script, Karnataka)
    { name: 'Kannada', code: 'kan_Knda', ocr: 'kan', speech: 'kn-IN' },
    // pan_Guru — Punjabi (Gurmukhi script)
    { name: 'Punjabi', code: 'pan_Guru', ocr: 'pan', speech: 'pa-IN' },
    { name: 'Vietnamese', code: 'vie_Latn', ocr: 'vie', speech: 'vi-VN' },
];

// Helper function: given an NLLB code, return the human-readable name.
// Example: getLanguageName('fra_Latn') returns 'French'
// Uses Array.find() to search the array for a matching code.
// The ?. (optional chaining) means: if find() returns undefined, don't crash — return undefined.
// The || code at the end is a fallback: if the name isn't found, return the raw code itself.
export const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || code;
};
