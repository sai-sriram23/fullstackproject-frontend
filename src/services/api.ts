// ─────────────────────────────────────────────────────────────────────────────
// api.ts — All HTTP communication with the Spring Boot backend.
// Uses Axios (a promise-based HTTP library) to make API calls.
// ─────────────────────────────────────────────────────────────────────────────

// Import axios — a popular HTTP library that simplifies fetch requests.
// It automatically handles JSON serialisation and adds useful features
// like interceptors, base URLs, and error handling.
import axios from 'axios';

// Create a reusable Axios instance with a shared base URL and default headers.
// Every function below uses this instance instead of calling axios.get/post directly.
const api = axios.create({
    // import.meta.env.VITE_API_URL reads a .env variable at build time.
    // If it's not set (e.g., in development), falls back to http://localhost:8081.
    // This makes deployment easy — just set VITE_API_URL to your production backend URL.
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081',

    headers: {
        // Tell the backend that we're sending JSON data in the request body.
        // The backend uses @RequestBody to deserialise this JSON into a Java object.
        'Content-Type': 'application/json',
    },
});

// ── Register a new user ───────────────────────────────────────────────────────
// "async" means this function is asynchronous — it returns a Promise.
// "user: any" — the user object has uname, email, psw fields from the form.
export const registerUser = async (user: any) => {
    // Map the form field names to the field names expected by the Spring Boot AppUser model.
    // The form uses "uname" and "psw", but the Java model uses "username" and "password".
    const payload = {
        username: user.uname,   // form field "uname" → JSON field "username"
        email: user.email,      // email passed directly
        password: user.psw      // form field "psw" → JSON field "password"
    };

    // POST /api/auth/register — sends the payload as JSON to the backend.
    // "await" pauses execution here until the HTTP response comes back.
    const response = await api.post('/api/auth/register', payload);

    // response.data is the body of the HTTP response — a string like "Registered successfully".
    return response.data;
};

// ── Log in an existing user ───────────────────────────────────────────────────
export const loginUser = async (user: any) => {
    const payload = {
        username: user.uname, // form field → model field mapping
        password: user.psw
    };

    // POST /api/auth/login — backend checks the username/password and returns
    // "Login successful" or "Invalid credentials".
    const response = await api.post('/api/auth/login', payload);
    return response.data;
};

// ── Save a translation history entry ─────────────────────────────────────────
// "history" contains: { username, type, sourceText, resultText }
export const saveHistory = async (history: any) => {
    // POST /api/history/save — stores the translation in the database.
    const response = await api.post('/api/history/save', history);
    return response.data;
};

// ── Fetch all history for a user ──────────────────────────────────────────────
// "username: string" — TypeScript enforces this must be a string.
export const getHistory = async (username: string) => {
    // Template literal (backticks) — embeds the username variable into the URL.
    // GET /api/history/alice — fetches all history rows for user "alice".
    const response = await api.get(`/api/history/${username}`);
    return response.data; // returns an array of history objects
};

// Export the raw axios instance in case a component needs custom requests.
export default api;
