import React, { useState, useEffect } from "react";
import { usePlanner } from "../contexts/PlannerContext";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, LogOut, ShieldAlert, ShieldCheck } from "lucide-react";

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
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "600px", margin: "0 auto" }}
    >
      {/* Profile configurations card */}
      <div className="nothing-card glow-white">
        <div className="nothing-card-header">
          <span className="nothing-title" style={{ gap: "8px" }}>
            <SettingsIcon size={18} /> Profile Configuration
          </span>
          <span className="nothing-label">Edit profile details</span>
        </div>

        {saveSuccess && (
          <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid var(--accent-success)", color: "var(--accent-success)", padding: "12px 16px", borderRadius: "10px", fontSize: "0.85rem", marginBottom: "16px", fontWeight: "600" }}>
            ✓ Profile settings saved successfully.
          </div>
        )}

        <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* User Name input */}
          <div className="ref-form-group">
            <label className="nothing-label" style={{ fontSize: "0.65rem" }}>User Name</label>
            <input
              type="text"
              className="nothing-input"
              style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)", height: "48px", borderRadius: "12px", padding: "0 16px", fontSize: "0.95rem" }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Daily Protein Target input */}
          <div className="ref-form-group">
            <label className="nothing-label" style={{ fontSize: "0.65rem" }}>Daily Protein Target (g)</label>
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

          {/* Diet category toggler */}
          <div className="ref-form-group">
            <label className="nothing-label" style={{ fontSize: "0.65rem" }}>Diet Preference</label>
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                className={`btn-premium-secondary ${dietPreference === "veg" ? "active" : ""}`}
                style={{
                  flex: 1,
                  height: "48px",
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
                className={`btn-premium-secondary ${dietPreference === "nonveg" ? "active" : ""}`}
                style={{
                  flex: 1,
                  height: "48px",
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

      {/* Account Info Details */}
      <div className="nothing-card glow-white">
        <div className="nothing-card-header">
          <span className="nothing-title">Security & Account</span>
          <span className="nothing-label">Firebase Auth info</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.85rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Account Type:</span>
            {isAnonymous ? (
              <span style={{ color: "var(--accent-orange)", display: "flex", alignItems: "center", gap: "4px" }}>
                <ShieldAlert size={14} /> Guest (Anonymous)
              </span>
            ) : (
              <span style={{ color: "var(--accent-success)", display: "flex", alignItems: "center", gap: "4px" }}>
                <ShieldCheck size={14} /> Registered
              </span>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Email Address:</span>
            <span style={{ color: "var(--text-primary)" }}>
              {currentUser?.email || "No Email linked"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
            <span>Account ID:</span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", wordBreak: "break-all" }}>
              {currentUser?.uid}
            </span>
          </div>
        </div>

        <div style={{ borderTop: "1px solid var(--border-color)", marginTop: "16px", paddingTop: "16px" }}>
          <button 
            className="btn-premium-danger" 
            style={{ width: "100%" }}
            onClick={logout}
          >
            <LogOut size={16} /> Sign Out of Account
          </button>
        </div>
      </div>
    </motion.div>
  );
}

