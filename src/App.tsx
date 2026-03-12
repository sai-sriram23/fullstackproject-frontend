// ─────────────────────────────────────────────────────────────────────────────
// App.tsx — Root component: defines the URL routes for the entire application.
// Every page/screen maps to a URL path like /translator, /ocr, etc.
// ─────────────────────────────────────────────────────────────────────────────

// React is required whenever we write JSX (<tags>).
// Even though we don't call React.something directly, the JSX compiler needs it.
import React from 'react';

// BrowserRouter  — wraps the whole app and enables client-side routing (no page reload).
// Routes         — a container that holds all Route definitions and picks the one that matches.
// Route          — maps one URL path to one React component.
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import each page component. Each one is a self-contained screen of the app.
import Home from './components/Home';                       // Landing page "/"
import Layout from './components/Layout';                   // Shared navbar/footer wrapper
import Auth from './components/Auth';                       // Login + Register form
import Translator from './components/UnifiedTranslator';    // All 4 translation modes
import OCR from './components/OCR';                         // Extract text from images
import Voice from './components/Voice';                     // Voice dictation + translation
import Models from './components/ModelManager';             // View/clear cached AI models
import CameraTranslator from './components/CameraTranslator'; // Live camera OCR + translate
import Dashboard from './components/Dashboard';             // Profile + history + cache info

// React.FC means "React Functional Component" — a TypeScript type that
// tells us this function returns JSX and is a valid React component.
const App: React.FC = () => {
  return (
    // BrowserRouter gives all child components access to the URL and navigation actions.
    // It uses the HTML5 History API to update the URL without page reloads.
    <BrowserRouter>
      {/* Routes looks at the current URL and renders the first matching Route */}
      <Routes>
        {/* The Layout route wraps all pages — it renders the navbar and footer.
            The <Outlet /> inside Layout is where the child pages get rendered. */}
        <Route path="/" element={<Layout />}>

          {/* "index" means this renders when the path is exactly "/" */}
          <Route index element={<Home />} />

          {/* Each Route maps a URL path to a page component */}
          <Route path="login" element={<Auth />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="translator" element={<Translator />} />
          <Route path="ocr" element={<OCR />} />
          <Route path="camera" element={<CameraTranslator />} />
          <Route path="voice" element={<Voice />} />
          <Route path="models" element={<Models />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
};

// Export the App component so main.tsx can import and render it.
export default App;
