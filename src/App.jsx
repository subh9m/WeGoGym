import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PlannerProvider, usePlanner } from "./contexts/PlannerContext";

import Auth from "./components/Auth";
import Onboarding from "./components/Onboarding";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import Workout from "./components/Workout";
import Diet from "./components/Diet";
import FoodReference from "./components/FoodReference";
import History from "./components/History";
import Settings from "./components/Settings";
import CommandPalette from "./components/CommandPalette";

import { Search, Bell, Sun, Moon } from "lucide-react";
import "./App.css";

function AppContent() {
  const { currentUser } = useAuth();
  const { loading: plannerLoading, onboarded, profile } = usePlanner();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Theme Switching state
  const [theme, setTheme] = useState(() => localStorage.getItem("wegogym_theme") || "dark");
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Sync theme with body class
  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
    localStorage.setItem("wegogym_theme", theme);
  }, [theme]);

  // Custom event listener to open Command Palette
  useEffect(() => {
    const handleOpen = () => setIsPaletteOpen(true);
    window.addEventListener("openCommandPalette", handleOpen);
    return () => window.removeEventListener("openCommandPalette", handleOpen);
  }, []);

  // Global Keyboard Shortcuts (Ctrl/Cmd + K and Workout Day Arrows)
  useEffect(() => {
    const handleGlobalKeys = (e) => {
      // 1. Ctrl + K or Cmd + K toggles Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }

      // 2. Left/Right Arrow keys shift day selector tabs when active on the Workout page
      if (location.pathname === "/" || location.pathname === "/workout") {
        if (e.key === "ArrowLeft") {
          window.dispatchEvent(new CustomEvent("navigateDayTab", { detail: { direction: "prev" } }));
        } else if (e.key === "ArrowRight") {
          window.dispatchEvent(new CustomEvent("navigateDayTab", { detail: { direction: "next" } }));
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeys);
    return () => window.removeEventListener("keydown", handleGlobalKeys);
  }, [location.pathname]);

  // Redirect to Auth if not logged in
  if (!currentUser) {
    return <Auth />;
  }

  // Loading Screen while Firestore database syncs on startup
  if (plannerLoading) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)"
      }}>
        <div style={{ fontFamily: "var(--font-dot)", fontSize: "2.2rem", marginBottom: "12px", textTransform: "uppercase", fontWeight: "900" }}>
          WeGoGym
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
          Syncing with Cloud Firestore...
        </div>
      </div>
    );
  }

  // Onboarding screen if user profile doesn't exist in Firestore
  if (!onboarded) {
    return <Onboarding />;
  }

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
      case "/workout":
        return "Workout Dashboard";
      case "/diet":
        return "Diet Tracker";
      case "/food":
        return "Food Library";
      case "/history":
        return "Workout History";
      case "/settings":
        return "Account Settings";
      default:
        return "Bodybuilding Planner";
    }
  };

  const handleOpenSearch = () => {
    setIsPaletteOpen(true);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const userName = profile?.name || "User";
  const avatarLetter = userName.charAt(0).toUpperCase();

  return (
    <div className="app-shell">
      {/* Collapsible Left Sidebar Navigation (Desktop only) */}
      <Sidebar />

      {/* Main Layout Pane */}
      <div className="main-layout">
        {/* Sticky Premium Header Bar */}
        <header className="premium-header">
          <div className="header-left-sec">
            {/* Mobile Logo display (hidden on desktop sidebar) */}
            <span className="sidebar-logo mobile-logo-only" style={{ display: "none" }}>WeGoGym</span>
          </div>
          
          <div className="header-center-sec">
            <h1 className="header-page-title-text">{getPageTitle()}</h1>
          </div>
          
          <div className="header-right-sec">
            {/* Search shortcut toggle */}
            <button className="header-action-btn" onClick={handleOpenSearch} title="Search (Ctrl + K)">
              <Search size={18} />
            </button>
            
            {/* System Notifications placeholder */}
            <button className="header-action-btn" title="Notifications">
              <Bell size={18} />
            </button>
            
            {/* Theme Toggle Button */}
            <button className="header-action-btn" onClick={toggleTheme} title="Toggle color theme">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            {/* Profile Avatar circle */}
            <div className="avatar-circle" onClick={() => navigate("/settings")} title="View settings">
              {avatarLetter}
            </div>
          </div>
        </header>

        {/* Content Body Router */}
        <main className="app-container">
          <Routes>
            <Route path="/" element={<Workout />} />
            <Route path="/workout" element={<Workout />} />
            <Route path="/diet" element={<Diet />} />
            <Route path="/food" element={<FoodReference />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Sticky Bottom Nav Bar (Hidden on desktop) */}
      <BottomNav />

      {/* Spotlight Global Search overlay command search dialog */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <PlannerProvider>
          <AppContent />
        </PlannerProvider>
      </Router>
    </AuthProvider>
  );
}
