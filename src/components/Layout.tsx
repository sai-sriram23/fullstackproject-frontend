// ─────────────────────────────────────────────────────────────────────────────
// Layout.tsx — Shared wrapper that surrounds every page.
// It renders the navigation bar, dark-mode toggle, user session display,
// and a footer. The actual page content is rendered via <Outlet />.
// ─────────────────────────────────────────────────────────────────────────────

// React    — needed for JSX syntax.
// useState — lets us store and update component-level data (dark mode on/off, username).
// useEffect— lets us run code after the component mounts or when a dependency changes.
import React, { useState, useEffect } from 'react';

// Link        — like <a href="..."> but without page reload (SPA navigation).
// Outlet      — a placeholder that renders the currently matched child route's component.
// useLocation — returns the current URL object, so we know which nav item to highlight.
// useNavigate — lets us programmatically change the URL (e.g., redirect after logout).
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const Layout: React.FC = () => {
    // ── State ─────────────────────────────────────────────────────────────────

    // isDark — whether dark mode is currently active. Starts as true (dark by default).
    const [isDark, setIsDark] = useState(true);

    // username — read from localStorage on mount.
    // localStorage persists across page refreshes (unlike useState which resets).
    // If the user isn't logged in, this is null.
    // The generic <string | null> tells TypeScript "this can be a string or null".
    const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));

    // useLocation returns an object like { pathname: '/translator', search: '', hash: '' }.
    // We use location.pathname to highlight the active nav link.
    const location = useLocation();

    // useNavigate returns a function we can call to change the URL without a reload.
    const navigate = useNavigate();

    // ── Dark Mode Effect ──────────────────────────────────────────────────────
    useEffect(() => {
        // Whenever isDark changes, add or remove the 'dark' class on <html>.
        // Tailwind's @custom-variant dark directive (in index.css) makes all
        // dark:* classes respond to this class on the html element.
        if (isDark) {
            document.documentElement.classList.add('dark');    // activates dark mode
        } else {
            document.documentElement.classList.remove('dark'); // reverts to light mode
        }
    }, [isDark]); // [isDark] = dependency array: this runs every time isDark changes.

    // ── Cross-tab Login Sync ──────────────────────────────────────────────────
    useEffect(() => {
        // This function re-reads the username from localStorage when it changes
        // in ANOTHER browser tab (e.g., user logs in on a different tab).
        const handleStorageChange = () => {
            setUsername(localStorage.getItem('username'));
        };

        // 'storage' event fires when localStorage changes in a different tab.
        window.addEventListener('storage', handleStorageChange);

        // Cleanup: remove the listener when this component unmounts.
        // This prevents memory leaks (lingering event listeners on a removed component).
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []); // [] = empty dependency array means "run once when component mounts"

    // ── Logout ────────────────────────────────────────────────────────────────
    const handleLogout = () => {
        localStorage.removeItem('username'); // delete the stored username
        setUsername(null);                   // clear the React state (re-renders the UI)
        navigate('/login');                  // redirect to the login page
    };

    // ── Navigation Items ──────────────────────────────────────────────────────
    // Each object defines a nav link: its URL path, display label, and emoji icon.
    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
        { path: '/camera', label: 'Camera', icon: '📸' },
        { path: '/translator', label: 'Translator', icon: '🌐' },
        { path: '/ocr', label: 'OCR', icon: '📄' },
        { path: '/voice', label: 'Voice', icon: '🎙️' },
        { path: '/models', label: 'Models', icon: '💾' },
    ];

    return (
        // Root div: full viewport height, theme-aware background and text colour.
        // transition-colors = smooth colour transition when toggling dark/light.
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#080c14] text-slate-900 dark:text-slate-100 transition-colors duration-500 font-sans selection:bg-blue-500/30">

            {/* ── Navigation Bar ───────────────────────────────────────────── */}
            {/* sticky top-0 = stays at the top when the user scrolls.
                z-50 = higher stacking order than page content (appears on top).
                backdrop-blur-2xl = frosted-glass effect (blurs content behind it). */}
            <nav className="sticky top-0 z-50 p-4 border-b border-slate-200 dark:border-white/5 bg-white/70 dark:bg-[#080c14]/70 backdrop-blur-2xl">
                <div className="container mx-auto flex justify-between items-center">

                    {/* Logo — clicking it always goes back to the Home page */}
                    {/* bg-clip-text text-transparent = gradient text effect */}
                    <Link to="/" className="text-3xl font-black tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent transform hover:scale-105 transition-all">
                        NEURA
                    </Link>

                    {/* Nav links — hidden on small screens (hidden lg:flex) */}
                    <div className="hidden lg:flex items-center space-x-2">
                        {/* .map() iterates the navItems array and renders a Link for each */}
                        {navItems.map((item) => (
                            <Link
                                key={item.path}  // key is required by React when rendering lists
                                to={item.path}   // destination URL
                                // Conditional styling: active link gets blue bg + shadow.
                                // location.pathname === item.path checks if this is the current page.
                                className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 ${location.pathname === item.path
                                    ? 'bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.3)]'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                                    }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right side: dark mode toggle + user info */}
                    <div className="flex items-center gap-3">
                        {/* Dark/Light toggle button.
                            !isDark inverts the current value (true → false, false → true). */}
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="p-3 rounded-2xl bg-slate-100 dark:bg-white/5 hover:scale-110 active:scale-95 transition-all"
                        >
                            {/* Show sun when in dark mode (click to go light), moon when in light mode */}
                            {isDark ? '☀️' : '🌙'}
                        </button>

                        {/* Conditional rendering: show user info if logged in, login button if not */}
                        {username ? (
                            // ── Logged in: show avatar + username + logout ──
                            <div className="flex items-center gap-4 bg-slate-100 dark:bg-white/5 p-1 pr-4 rounded-2xl border border-transparent dark:border-white/5">

                                {/* Avatar circle: shows the first letter of username, uppercase */}
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black">
                                    {username.charAt(0).toUpperCase()}
                                </div>

                                {/* Username display — hidden on small screens (hidden sm:block) */}
                                <div className="hidden sm:block">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 -mb-1">Member</p>
                                    <p className="text-sm font-black">{username}</p>
                                </div>

                                {/* Logout button */}
                                <button
                                    onClick={handleLogout}
                                    className="ml-2 p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                                    title="Logout"
                                >
                                    🚪
                                </button>
                            </div>
                        ) : (
                            // ── Not logged in: show "Access Console" link ──
                            <Link
                                to="/login"
                                className="px-8 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm hover:translate-y-[-2px] hover:shadow-xl transition-all active:translate-y-0"
                            >
                                Access Console
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* ── Main Content Area ──────────────────────────────────────────── */}
            {/* <Outlet /> is where React Router injects the current page component.
                For example, when the URL is /translator, this renders <UnifiedTranslator />.
                animate-in fade-in = Tailwind animation: fades in + slides up on route change. */}
            <main className="container mx-auto py-12 px-4 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <Outlet />
            </main>

            {/* ── Footer ──────────────────────────────────────────────────────── */}
            <footer className="py-12 border-t border-slate-200 dark:border-white/5 text-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.4em]">NEURA AGI INTERFACE v1.0 • ONSITE EXECUTION ENGINE</p>
            </footer>
        </div>
    );
};

// Export so App.tsx can import and use this component as a route wrapper.
export default Layout;
