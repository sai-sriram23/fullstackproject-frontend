export const languages = [
    { name: 'English', code: 'eng_Latn', ocr: 'eng', speech: 'en-US' },
    { name: 'French', code: 'fra_Latn', ocr: 'fra', speech: 'fr-FR' },
    { name: 'Spanish', code: 'spa_Latn', ocr: 'spa', speech: 'es-ES' },
    { name: 'German', code: 'deu_Latn', ocr: 'deu', speech: 'de-DE' },
    { name: 'Hindi', code: 'hin_Deva', ocr: 'hin', speech: 'hi-IN' },
    { name: 'Chinese (Simplified)', code: 'zho_Hans', ocr: 'chi_sim', speech: 'zh-CN' },
    { name: 'Japanese', code: 'jpn_Jpan', ocr: 'jpn', speech: 'ja-JP' },
    { name: 'Korean', code: 'kor_Hang', ocr: 'kor', speech: 'ko-KR' },
    { name: 'Russian', code: 'rus_Cyrl', ocr: 'rus', speech: 'ru-RU' },
    { name: 'Arabic', code: 'arb_Arab', ocr: 'ara', speech: 'ar-SA' },
    { name: 'Portuguese', code: 'por_Latn', ocr: 'por', speech: 'pt-PT' },
    { name: 'Italian', code: 'ita_Latn', ocr: 'ita', speech: 'it-IT' },
    { name: 'Bengali', code: 'ben_Beng', ocr: 'ben', speech: 'bn-IN' },
    { name: 'Telugu', code: 'tel_Telu', ocr: 'tel', speech: 'te-IN' },
    { name: 'Marathi', code: 'mar_Deva', ocr: 'mar', speech: 'mr-IN' },
    { name: 'Tamil', code: 'tam_Taml', ocr: 'tam', speech: 'ta-IN' },
    { name: 'Urdu', code: 'urd_Arab', ocr: 'urd', speech: 'ur-PK' },
    { name: 'Malayalam', code: 'mal_Mlym', ocr: 'mal', speech: 'ml-IN' },
    { name: 'Kannada', code: 'kan_Knda', ocr: 'kan', speech: 'kn-IN' },
    { name: 'Punjabi', code: 'pan_Guru', ocr: 'pan', speech: 'pa-IN' },
    { name: 'Vietnamese', code: 'vie_Latn', ocr: 'vie', speech: 'vi-VN' },
];
export const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || code;
};

