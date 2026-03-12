// ─────────────────────────────────────────────────────────────────────────────
// imagePreprocessing.ts — Image enhancement utilities for better OCR accuracy.
// OCR (Optical Character Recognition) works best on high-contrast black-on-white
// images. These functions use the HTML Canvas API to preprocess images before
// sending them to Tesseract.js.
// ─────────────────────────────────────────────────────────────────────────────

// ── Image Preprocessor ────────────────────────────────────────────────────────
// Takes an image URL (data URL or object URL) and returns a processed data URL.
// Returns a Promise because image loading is asynchronous.
export const preprocessImageForOCR = (imageSrc: string): Promise<string> => {
    // A Promise wraps async work. The executor function runs immediately.
    // resolve(value) = success path. reject(error) = failure path.
    return new Promise((resolve) => {
        // Create an in-memory Image element (like <img> in the DOM, but invisible).
        const img = new Image();

        // Allow loading images from other origins (CORS).
        // Without this, canvas.getImageData() would throw a security error
        // when the image came from a different URL.
        img.crossOrigin = 'Anonymous';

        // This callback fires when the image has fully loaded into memory.
        img.onload = () => {
            // Create an in-memory Canvas element — a drawing surface.
            const canvas = document.createElement('canvas');

            // Scale factor: 2x. Doubling the image size improves OCR on small/low-res images
            // because Tesseract has more pixels per character to analyse.
            const scale = 2;
            canvas.width = img.width * scale;  // e.g. 800px → 1600px
            canvas.height = img.height * scale;  // e.g. 600px → 1200px

            // Get the 2D drawing context — provides drawing methods.
            // Returns null if the browser can't create a 2D context (very rare).
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(imageSrc); // fallback: return original image unchanged
                return;
            }

            // Draw the original image onto the larger canvas (scales it up).
            // drawImage(image, x, y, width, height)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // getImageData() returns every pixel as RGBA values in a flat Uint8ClampedArray.
            // Format: [R, G, B, A, R, G, B, A, ...] for each pixel left-to-right, top-to-bottom.
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data; // reference to the pixel byte array

            // ── Step 1: Detect background brightness ──────────────────────────
            // Sample every 40th pixel to quickly estimate if the image has a dark background.
            // i += 40 skips through the array (each pixel = 4 bytes: R,G,B,A).
            let r_sum = 0, g_sum = 0, b_sum = 0;
            let sampleCount = 0;

            for (let i = 0; i < data.length; i += 40) {
                r_sum += data[i];       // Red channel of this pixel
                g_sum += data[i + 1];  // Green channel
                b_sum += data[i + 2];  // Blue channel
                sampleCount++;
            }

            // Average brightness across all sampled pixels (0 = black, 255 = white).
            const avgBrightness = (r_sum + g_sum + b_sum) / (3 * sampleCount);

            // If average brightness < 100, the image has a dark background (like a dark diagram).
            // Tesseract works much better on dark text on white background,
            // so we'll invert dark-background images later.
            const isDarkBackground = avgBrightness < 100;

            // ── Step 2: Increase contrast ─────────────────────────────────────
            // This formula sharpens the difference between light and dark areas,
            // making text stand out more clearly for OCR.
            const contrast = 75; // contrast enhancement level (0–255)
            const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

            // ── Step 3: Process every pixel ───────────────────────────────────
            for (let i = 0; i < data.length; i += 4) {
                // Read the original RGB values for this pixel.
                const r = data[i];       // Red
                const g = data[i + 1];  // Green
                const b = data[i + 2];  // Blue
                // data[i + 3] is Alpha (transparency) — we leave it unchanged.

                // Convert RGB to grayscale using the human eye's luminance weights.
                // The human eye is most sensitive to green (0.587), then red (0.299), then blue (0.114).
                let gray = 0.299 * r + 0.587 * g + 0.114 * b;

                // Apply contrast: pulls values away from the midpoint (128), making
                // bright areas brighter and dark areas darker.
                gray = contrastFactor * (gray - 128) + 128;

                // If the background is dark (like a NEURA flowchart), invert the image.
                // White text on dark bg → black text on white bg (what Tesseract expects).
                if (isDarkBackground) {
                    gray = 255 - gray; // invert: 0 becomes 255, 255 becomes 0
                }

                // Clamp the value to the valid range [0, 255].
                // Math.max(0, ...) prevents negative values; Math.min(255, ...) prevents overflow.
                gray = Math.max(0, Math.min(255, gray));

                // Thresholding: push light pixels to pure white and dark pixels to pure black.
                // This "binarises" the image for cleaner OCR.
                if (gray > 200) gray = 255; // near-white → pure white
                else if (gray < 55) gray = 0; // near-black → pure black

                // Write the grayscale value to all three channels (R, G, B).
                // Setting R=G=B makes the pixel gray (equal amounts of all colours).
                data[i] = gray; // Red
                data[i + 1] = gray; // Green
                data[i + 2] = gray; // Blue
                // Alpha (data[i+3]) is left unchanged.
            }

            // Write the modified pixel data back to the canvas.
            ctx.putImageData(imageData, 0, 0);

            // Export the canvas as a PNG data URL (a base64-encoded image string).
            // This can be passed directly to Tesseract.recognize().
            resolve(canvas.toDataURL('image/png'));
        };

        // This callback fires if the image fails to load (e.g. broken URL).
        img.onerror = (err) => {
            console.error('Error preprocessing image', err);
            resolve(imageSrc); // fallback: return original image — OCR will still try
        };

        // Setting img.src starts the loading process — triggers onload or onerror above.
        img.src = imageSrc;
    });
};

