import React, { useState, useEffect } from "react";
import { usePlanner } from "../contexts/PlannerContext";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, LogOut, ShieldCheck, Check } from "lucide-react";

export default function Settings() {
  const { profile, updateProfileSettings } = usePlanner();
  const { logout, currentUser } = useAuth();
  
  const [name, setName] = useState("");
  const [proteinTarget, setProteinTarget] = useState(100);
  const [dietPreference, setDietPreference] = useState("veg");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setProteinTarget(profile.proteinTarget || 100);
      setDietPreference(profile.dietPreference || "veg");
    }
  }, [profile]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!name.trim() || proteinTarget <= 0) return;

    setLoading(true);
    setSaveSuccess(false);
    try {
      await updateProfileSettings(name, proteinTarget, dietPreference);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isAnonymous = currentUser?.isAnonymous;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.25 }}
      style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "600px", margin: "0 auto", width: "100%" }}
    >
      {/* Profile configurations card */}
      <div className="nothing-card glow-white">
        <div className="nothing-card-header">
          <span className="nothing-title">
            <SettingsIcon size={18} /> Profile Configuration
          </span>
          <span className="nothing-label">Account Preferences</span>
        </div>

        {saveSuccess && (
          <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid var(--accent-success)", color: "var(--accent-success)", padding: "12px 16px", borderRadius: "10px", fontSize: "0.85rem", marginBottom: "16px", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
            <Check size={16} /> Profile settings saved successfully.
          </div>
        )}

        <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* User Name input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="nothing-label" style={{ fontSize: "0.65rem" }}>USER NAME</label>
            <div className="premium-input-box">
              <input
                type="text"
                className="premium-inner-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Daily Protein Target input */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="nothing-label" style={{ fontSize: "0.65rem" }}>DAILY PROTEIN TARGET</label>
            <div className="premium-input-box">
              <input
                type="number"
                className="premium-inner-input"
                value={proteinTarget}
                onChange={(e) => setProteinTarget(parseInt(e.target.value) || 0)}
                disabled={loading}
                required
              />
              <span className="premium-input-unit">grams</span>
            </div>
          </div>

          {/* Diet Preference toggles */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label className="nothing-label" style={{ fontSize: "0.65rem" }}>DIET PREFERENCE</label>
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                className="btn-premium-secondary"
                style={{
                  flex: 1,
                  height: "44px",
                  background: dietPreference === "veg" ? "var(--text-primary)" : "transparent",
                  color: dietPreference === "veg" ? "var(--bg-primary)" : "var(--text-primary)",
                  borderColor: dietPreference === "veg" ? "var(--text-primary)" : "var(--border-color)"
                }}
                onClick={() => setDietPreference("veg")}
                disabled={loading}
              >
                🥦 Vegetarian
              </button>
              <button
                type="button"
                className="btn-premium-secondary"
                style={{
                  flex: 1,
                  height: "44px",
                  background: dietPreference === "nonveg" ? "var(--text-primary)" : "transparent",
                  color: dietPreference === "nonveg" ? "var(--bg-primary)" : "var(--text-primary)",
                  borderColor: dietPreference === "nonveg" ? "var(--text-primary)" : "var(--border-color)"
                }}
                onClick={() => setDietPreference("nonveg")}
                disabled={loading}
              >
                🍗 Non-Vegetarian
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-premium-primary" 
            style={{ width: "100%", marginTop: "10px" }}
            disabled={loading}
          >
            {loading ? "Saving Changes..." : "Save Settings"}
          </button>
        </form>
      </div>

      {/* Account Security & Sign Out */}
      <div className="nothing-card glow-white">
        <div className="nothing-card-header">
          <span className="nothing-title">
            <ShieldCheck size={18} color="var(--accent-success)" /> Security & Session
          </span>
          <span className="nothing-label">Firebase Auth info</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ padding: "12px 14px", background: "var(--bg-secondary)", borderRadius: "10px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "600" }}>Authentication Type</span>
            <span style={{ fontWeight: "700", fontSize: "0.85rem", textTransform: "capitalize" }}>{isAnonymous ? "Guest Session" : "Email & Password"}</span>
          </div>

          <div style={{ padding: "12px 14px", background: "var(--bg-secondary)", borderRadius: "10px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "600" }}>Account Email</span>
            <span style={{ fontWeight: "700", fontSize: "0.85rem", fontFamily: "var(--font-mono)" }}>{currentUser?.email || "Guest User"}</span>
          </div>

          <button 
            className="btn-premium-danger"
            style={{ width: "100%", marginTop: "6px" }}
            onClick={() => logout()}
          >
            <LogOut size={18} /> Sign Out of Account
          </button>
        </div>
      </div>
    </motion.div>
  );
}
