import React, { useState } from "react";
import { usePlanner } from "../contexts/PlannerContext";
import { useAuth } from "../contexts/AuthContext";

export default function Onboarding() {
  const { completeOnboarding } = usePlanner();
  const { logout } = useAuth();
  const [name, setName] = useState("");
  const [target, setTarget] = useState(100);
  const [dietPref, setDietPref] = useState("veg"); // "veg" or "nonveg"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return setError("Please enter your name.");
    }
    if (target <= 0) {
      return setError("Protein target must be greater than 0.");
    }

    try {
      setError("");
      setLoading(true);
      await completeOnboarding(name, target, dietPref);
    } catch (err) {
      console.error(err);
      setError("Failed to initialize your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: "450px" }}>
        <div className="auth-header">
          <div className="auth-logo">WeGoGym</div>
          <div className="auth-sub">PROFILE SETUP</div>
        </div>

        {error && <div className="auth-error-msg">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {/* Name Input */}
          <div className="auth-input-group">
            <label className="auth-input-label">Your Name</label>
            <div className="premium-input-box">
              <input 
                type="text" 
                className="premium-inner-input" 
                placeholder="e.g. Alex" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Daily Protein Target */}
          <div className="auth-input-group">
            <label className="auth-input-label">Daily Protein Target (g)</label>
            <div className="premium-input-box">
              <input 
                type="number" 
                className="premium-inner-input" 
                value={target}
                onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
                disabled={loading}
                min="10"
                max="500"
                required
              />
              <span className="premium-input-unit">grams</span>
            </div>
          </div>

          {/* Diet Preference Selection */}
          <div className="auth-input-group">
            <label className="auth-input-label">Diet Preference</label>
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                className={`btn-premium-secondary ${dietPref === "veg" ? "active" : ""}`}
                style={{
                  flex: 1,
                  height: "48px",
                  background: dietPref === "veg" ? "var(--text-primary)" : "transparent",
                  color: dietPref === "veg" ? "var(--bg-primary)" : "var(--text-primary)",
                  fontWeight: dietPref === "veg" ? "700" : "400",
                  borderColor: dietPref === "veg" ? "var(--text-primary)" : "var(--border-color)"
                }}
                onClick={() => setDietPref("veg")}
                disabled={loading}
              >
                🥦 Vegetarian
              </button>
              <button
                type="button"
                className={`btn-premium-secondary ${dietPref === "nonveg" ? "active" : ""}`}
                style={{
                  flex: 1,
                  height: "48px",
                  background: dietPref === "nonveg" ? "var(--text-primary)" : "transparent",
                  color: dietPref === "nonveg" ? "var(--bg-primary)" : "var(--text-primary)",
                  fontWeight: dietPref === "nonveg" ? "700" : "400",
                  borderColor: dietPref === "nonveg" ? "var(--text-primary)" : "var(--border-color)"
                }}
                onClick={() => setDietPref("nonveg")}
                disabled={loading}
              >
                🍗 Non-Vegetarian
              </button>
            </div>
            <div 
              className="nothing-label" 
              style={{ fontSize: "0.65rem", textTransform: "none", color: "var(--text-secondary)", marginTop: "6px" }}
            >
              {dietPref === "veg" 
                ? "This hides meat, chicken, eggs, and fish from meal selectors. You can still add custom references manually." 
                : "This exposes all default foods (including poultry/eggs)."}
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-premium-primary glow-white" 
            style={{ width: "100%", marginTop: "15px" }}
            disabled={loading}
          >
            {loading ? "Setting Up..." : "Initialize Planner"}
          </button>

          <div style={{ textAlign: "center", marginTop: "14px" }}>
            <span 
              className="auth-toggle-link" 
              style={{ fontSize: "0.8rem", color: "var(--text-muted)", textDecoration: "none", cursor: "pointer" }} 
              onClick={() => logout()}
            >
              ← Back to Main Login / Sign Out
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
