import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { usePlanner } from "../contexts/PlannerContext";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const location = useLocation();
  const { profile, updateProfileSettings } = usePlanner();
  const { logout } = useAuth();
  
  // Dropdown states
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const dropdownRef = useRef(null);

  // Profile Edit Local States
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState(100);
  const [editDietPref, setEditDietPref] = useState("veg");

  // Sync edit local states when profile updates or edit opens
  useEffect(() => {
    if (profile) {
      setEditName(profile.name || "");
      setEditTarget(profile.proteinTarget || 100);
      setEditDietPref(profile.dietPreference || "veg");
    }
  }, [profile, isEditing]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
        setIsEditing(false); // reset editing state
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Determine current page title
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
      case "/workout":
        return "Workout";
      case "/diet":
        return "Diet";
      case "/reference":
        return "Food Reference";
      default:
        return "Planner";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editName.trim() || editTarget <= 0) return;
    
    await updateProfileSettings(editName, editTarget, editDietPref);
    setIsEditing(false);
  };

  const handleOpenSearch = () => {
    window.dispatchEvent(new CustomEvent("openCommandPalette"));
  };

  const userName = profile?.name || "User";
  const avatarLetter = userName.charAt(0).toUpperCase();

  return (
    <header className="sticky-header">
      <div className="header-inner">
        {/* Left: Logo */}
        <Link to="/" className="header-logo">
          WeGoGym
        </Link>

        {/* Center: Current Page & Search Hint */}
        <div className="header-center-info">
          <div className="header-page-title">{getPageTitle()}</div>
          <button 
            className="kbd-hint" 
            style={{ background: "transparent", border: "1px dashed var(--border-color-hover)", cursor: "pointer" }}
            onClick={handleOpenSearch}
            title="Open search menu"
          >
            Ctrl + K
          </button>
        </div>

        {/* Right: User Avatar / Name Button */}
        <div className="profile-dropdown-container" ref={dropdownRef}>
          <button 
            className="profile-select-btn" 
            style={{ 
              borderRadius: "50%", 
              width: "36px", 
              height: "36px", 
              padding: "0", 
              justifyContent: "center",
              fontFamily: "var(--font-mono)",
              fontSize: "1rem"
            }}
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setIsEditing(false);
            }}
          >
            {avatarLetter}
          </button>

          {dropdownOpen && (
            <div 
              className="profile-dropdown-menu" 
              style={{ 
                minWidth: "260px", 
                padding: "16px",
                top: "calc(100% + 10px)"
              }}
            >
              {isEditing ? (
                /* Inline Settings Editor */
                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="ref-form-group">
                    <label className="nothing-label" style={{ fontSize: "0.6rem" }}>Name</label>
                    <input
                      type="text"
                      className="nothing-input"
                      style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="ref-form-group">
                    <label className="nothing-label" style={{ fontSize: "0.6rem" }}>Protein Target (g)</label>
                    <input
                      type="number"
                      className="nothing-input"
                      style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                      value={editTarget}
                      onChange={(e) => setEditTarget(parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="ref-form-group">
                    <label className="nothing-label" style={{ fontSize: "0.6rem" }}>Diet Preference</label>
                    <div style={{ display: "flex", gap: "6px", marginTop: "2px" }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{
                          flex: 1,
                          padding: "6px",
                          fontSize: "0.75rem",
                          background: editDietPref === "veg" ? "var(--text-primary)" : "transparent",
                          color: editDietPref === "veg" ? "var(--bg-primary)" : "var(--text-primary)",
                          borderColor: editDietPref === "veg" ? "var(--text-primary)" : "var(--border-color)"
                        }}
                        onClick={() => setEditDietPref("veg")}
                      >
                        Veg
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{
                          flex: 1,
                          padding: "6px",
                          fontSize: "0.75rem",
                          background: editDietPref === "nonveg" ? "var(--text-primary)" : "transparent",
                          color: editDietPref === "nonveg" ? "var(--bg-primary)" : "var(--text-primary)",
                          borderColor: editDietPref === "nonveg" ? "var(--text-primary)" : "var(--border-color)"
                        }}
                        onClick={() => setEditDietPref("nonveg")}
                      >
                        Non-Veg
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "6px", marginTop: "5px" }}>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      style={{ flex: 1, padding: "8px", fontSize: "0.75rem" }}
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ flex: 1, padding: "8px", fontSize: "0.75rem" }}
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                /* Profile Stats Summary & Sign Out */
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <div style={{ fontStyle: "normal", fontWeight: "700", fontSize: "1.1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {userName}
                    </div>
                    <div className="nothing-label" style={{ fontSize: "0.6rem", textTransform: "none", color: "var(--text-secondary)", marginTop: "2px" }}>
                      Signed In
                    </div>
                  </div>
                  
                  <div style={{ height: "1px", background: "var(--border-color)", margin: "4px 0" }}></div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Diet Category:</span>
                    <span style={{ fontWeight: "700" }}>{profile?.dietPreference === "veg" ? "🥦 Veg" : "🍗 Non-Veg"}</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span style={{ color: "var(--text-secondary)" }}>Protein Limit:</span>
                    <span style={{ fontWeight: "700" }}>{profile?.proteinTarget || 100}g</span>
                  </div>

                  <div style={{ height: "1px", background: "var(--border-color)", margin: "4px 0" }}></div>

                  <button 
                    className="btn-secondary" 
                    style={{ width: "100%", padding: "8px", fontSize: "0.8rem" }}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </button>

                  <button 
                    className="btn-danger" 
                    style={{ width: "100%", padding: "8px", fontSize: "0.8rem" }}
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
