import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePlanner } from "../contexts/PlannerContext";
import { motion } from "framer-motion";
import { 
  User, 
  Target, 
  Moon, 
  Sun, 
  LogOut, 
  Check, 
  ShieldCheck, 
  Sliders, 
  Sparkles,
  Flame,
  Award
} from "lucide-react";

export default function Profile({ theme, setTheme }) {
  const { currentUser, logout } = useAuth();
  const { profile, updateProfile, prs, history } = usePlanner();

  const [nameInput, setNameInput] = useState(profile?.name || "Athlete");
  const [proteinInput, setProteinInput] = useState(profile?.proteinTarget || 100);
  const [dietPref, setDietPref] = useState(profile?.dietPreference || "nonveg");
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateProfile({
      name: nameInput,
      proteinTarget: Number(proteinInput),
      dietPreference: dietPref
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const userName = profile?.name || "Athlete";
  const avatarLetter = userName.charAt(0).toUpperCase();
  const prCount = Object.keys(prs || {}).length;
  const workoutCount = (history || []).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* 1. User Identity Hero Card */}
      <div className="nothing-card" style={{ background: "linear-gradient(135deg, var(--bg-card), var(--bg-secondary))", textAlign: "center", padding: "32px 24px" }}>
        <div 
          className="avatar-circle" 
          style={{ width: "84px", height: "84px", fontSize: "2.2rem", margin: "0 auto 16px auto" }}
        >
          {avatarLetter}
        </div>

        <h1 style={{ fontSize: "1.6rem", fontWeight: "900" }}>{userName}</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
          {currentUser?.isAnonymous ? "Guest Member" : currentUser?.email || "Registered Athlete"}
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "20px" }}>
          <div style={{ background: "var(--bg-secondary)", padding: "10px 18px", borderRadius: "16px", border: "1px solid var(--border-color)", textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "var(--accent-protein)" }}>{prCount}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: "600" }}>PR Records</div>
          </div>
          <div style={{ background: "var(--bg-secondary)", padding: "10px 18px", borderRadius: "16px", border: "1px solid var(--border-color)", textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "var(--accent-success)" }}>{workoutCount}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: "600" }}>Workouts</div>
          </div>
          <div style={{ background: "var(--bg-secondary)", padding: "10px 18px", borderRadius: "16px", border: "1px solid var(--border-color)", textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "var(--accent-abs)" }}>{profile?.streak?.current || 0}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: "600" }}>Streak Days</div>
          </div>
        </div>
      </div>

      {/* 2. Fitness Profile & Goals Form */}
      <form onSubmit={handleSaveProfile} className="nothing-card" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="nothing-card-header" style={{ marginBottom: "4px" }}>
          <span className="nothing-title">
            <Target size={18} color="var(--accent-pull)" /> Fitness Metrics & Targets
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase" }}>Display Name</label>
          <div className="premium-input-box">
            <input 
              type="text" 
              className="premium-inner-input" 
              value={nameInput} 
              onChange={(e) => setNameInput(e.target.value)} 
              required
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase" }}>Daily Protein Goal (grams)</label>
          <div className="premium-input-box">
            <input 
              type="number" 
              className="premium-inner-input" 
              value={proteinInput} 
              onChange={(e) => setProteinInput(e.target.value)} 
              min="30" 
              max="350" 
              required
            />
            <span className="premium-input-unit">grams</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase" }}>Diet Preference</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className={`btn-premium-secondary ${dietPref === "veg" ? "active" : ""}`}
              style={{ flex: 1, minHeight: "44px", background: dietPref === "veg" ? "rgba(16, 185, 129, 0.15)" : "var(--bg-secondary)", borderColor: dietPref === "veg" ? "var(--accent-legs)" : "var(--border-color)", color: dietPref === "veg" ? "var(--accent-legs)" : "var(--text-secondary)" }}
              onClick={() => setDietPref("veg")}
            >
              🥗 Vegetarian
            </button>
            <button
              type="button"
              className={`btn-premium-secondary ${dietPref === "nonveg" ? "active" : ""}`}
              style={{ flex: 1, minHeight: "44px", background: dietPref === "nonveg" ? "rgba(239, 68, 68, 0.15)" : "var(--bg-secondary)", borderColor: dietPref === "nonveg" ? "var(--accent-push)" : "var(--border-color)", color: dietPref === "nonveg" ? "var(--accent-push)" : "var(--text-secondary)" }}
              onClick={() => setDietPref("nonveg")}
            >
              🥩 Non-Vegetarian
            </button>
          </div>
        </div>

        <button type="submit" className="btn-premium-primary" style={{ marginTop: "10px" }}>
          {isSaved ? <><Check size={18} /> Settings Updated</> : "Save Profile Settings"}
        </button>
      </form>

      {/* 3. Theme & Preferences Card */}
      <div className="nothing-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="nothing-card-header" style={{ marginBottom: "0" }}>
          <span className="nothing-title">
            <Sliders size={18} color="var(--accent-abs)" /> App Appearance & Preferences
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: "14px", border: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {theme === "dark" ? <Moon size={20} color="var(--accent-pull)" /> : <Sun size={20} color="var(--accent-warning)" />}
            <div>
              <div style={{ fontWeight: "700", fontSize: "0.9rem" }}>Color Theme</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{theme === "dark" ? "Dark Mode Active" : "Light Mode Active"}</div>
            </div>
          </div>
          <button 
            className="btn-premium-secondary" 
            style={{ padding: "0 14px", minHeight: "38px", fontSize: "0.8rem" }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            Switch to {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </div>

      {/* 4. Account & Sign Out Action */}
      <div className="nothing-card">
        <div className="nothing-card-header" style={{ marginBottom: "16px" }}>
          <span className="nothing-title">
            <ShieldCheck size={18} color="var(--accent-success)" /> Security & Session
          </span>
        </div>

        <button 
          className="btn-premium-danger" 
          style={{ width: "100%", justifyContent: "center" }}
          onClick={() => logout()}
        >
          <LogOut size={18} /> Sign Out of Account
        </button>
      </div>
    </motion.div>
  );
}
