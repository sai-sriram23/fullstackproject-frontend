// ─────────────────────────────────────────────────────────────────────────────
// phrasebook.ts — Pre-verified translations for common short phrases.
// The NLLB-200 AI model often produces wrong/formal translations for very short
// inputs like "hello" because it lacks context. This phrasebook bypasses the
// model for known phrases and returns guaranteed-correct translations instantly.
// ─────────────────────────────────────────────────────────────────────────────

// Structure: PHRASEBOOK[normalised_english_phrase][NLLB_target_language_code] = translation
// Record<K, V> is a TypeScript utility type meaning "an object whose keys are K and values are V".
// Record<string, Record<string, string>> = { phrase: { langCode: translation } }
export const PHRASEBOOK: Record<string, Record<string, string>> = {

    // ── Greetings ─────────────────────────────────────────────────────────────

    // "hello" — most misused word by NLLB. It was producing "Je vous salue" (I salute you).
    'hello': {
        fra_Latn: 'Bonjour',          // French — standard greeting
        spa_Latn: 'Hola',             // Spanish
        deu_Latn: 'Hallo',            // German
        hin_Deva: 'नमस्ते',            // Hindi — traditional greeting in Devanagari script
        zho_Hans: '你好',              // Simplified Chinese — nǐ hǎo (you good)
        jpn_Jpan: 'こんにちは',         // Japanese — konnichiwa
        kor_Hang: '안녕하세요',          // Korean — annyeonghaseyo
        rus_Cyrl: 'Привет',            // Russian — privet (informal hello)
        arb_Arab: 'مرحبا',             // Arabic — marhaba
        por_Latn: 'Olá',              // Portuguese
        ita_Latn: 'Ciao',             // Italian
        ben_Beng: 'হ্যালো',            // Bengali
        tel_Telu: 'హలో',              // Telugu
        mar_Deva: 'नमस्कार',           // Marathi
        tam_Taml: 'ஹலோ',             // Tamil
        urd_Arab: 'ہیلو',              // Urdu
        mal_Mlym: 'ഹലോ',             // Malayalam
        kan_Knda: 'ಹಲೋ',             // Kannada
        pan_Guru: 'ਹੈਲੋ',             // Punjabi — Gurmukhi script
        vie_Latn: 'Xin chào',         // Vietnamese
    },

    // "hi" — casual version of hello
    'hi': {
        fra_Latn: 'Salut', spa_Latn: 'Hola', deu_Latn: 'Hi',
        hin_Deva: 'हाय', zho_Hans: '嗨', jpn_Jpan: 'やあ',
        kor_Hang: '안녕', rus_Cyrl: 'Привет', arb_Arab: 'أهلاً',
        por_Latn: 'Oi', ita_Latn: 'Ciao', ben_Beng: 'হাই',
        tel_Telu: 'హాయ్', mar_Deva: 'हाय', tam_Taml: 'ஹாய்',
        urd_Arab: 'ہائے', mal_Mlym: 'ഹായ്', kan_Knda: 'ಹಾಯ್',
        pan_Guru: 'ਹਾਏ', vie_Latn: 'Chào',
    },

    // "goodbye" — formal farewell
    'goodbye': {
        fra_Latn: 'Au revoir', spa_Latn: 'Adiós', deu_Latn: 'Auf Wiedersehen',
        hin_Deva: 'अलविदा', zho_Hans: '再见', jpn_Jpan: 'さようなら',
        kor_Hang: '안녕히 가세요', rus_Cyrl: 'До свидания', arb_Arab: 'مع السلامة',
        por_Latn: 'Adeus', ita_Latn: 'Arrivederci', ben_Beng: 'বিদায়',
        tel_Telu: 'వీడ్కోలు', mar_Deva: 'निरोप', tam_Taml: 'விடை',
        urd_Arab: 'خدا حافظ', mal_Mlym: 'വിട', kan_Knda: 'ವಿದಾಯ',
        pan_Guru: 'ਵਿਦਾ', vie_Latn: 'Tạm biệt',
    },

    // "bye" — informal farewell
    'bye': {
        fra_Latn: 'Au revoir', spa_Latn: 'Adiós', deu_Latn: 'Tschüss',
        hin_Deva: 'अलविदा', zho_Hans: '拜拜', jpn_Jpan: 'バイバイ',
        kor_Hang: '잘 가', rus_Cyrl: 'Пока', arb_Arab: 'وداعاً',
        por_Latn: 'Tchau', ita_Latn: 'Ciao', ben_Beng: 'বাই',
        tel_Telu: 'బై', mar_Deva: 'बाय', tam_Taml: 'பை',
        urd_Arab: 'بائے', mal_Mlym: 'ബൈ', kan_Knda: 'ಬೈ',
        pan_Guru: 'ਬਾਏ', vie_Latn: 'Bye',
    },

    // "good morning" — early day greeting
    'good morning': {
        fra_Latn: 'Bonjour', spa_Latn: 'Buenos días', deu_Latn: 'Guten Morgen',
        hin_Deva: 'सुप्रभात', zho_Hans: '早上好', jpn_Jpan: 'おはようございます',
        kor_Hang: '좋은 아침이에요', rus_Cyrl: 'Доброе утро', arb_Arab: 'صباح الخير',
        por_Latn: 'Bom dia', ita_Latn: 'Buongiorno', ben_Beng: 'শুভ সকাল',
        tel_Telu: 'శుభోదయం', mar_Deva: 'सुप्रभात', tam_Taml: 'காலை வணக்கம்',
        urd_Arab: 'صبح بخیر', mal_Mlym: 'സുപ്രഭാതം', kan_Knda: 'ಶುಭೋದಯ',
        pan_Guru: 'ਸ਼ੁਭ ਸਵੇਰ', vie_Latn: 'Chào buổi sáng',
    },

    // "good night" — bedtime farewell
    'good night': {
        fra_Latn: 'Bonne nuit', spa_Latn: 'Buenas noches', deu_Latn: 'Gute Nacht',
        hin_Deva: 'शुभ रात्रि', zho_Hans: '晚安', jpn_Jpan: 'おやすみなさい',
        kor_Hang: '좋은 밤 되세요', rus_Cyrl: 'Спокойной ночи', arb_Arab: 'تصبح على خير',
        por_Latn: 'Boa noite', ita_Latn: 'Buonanotte', ben_Beng: 'শুভ রাত্রি',
        tel_Telu: 'శుభ రాత్రి', mar_Deva: 'शुभ रात्री', tam_Taml: 'இனிய இரவு',
        urd_Arab: 'شب بخیر', mal_Mlym: 'ശുഭ രാത്രി', kan_Knda: 'ಶುಭ ರಾತ್ರಿ',
        pan_Guru: 'ਸ਼ੁਭ ਰਾਤ', vie_Latn: 'Chúc ngủ ngon',
    },

    // ── Courtesy phrases ──────────────────────────────────────────────────────

    'thank you': {
        fra_Latn: 'Merci', spa_Latn: 'Gracias', deu_Latn: 'Danke',
        hin_Deva: 'धन्यवाद', zho_Hans: '谢谢', jpn_Jpan: 'ありがとうございます',
        kor_Hang: '감사합니다', rus_Cyrl: 'Спасибо', arb_Arab: 'شكراً',
        por_Latn: 'Obrigado', ita_Latn: 'Grazie', ben_Beng: 'ধন্যবাদ',
        tel_Telu: 'ధన్యవాదాలు', mar_Deva: 'धन्यवाद', tam_Taml: 'நன்றி',
        urd_Arab: 'شکریہ', mal_Mlym: 'നന്ദി', kan_Knda: 'ಧನ್ಯವಾದ',
        pan_Guru: 'ਧੰਨਵਾਦ', vie_Latn: 'Cảm ơn',
    },

    'thanks': {
        fra_Latn: 'Merci', spa_Latn: 'Gracias', deu_Latn: 'Danke',
        hin_Deva: 'शुक्रिया', zho_Hans: '谢谢', jpn_Jpan: 'ありがとう',
        kor_Hang: '고마워요', rus_Cyrl: 'Спасибо', arb_Arab: 'شكراً',
        por_Latn: 'Obrigado', ita_Latn: 'Grazie', ben_Beng: 'ধন্যবাদ',
        tel_Telu: 'థాంక్స్', mar_Deva: 'आभारी', tam_Taml: 'நன்றி',
        urd_Arab: 'شکریہ', mal_Mlym: 'നന്ദി', kan_Knda: 'ಧನ್ಯವಾದ',
        pan_Guru: 'ਧੰਨਵਾਦ', vie_Latn: 'Cảm ơn',
    },

    'please': {
        fra_Latn: "S'il vous plaît", spa_Latn: 'Por favor', deu_Latn: 'Bitte',
        hin_Deva: 'कृपया', zho_Hans: '请', jpn_Jpan: 'お願いします',
        kor_Hang: '제발', rus_Cyrl: 'Пожалуйста', arb_Arab: 'من فضلك',
        por_Latn: 'Por favor', ita_Latn: 'Per favore', ben_Beng: 'দয়া করে',
        tel_Telu: 'దయచేసి', mar_Deva: 'कृपया', tam_Taml: 'தயவுசெய்து',
        urd_Arab: 'براہ کرم', mal_Mlym: 'ദയവായി', kan_Knda: 'ದಯವಿಟ್ಟು',
        pan_Guru: 'ਕਿਰਪਾ ਕਰਕੇ', vie_Latn: 'Làm ơn',
    },

    'sorry': {
        fra_Latn: 'Désolé', spa_Latn: 'Lo siento', deu_Latn: 'Entschuldigung',
        hin_Deva: 'माफ़ करें', zho_Hans: '对不起', jpn_Jpan: 'すみません',
        kor_Hang: '죄송합니다', rus_Cyrl: 'Извините', arb_Arab: 'آسف',
        por_Latn: 'Desculpe', ita_Latn: 'Scusa', ben_Beng: 'দুঃখিত',
        tel_Telu: 'క్షమించండి', mar_Deva: 'क्षमा करा', tam_Taml: 'மன்னிக்கவும்',
        urd_Arab: 'معاف کریں', mal_Mlym: 'ക്ഷമിക്കൂ', kan_Knda: 'ಕ್ಷಮಿಸಿ',
        pan_Guru: 'ਮਾਫ਼ ਕਰਨਾ', vie_Latn: 'Xin lỗi',
    },

    'yes': {
        fra_Latn: 'Oui', spa_Latn: 'Sí', deu_Latn: 'Ja',
        hin_Deva: 'हाँ', zho_Hans: '是', jpn_Jpan: 'はい',
        kor_Hang: '네', rus_Cyrl: 'Да', arb_Arab: 'نعم',
        por_Latn: 'Sim', ita_Latn: 'Sì', ben_Beng: 'হ্যাঁ',
        tel_Telu: 'అవును', mar_Deva: 'हो', tam_Taml: 'ஆம்',
        urd_Arab: 'ہاں', mal_Mlym: 'അതെ', kan_Knda: 'ಹೌದು',
        pan_Guru: 'ਹਾਂ', vie_Latn: 'Có',
    },

    'no': {
        fra_Latn: 'Non', spa_Latn: 'No', deu_Latn: 'Nein',
        hin_Deva: 'नहीं', zho_Hans: '不', jpn_Jpan: 'いいえ',
        kor_Hang: '아니요', rus_Cyrl: 'Нет', arb_Arab: 'لا',
        por_Latn: 'Não', ita_Latn: 'No', ben_Beng: 'না',
        tel_Telu: 'లేదు', mar_Deva: 'नाही', tam_Taml: 'இல்லை',
        urd_Arab: 'نہیں', mal_Mlym: 'ഇല്ല', kan_Knda: 'ಇಲ್ಲ',
        pan_Guru: 'ਨਹੀਂ', vie_Latn: 'Không',
    },

    'i love you': {
        fra_Latn: "Je t'aime", spa_Latn: 'Te amo', deu_Latn: 'Ich liebe dich',
        hin_Deva: 'मैं तुमसे प्यार करता हूँ', zho_Hans: '我爱你', jpn_Jpan: '愛しています',
        kor_Hang: '사랑해요', rus_Cyrl: 'Я тебя люблю', arb_Arab: 'أنا أحبك',
        por_Latn: 'Eu te amo', ita_Latn: 'Ti amo', ben_Beng: 'আমি তোমাকে ভালোবাসি',
        tel_Telu: 'నేను నిన్ను ప్రేమిస్తున్నాను', mar_Deva: 'मी तुझ्यावर प्रेम करतो',
        tam_Taml: 'நான் உன்னை நேசிக்கிறேன்', urd_Arab: 'میں تم سے محبت کرتا ہوں',
        mal_Mlym: 'ഞാൻ നിന്നെ സ്നേഹിക്കുന്നു', kan_Knda: 'ನಾನು ನಿನ್ನನ್ನು ಪ್ರೀತಿಸುತ್ತೇನೆ',
        pan_Guru: 'ਮੈਂ ਤੁਹਾਨੂੰ ਪਿਆਰ ਕਰਦਾ ਹਾਂ', vie_Latn: 'Tôi yêu bạn',
    },

    'how are you': {
        fra_Latn: 'Comment allez-vous ?', spa_Latn: '¿Cómo estás?', deu_Latn: 'Wie geht es Ihnen?',
        hin_Deva: 'आप कैसे हैं?', zho_Hans: '你好吗?', jpn_Jpan: 'お元気ですか？',
        kor_Hang: '어떻게 지내세요?', rus_Cyrl: 'Как дела?', arb_Arab: 'كيف حالك؟',
        por_Latn: 'Como vai você?', ita_Latn: 'Come stai?', ben_Beng: 'আপনি কেমন আছেন?',
        tel_Telu: 'మీరు ఎలా ఉన్నారు?', mar_Deva: 'तुम्ही कसे आहात?', tam_Taml: 'நீங்கள் எப்படி இருக்கிறீர்கள்?',
        urd_Arab: 'آپ کیسے ہیں؟', mal_Mlym: 'നിങ്ങൾക്ക് എങ്ങനെ ഉണ്ട്?', kan_Knda: 'ನೀವು ಹೇಗಿದ್ದೀರಿ?',
        pan_Guru: 'ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?', vie_Latn: 'Bạn có khỏe không?',
    },

    'what is your name': {
        fra_Latn: 'Comment vous appelez-vous ?', spa_Latn: '¿Cómo te llamas?',
        deu_Latn: 'Wie heißen Sie?', hin_Deva: 'आपका नाम क्या है?',
        zho_Hans: '你叫什么名字?', jpn_Jpan: 'お名前は何ですか？',
        kor_Hang: '이름이 무엇입니까?', rus_Cyrl: 'Как вас зовут?',
        arb_Arab: 'ما اسمك؟', por_Latn: 'Qual é o seu nome?',
        ita_Latn: 'Come ti chiami?', ben_Beng: 'আপনার নাম কী?',
        tel_Telu: 'మీ పేరు ఏమిటి?', mar_Deva: 'तुमचे नाव काय आहे?',
        tam_Taml: 'உங்கள் பெயர் என்ன?', urd_Arab: 'آپ کا نام کیا ہے؟',
        mal_Mlym: 'നിങ്ങളുടെ പേര് എന്താണ്?', kan_Knda: 'ನಿಮ್ಮ ಹೆಸರೇನು?',
        pan_Guru: 'ਤੁਹਾਡਾ ਨਾਮ ਕੀ ਹੈ?', vie_Latn: 'Tên bạn là gì?',
    },

    // "you are welcome" — polite response to "thank you".
    // NLLB was producing "Je vous en prie" which literally means "I beg you" (archaic).
    // Correct modern French is "De rien" (it's nothing).
    'you are welcome': {
        fra_Latn: 'De rien', spa_Latn: 'De nada', deu_Latn: 'Bitte sehr',
        hin_Deva: 'आपका स्वागत है', zho_Hans: '不客气', jpn_Jpan: 'どういたしまして',
        kor_Hang: '천만에요', rus_Cyrl: 'Пожалуйста', arb_Arab: 'على الرحب والسعة',
        por_Latn: 'De nada', ita_Latn: 'Prego', ben_Beng: 'আপনাকে স্বাগতম',
        tel_Telu: 'స్వాగతం', mar_Deva: 'स्वागत आहे', tam_Taml: 'உங்களை வரவேற்கிறோம்',
        urd_Arab: 'خوش آمدید', mal_Mlym: 'സ്വാഗതം', kan_Knda: 'ಸ್ವಾಗತ',
        pan_Guru: 'ਜੀ ਆਇਆਂ ਨੂੰ', vie_Latn: 'Không có gì',
    },
};

