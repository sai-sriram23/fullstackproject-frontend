// ─────────────────────────────────────────────────────────────────────────────
// main.tsx — Entry point of the entire React application
// This is the very first file that runs when the browser loads the app.
// ─────────────────────────────────────────────────────────────────────────────

// Import StrictMode from React.
// StrictMode is a developer tool that helps detect potential problems in the app.
// It intentionally renders components twice (in development only) to catch side effects.
import { StrictMode } from 'react'

// Import createRoot from react-dom/client.
// createRoot is the modern React 18+ way to mount a React app into the DOM.
// It replaces the older ReactDOM.render() method.
import { createRoot } from 'react-dom/client'

// Import the global CSS file that applies styles to the entire app.
// This file includes Tailwind CSS and the custom dark mode variant.
import './index.css'

// Import the root App component — this is the top-level component
// that contains all routes, layout, and pages of the application.
import App from './App.tsx'

// document.getElementById('root') finds the <div id="root"> element in index.html.
// The ! (non-null assertion) tells TypeScript "this element definitely exists, don't warn me."
// createRoot() initialises React's rendering engine on that DOM node.
createRoot(document.getElementById('root')!).render(
  // StrictMode wraps the entire app — it only affects development behaviour,
  // not the production build. It activates additional warnings in the console.
  <StrictMode>
    {/* Render the App component, which contains all routes and pages */}
    <App />
  </StrictMode>,
)