// ─────────────────────────────────────────────────────────────────────────────
// Phrasebook for 2-char whitelist — only these 2-character words are kept.
// All others are filtered as likely OCR noise (e.g., 'py', 'IY', 'NS').
// ─────────────────────────────────────────────────────────────────────────────
const KEEP_2CHAR = new Set([
    // Common English articles, prepositions, conjunctions, pronouns
    'a', 'i', 'is', 'in', 'on', 'to', 'of', 'as', 'at', 'by', 'be',
    'do', 'he', 'it', 'we', 'go', 'me', 'no', 'ok', 'up', 'or', 'if',
    'an', 'so', 'my', 'us', 'am',
    // Common tech abbreviations
    'ai', 'h2', 'db', 'ui', 'id', 'ip', 'js', 'ts', 'hi', 'vs',
]);

// Set of vowel characters for the no-vowel filter below.
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

// ── OCR Text Cleaner ──────────────────────────────────────────────────────────
// Removes diagram artifacts, random symbols, and short OCR noise words
// that Tesseract misreads from arrows, borders, and flowchart connectors.
export const cleanOCRText = (text: string): string => {
    if (!text) return ''; // handle empty input immediately

    // Step 1: Replace common diagram symbols with spaces.
    // These characters appear in flowcharts as borders, arrows, operators — not real text.
    // The regex character class [...] matches any single character in the set.
    let cleaned = text.replace(/[|~\\=_[\]{}<>\/|+*^$#@`©®™■►▼◄▲◆●★;:,]/g, ' ');

    // Step 2: Remove dashes that represent flowchart connections/arrows.
    // \s[-—–]+\s = whitespace + one or more dashes + whitespace (e.g. " -- " or " — ")
    cleaned = cleaned.replace(/\s[-—–]+\s/g, ' ');
    // [-—–]{2,} = two or more consecutive dashes (e.g. "-----")
    cleaned = cleaned.replace(/[-—–]{2,}/g, ' ');

    // Step 3: Split into individual words and filter each one.
    return cleaned
        .split(/\s+/)   // split on any whitespace (spaces, tabs, newlines)
        .filter(word => {
            if (!word) return false; // skip empty strings from split

            // Always keep the ampersand — used in labels like "SYNC & PERSISTENCE"
            if (word === '&') return true;

            // Discard tokens with no alphanumeric characters (pure punctuation leftovers)
            if (!/[a-zA-Z0-9]/.test(word)) return false;

            // Remove all non-alphanumeric characters for length/quality analysis.
            const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '');
            if (!cleanWord) return false;

            const lower = cleanWord.toLowerCase();
            const len = cleanWord.length;

            // ── Single character: only keep a, A, i, I, or digits ─────────────
            // Single letters like 'l', 'V', 't' are common OCR misreads of lines.
            if (len === 1) return /^[aAiI0-9]$/.test(cleanWord);

            // ── 2-character words: strict whitelist ───────────────────────────
            // Only allow known 2-letter words (articles, tech abbreviations).
            // Filters out 'IY', 'NS', 'py', 'YY' etc.
            if (len === 2) return KEEP_2CHAR.has(lower);

            // ── Pure digit strings of 3+ digits are noise ─────────────────────
            // e.g. "777", "123" — page numbers or decorative elements in diagrams.
            if (/^\d{3,}$/.test(cleanWord)) return false;

            // ── 3-4 char words with NO vowels are noise ───────────────────────
            // Real words almost always contain at least one vowel.
            // This catches things like 'NST', 'BYY', 'XZW' from arrow artifacts.
            if (len <= 4) {
                const vowelCount = [...lower].filter(c => VOWELS.has(c)).length;
                if (vowelCount === 0) return false;
            }

            // If none of the filters triggered, the word is probably real text.
            return true;
        })
        .join(' ')  // reassemble the filtered words into a single string
        .trim();     // remove leading/trailing whitespace
};