// ── Phrasebook lookup function ─────────────────────────────────────────────────
// This is called by worker.ts BEFORE sending text to the NLLB AI model.
// If the phrase is found, we return the correct translation immediately.
// If not found, we return null and the code falls through to the AI model.
export const lookupPhrase = (
    text: string,       // the chunk of text to translate (could be "hello" or a long paragraph)
    src_lang: string,   // NLLB source language code (only applied if 'eng_Latn')
    tgt_lang: string    // NLLB target language code (e.g. 'fra_Latn')
): string | null => {
    // Only apply the phrasebook when translating FROM English.
    // We don't have phrasebooks for other source languages (would need a full multilingual table).
    if (src_lang !== 'eng_Latn') return null;

    // Normalise the input for lookup:
    // .trim() — removes leading/trailing whitespace
    // .toLowerCase() — makes it case-insensitive ("Hello" matches "hello")
    // .replace(/[?.!,]+$/, '') — strips trailing punctuation ("hello!" → "hello")
    // .trim() again — handles "hello !  " → "hello"
    const key = text.trim().toLowerCase().replace(/[?.!,]+$/, '').trim();

    // ?? is the "nullish coalescing operator".
    // PHRASEBOOK[key]?.[tgt_lang] safely accesses the nested object.
    // Returns the translation if found, or null if either key doesn't exist.
    return PHRASEBOOK[key]?.[tgt_lang] ?? null;
};
