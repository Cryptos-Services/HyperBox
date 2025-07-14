import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./contexts/ThemeContext"; // ✅ AJOUTER
import { ToastProvider } from "./contexts/ToastContext";
import "./index.css";

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(
    <ToastProvider>
      <ThemeProvider>
        {" "}
        {/* ✅ WRAPPER ICI */}
        <App />
      </ThemeProvider>
    </ToastProvider>
  );
}
