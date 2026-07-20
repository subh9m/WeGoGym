import React, { useState, useEffect } from "react";
import { Download, X, Smartphone } from "lucide-react";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone mode (already installed as PWA)
    const checkStandalone = () => {
      const standalone = 
        window.matchMedia("(display-mode: standalone)").matches || 
        window.navigator.standalone === true || 
        document.referrer.includes("android-app://");
      setIsStandalone(standalone);
    };

    checkStandalone();

    // 2. Capture Chrome/Android/Desktop install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsStandalone(true);
    }
    setDeferredPrompt(null);
  };

  // Do not render if installed, standalone, dismissed, or prompt not available
  if (isStandalone || dismissed || !deferredPrompt) {
    return null;
  }

  return (
    <div className="pwa-install-banner">
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Smartphone size={16} color="var(--accent-push)" />
        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>
          Install WeGoGym
        </span>
      </div>

      <button className="pwa-install-btn" onClick={handleInstallClick}>
        <Download size={14} /> Install App
      </button>

      <button 
        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", padding: "4px" }}
        onClick={() => setDismissed(true)}
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
