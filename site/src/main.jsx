import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    const swUrl = new URL("sw.js", window.location.href);

    navigator.serviceWorker.register(swUrl).then((registration) => {
      const warmCache = () => {
        const urls = [
          window.location.href,
          ...Array.from(document.querySelectorAll("script[src], link[href], img[src]"))
            .map((node) => node.src || node.href)
            .filter(Boolean),
        ];

        registration.active?.postMessage({ type: "WARM_CACHE", urls });
      };

      if (registration.active) warmCache();
      navigator.serviceWorker.ready.then(warmCache).catch(() => {});
    }).catch(() => {});
  });
}
