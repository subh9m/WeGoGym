import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePlanner } from "../contexts/PlannerContext";
import { Search, Compass, Dumbbell, Apple, CalendarDays, History as ClockIcon } from "lucide-react";

export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { workouts, foodReferences, history } = usePlanner();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState(() => {
    const saved = localStorage.getItem("wegogym_recent_searches");
    return saved ? JSON.parse(saved) : [];
  });
  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle keys logic
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allResults.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allResults.length) % allResults.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (allResults[selectedIndex]) {
          handleItemAction(allResults[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, searchQuery, recentSearches]);

  if (!isOpen) return null;

  // 1. Navigation items
  const navItems = [
    { type: "nav", name: "Go to Workout Dashboard", path: "/", info: "Dashboard" },
    { type: "nav", name: "Go to Diet Tracker", path: "/diet", info: "Diet" },
    { type: "nav", name: "Go to Food Reference Library", path: "/food", info: "Food" },
    { type: "nav", name: "Go to Workout History", path: "/history", info: "History" },
    { type: "nav", name: "Go to Account Settings", path: "/settings", info: "Settings" }
  ];

  // 2. Exercise items
  const exerciseItems = [];
  Object.keys(workouts).forEach((dayKey) => {
    const day = workouts[dayKey];
    if (day && day.exercises) {
      day.exercises.forEach((ex) => {
        if (!exerciseItems.some((item) => item.name.toLowerCase() === ex.name.toLowerCase())) {
          exerciseItems.push({
            type: "exercise",
            name: ex.name,
            dayKey,
            dayName: day.type,
            info: "Exercise"
          });
        }
      });
    }
  });

  // 3. Food items
  const foodItems = foodReferences.map((f) => ({
    type: "food",
    name: f.name,
    serving: f.serving,
    protein: f.protein,
    info: "Food Item"
  }));

  // 4. History logs
  const historyItems = history.map((h) => ({
    type: "history",
    name: `${h.date} — ${h.dayName} Completed Log`,
    date: h.date,
    duration: h.durationMinutes,
    completed: h.completedCount,
    info: "History Log"
  }));

  const queryLower = searchQuery.toLowerCase().trim();

  // Filter items
  const filteredNav = navItems.filter((item) => item.name.toLowerCase().includes(queryLower));
  const filteredExercises = exerciseItems.filter((item) => item.name.toLowerCase().includes(queryLower));
  const filteredFoods = foodItems.filter((item) => item.name.toLowerCase().includes(queryLower));
  const filteredHistory = historyItems.filter((item) => item.name.toLowerCase().includes(queryLower));

  // Flattened results list
  const allResults = [];

  // If search query is empty, show Recent Searches first
  if (queryLower === "") {
    if (recentSearches.length > 0) {
      const formattedRecents = recentSearches.map((term, index) => ({
        type: "recent",
        name: term,
        term,
        section: "Recent Searches"
      }));
      allResults.push(...formattedRecents);
    }
    // Append Navigation categories next
    allResults.push(...navItems.map(item => ({ ...item, section: "Pages" })));
  } else {
    // Append standard search categories
    if (filteredNav.length > 0) {
      allResults.push(...filteredNav.map(item => ({ ...item, section: "Pages" })));
    }
    if (filteredExercises.length > 0) {
      allResults.push(...filteredExercises.map(item => ({ ...item, section: "Exercises" })));
    }
    if (filteredFoods.length > 0) {
      allResults.push(...filteredFoods.map(item => ({ ...item, section: "Diet Library" })));
    }
    if (filteredHistory.length > 0) {
      allResults.push(...filteredHistory.map(item => ({ ...item, section: "Workout Logs" })));
    }
  }

  // Adjust selection safety
  if (selectedIndex >= allResults.length && allResults.length > 0) {
    setSelectedIndex(0);
  }

  // Add search term to cache
  const addToRecentSearches = (term) => {
    if (!term.trim()) return;
    const cleanTerm = term.trim();
    let updated = [cleanTerm, ...recentSearches.filter(t => t !== cleanTerm)];
    updated = updated.slice(0, 5); // limit to 5
    setRecentSearches(updated);
    localStorage.setItem("wegogym_recent_searches", JSON.stringify(updated));
  };

  const handleItemAction = (item) => {
    // Write search query cache
    if (searchQuery.trim()) {
      addToRecentSearches(searchQuery);
    }

    if (item.type === "recent") {
      setSearchQuery(item.term);
      setSelectedIndex(0);
      return;
    }

    if (item.type === "nav") {
      navigate(item.path);
    } else if (item.type === "exercise") {
      navigate("/", { state: { selectDayKey: item.dayKey } });
      window.dispatchEvent(new CustomEvent("changeDayTab", { detail: { dayKey: item.dayKey } }));
    } else if (item.type === "food") {
      navigate("/food", { state: { prefilledSearch: item.name } });
      window.dispatchEvent(new CustomEvent("prefillSearch", { detail: { query: item.name } }));
    } else if (item.type === "history") {
      navigate("/history", { state: { selectLogId: item.date } });
      window.dispatchEvent(new CustomEvent("changeSubTab", { detail: { tab: "history" } }));
    }
    onClose();
  };

  const getSectionIcon = (section) => {
    switch (section) {
      case "Recent Searches": return <ClockIcon size={14} style={{ marginRight: "8px" }} />;
      case "Pages": return <Compass size={14} style={{ marginRight: "8px" }} />;
      case "Exercises": return <Dumbbell size={14} style={{ marginRight: "8px" }} />;
      case "Diet Library": return <Apple size={14} style={{ marginRight: "8px" }} />;
      default: return <CalendarDays size={14} style={{ marginRight: "8px" }} />;
    }
  };

  return (
    <div className="spotlight-overlay" onClick={onClose}>
      <div className="spotlight-content" onClick={(e) => e.stopPropagation()}>
        {/* Search bar input wrapper */}
        <div className="spotlight-input-wrapper">
          <Search size={20} color="var(--text-muted)" style={{ marginRight: "12px" }} />
          <input
            type="text"
            className="spotlight-input"
            placeholder="Search exercises, foods, logs, actions..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedIndex(0);
            }}
            ref={inputRef}
          />
          <kbd className="kbd-hint" style={{ fontSize: "0.6rem" }}>ESC</kbd>
        </div>

        {/* Results items */}
        <div className="spotlight-results">
          {allResults.length > 0 ? (
            renderSpotlightGroups(allResults, selectedIndex, handleItemAction, setSelectedIndex, getSectionIcon)
          ) : (
            <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem", fontFamily: "var(--font-mono)" }}>
              No matches found for "{searchQuery}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderSpotlightGroups(results, selectedIndex, handleItemAction, setSelectedIndex, getSectionIcon) {
  const sections = {};

  results.forEach((item, absoluteIndex) => {
    if (!sections[item.section]) {
      sections[item.section] = [];
    }
    sections[item.section].push({ ...item, absoluteIndex });
  });

  return Object.keys(sections).map((secName) => (
    <div key={secName}>
      <div className="spotlight-section-title">{secName}</div>
      {sections[secName].map((item) => {
        const isSelected = item.absoluteIndex === selectedIndex;
        return (
          <div
            key={item.absoluteIndex}
            className={`spotlight-item ${isSelected ? "selected" : ""}`}
            onMouseEnter={() => setSelectedIndex(item.absoluteIndex)}
            onClick={() => handleItemAction(item)}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              {getSectionIcon(item.section)}
              <span>{item.name}</span>
            </div>
            
            {item.type === "exercise" && (
              <span className="spotlight-item-meta">{item.dayName}</span>
            )}
            {item.type === "food" && (
              <span className="spotlight-item-meta">{item.protein}g ({item.serving})</span>
            )}
            {item.type === "history" && (
              <span className="spotlight-item-meta">{item.duration}m</span>
            )}
          </div>
        );
      })}
    </div>
  ));
}
