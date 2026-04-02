import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { getSettings, applySettings } from "./lib/settings";

// Apply persisted settings on load
applySettings(getSettings());

createRoot(document.getElementById("root")!).render(<App />);
