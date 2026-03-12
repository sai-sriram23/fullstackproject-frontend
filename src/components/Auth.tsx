// ─────────────────────────────────────────────────────────────────────────────
// Auth.tsx — Login and Registration form.
// A single component that handles both modes: Login and Register.
// The user toggles between them with a button at the bottom of the form.
// ─────────────────────────────────────────────────────────────────────────────

// useState — for storing form field values and state flags.
import React, { useState } from 'react';

// loginUser    — makes a POST /api/auth/login request to the backend.
// registerUser — makes a POST /api/auth/register request to the backend.
import { loginUser, registerUser } from '../services/api';

// useNavigate — returns a function to programmatically redirect the user.
import { useNavigate } from 'react-router-dom';

const Auth: React.FC = () => {
    // ── Form State ────────────────────────────────────────────────────────────

    // isLogin — true = Login mode, false = Register mode.
    // Toggling this swaps the UI between the two forms.
    const [isLogin, setIsLogin] = useState(true);

    // uname — the value in the "Username" input field.
    const [uname, setUname] = useState('');

    // psw — the value in the "Password" input field (not shown to user as text).
    const [psw, setPsw] = useState('');

    // email — only used in Register mode. Hidden in Login mode.
    const [email, setEmail] = useState('');

    // message — displays feedback to the user after a successful/failed request.
    // e.g. "Login successful" or "Error: ..."
    const [message, setMessage] = useState('');

    // navigate — function to redirect the user to a different route.
    const navigate = useNavigate();

    // ── Form Submit Handler ───────────────────────────────────────────────────
    // "async" means this function uses await (asynchronous operations).
    // React.FormEvent is the TypeScript type for form submission events.
    const handleSubmit = async (e: React.FormEvent) => {
        // e.preventDefault() stops the default browser behaviour (page reload on form submit).
        // Without this, the URL would change and the app would reload.
        e.preventDefault();

        try {
            if (isLogin) {
                // ── LOGIN path ────────────────────────────────────────────────
                // Call the Spring Boot backend with username and password.
                // "await" pauses here until the HTTP response comes back.
                const res = await loginUser({ uname, psw });

                // "res" is the raw string response from the backend:
                // "Login successful" or "Invalid credentials".
                setMessage(res);

                if (res === 'Login successful') {
                    // Persist the username so other pages know who is logged in.
                    // localStorage stores data between page refreshes (permanently until cleared).
                    localStorage.setItem('username', uname);

                    // Redirect to the translator page after successful login.
                    navigate('/translator');
                }
            } else {
                // ── REGISTER path ─────────────────────────────────────────────
                // Send username, password, AND email to create a new account.
                const res = await registerUser({ uname, psw, email });

                if (res === 'Registered successfully') {
                    // Auto-login after registration: save username to localStorage.
                    localStorage.setItem('username', uname);
                }

                // Show the backend response message to the user.
                setMessage(res);
            }
        } catch (error) {
            // The catch block handles network errors or unexpected server errors.
            // This fires if the backend is down or returns a 5xx status code.
            setMessage('Error: ' + error);
        }
    };

    return (
        // Centering the form vertically and horizontally.
        // min-h-[70vh] = at least 70% of the viewport height.
        // animate-in fade-in zoom-in = entrance animation on mount.
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 animate-in fade-in zoom-in duration-500">

            {/* Form card — glassmorphism (backdrop-blur + semi-transparent background) */}
            <div className="p-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md">

                {/* ── Header — changes between Login and Register ── */}
                <div className="text-center mb-10">
                    {/* Ternary operator: condition ? valueIfTrue : valueIfFalse */}
                    <h2 className="text-3xl font-black mb-2 tracking-tight">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                        {isLogin ? 'Enter your credentials to continue' : 'Sign up to access AI features'}
                    </p>
                </div>

                {/* ── Form fields ── */}
                {/* onSubmit={handleSubmit} runs our function when the user submits the form */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Username field — always visible */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 ml-1">Username</label>
                        <input
                            type="text"
                            placeholder="sai_deep"
                            value={uname}          // controlled input: value is driven by state
                            // onChange fires on every keystroke.
                            // e.target.value is the current text in the input box.
                            // setUname updates the state, which re-renders the input with the new value.
                            onChange={(e) => setUname(e.target.value)}
                            className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            required  // browser built-in validation: won't submit if empty
                        />
                    </div>

                    {/* Email field — ONLY shown in Register mode (!isLogin) */}
                    {/* && short-circuit: if !isLogin is false, nothing is rendered */}
                    {!isLogin && (
                        // animate-in slide-in-from-top-2 = slides down when it appears
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <label className="block text-sm font-semibold mb-2 ml-1">Email Address</label>
                            <input
                                type="email"   // browser validates it's a valid email format
                                placeholder="sai@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                required
                            />
                        </div>
                    )}

                    {/* Password field */}
                    <div>
                        <label className="block text-sm font-semibold mb-2 ml-1">Password</label>
                        <input
                            type="password"  // hides the text as dots/asterisks
                            placeholder="••••••••"
                            value={psw}
                            onChange={(e) => setPsw(e.target.value)}
                            className="w-full p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl border-none focus:ring-2 focus:ring-blue-500 transition-all"
                            required
                        />
                    </div>

                    {/* Submit button — label changes based on mode */}
                    <button
                        type="submit"   // triggers the form's onSubmit handler
                        className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-all active:scale-[0.98]"
                    >
                        {isLogin ? 'Sign In' : 'Sign Up'}
                    </button>
                </form>

                {/* ── Feedback message ── */}
                {/* Only renders if message is a non-empty string */}
                {message && (
                    <div className={`mt-6 p-4 rounded-xl text-sm font-medium text-center
                        // Dynamic class: green background for success, red for errors.
                        // message.includes('success') checks if the word "success" is in the message.
                        ${message.includes('success') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {message}
                    </div>
                )}

                {/* ── Toggle between Login / Register ── */}
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        {/* Clicking this flips isLogin (true → false or false → true) */}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-blue-500 font-bold hover:underline"
                        >
                            {isLogin ? 'Register' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;
