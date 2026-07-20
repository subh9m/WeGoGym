import React, { useState, useEffect } from "react";
import { usePlanner } from "../contexts/PlannerContext";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dumbbell, 
  Clock, 
  Flame, 
  Play, 
  Pause, 
  RotateCcw, 
  UtensilsCrossed,
  Trophy,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  X,
  AlertCircle,
  Pencil
} from "lucide-react";

const DAYS_CONFIG = [
  { key: "day1", label: "Day 1" },
  { key: "day2", label: "Day 2" },
  { key: "day3", label: "Day 3" },
  { key: "day4", label: "Day 4" },
  { key: "day5", label: "Day 5" },
  { key: "day6", label: "Day 6" },
  { key: "day7", label: "Rest" }
];

// 2.5 kg Increment Weight Options Generator (0 kg to 300 kg)
const WEIGHT_OPTIONS = Array.from({ length: 121 }, (_, i) => i * 2.5);
const formatWeightLabel = (w) => (w % 1 === 0 ? `${w} kg` : `${w.toFixed(1)} kg`);

export default function Workout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    workouts, 
    updateExercise, 
    updateExerciseSet,
    getSetsList,
    activeTimer, 
    startSession, 
    pauseSession, 
    resumeSession, 
    finishSession,
    prs,
    profile,
    restSeconds,
    restActive,
    restInitial,
    selectRestDuration,
    startRest,
    pauseRest,
    resumeRest,
    resetRest,
    diets
  } = usePlanner();

  const [selectedDay, setSelectedDay] = useState("day1");
  const [showEndModal, setShowEndModal] = useState(false);

  useEffect(() => {
    const today = new Date().getDay();
    const dayKey = today === 0 ? "day7" : `day${today}`;
    setSelectedDay(dayKey);
  }, []);

  useEffect(() => {
    const handleChangeDayTab = (e) => {
      if (e.detail?.dayKey) {
        setSelectedDay(e.detail.dayKey);
      }
    };
    window.addEventListener("changeDayTab", handleChangeDayTab);
    return () => window.removeEventListener("changeDayTab", handleChangeDayTab);
  }, []);

  useEffect(() => {
    if (location.state && location.state.selectDayKey) {
      setSelectedDay(location.state.selectDayKey);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const handleNavigate = (e) => {
      if (e.detail?.direction) {
        const idx = DAYS_CONFIG.findIndex(d => d.key === selectedDay);
        if (e.detail.direction === "next" && idx < DAYS_CONFIG.length - 1) {
          setSelectedDay(DAYS_CONFIG[idx + 1].key);
        } else if (e.detail.direction === "prev" && idx > 0) {
          setSelectedDay(DAYS_CONFIG[idx - 1].key);
        }
      }
    };
    window.addEventListener("navigateDayTab", handleNavigate);
    return () => window.removeEventListener("navigateDayTab", handleNavigate);
  }, [selectedDay]);

  const activeWorkout = workouts[selectedDay] || { type: "Rest", exercises: [] };
  const totalExercises = activeWorkout.exercises ? activeWorkout.exercises.length : 0;
  
  // Calculate completed exercises based on set completion
  const completedExercises = activeWorkout.exercises ? activeWorkout.exercises.filter(e => {
    const sets = getSetsList(e);
    return sets.length > 0 && sets.every(s => s.completed);
  }).length : 0;
  
  const progressPct = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  const formatElapsed = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const getWorkoutColorName = (workoutType) => {
    const type = (workoutType || "").toLowerCase();
    if (type.includes("push")) return "red";
    if (type.includes("pull")) return "blue";
    if (type.includes("leg")) return "green";
    if (type.includes("abs")) return "orange";
    return "white";
  };

  const getProteinToday = () => {
    const today = new Date().getDay();
    const dayKey = today === 0 ? "day7" : `day${today}`;
    const dayDiet = diets[dayKey];
    if (!dayDiet) return 0;
    
    let total = 0;
    Object.keys(dayDiet.meals || {}).forEach((mealKey) => {
      (dayDiet.meals[mealKey] || []).forEach((item) => {
        total += (parseInt(item.proteinPerServing ?? item.protein) || 0) * (parseInt(item.quantity) || 1);
      });
    });
    return total;
  };

  const proteinToday = getProteinToday();
  const proteinTarget = profile?.proteinTarget || 100;
  const isProteinAchieved = proteinToday >= proteinTarget;

  // Toggle single set completion state (Rest timer is manual only)
  const handleToggleSet = (exIndex, setIndex, currentStatus) => {
    const nextStatus = !currentStatus;
    updateExerciseSet(selectedDay, exIndex, setIndex, { completed: nextStatus });
    // Note: Rest timer must be started manually by user (Feature 3 requirement)
  };

  // Smart Progressive Overload Calculator
  const getSmartRecommendation = (ex, exPr) => {
    const setsList = getSetsList(ex);
    const completedSets = setsList.filter(s => s.completed).length;
    const totalSets = setsList.length;

    if (totalSets === 0) {
      return { text: "Maintain current weight", color: "var(--text-secondary)" };
    }

    if (completedSets === totalSets) {
      return { text: "Next workout: increase weight by +2.5 kg", color: "var(--accent-success)" };
    }

    if (completedSets >= Math.ceil(totalSets * 0.75)) {
      return { text: "Maintain current weight & form", color: "var(--accent-warning)" };
    }

    return { text: "Consider reducing weight by 2.5 kg", color: "var(--accent-abs)" };
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.25 }}
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* Segmented Pills Day Selector */}
      <div className="segmented-pills-container">
        {DAYS_CONFIG.map((d) => {
          const isActive = selectedDay === d.key;
          const dayWorkout = workouts[d.key];
          const typeLabel = dayWorkout?.type || (d.key === "day7" ? "Rest" : "Split");

          return (
            <button
              key={d.key}
              className={`segmented-pill-btn ${isActive ? "active" : ""}`}
              onClick={() => setSelectedDay(d.key)}
            >
              {isActive && <motion.div layoutId="pillActiveBg" className="segmented-pill-active-bg" />}
              <span style={{ position: "relative", zIndex: 2 }}>{d.label}: {typeLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Main Routine Header Card */}
      <div className={`nothing-card glow-${getWorkoutColorName(activeWorkout.type)}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="nothing-label">Today's Routine</span>
            <h1 className="nothing-title" style={{ fontSize: "1.8rem", marginTop: "4px" }}>
              {activeWorkout.type} Routine
            </h1>
          </div>

          {/* Manual Timer Session Control Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {activeTimer && activeTimer.dayKey === selectedDay ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--accent-push)", padding: "8px 16px", borderRadius: "14px" }}>
                <Clock size={16} color="var(--accent-push)" />
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: "var(--accent-push)", fontSize: "1.05rem" }}>
                  {formatElapsed(activeTimer.elapsedSeconds)}
                </span>
                {activeTimer.isPaused ? (
                  <button className="header-action-btn" onClick={resumeSession} title="Resume timer" style={{ width: "32px", height: "32px" }}>
                    <Play size={14} />
                  </button>
                ) : (
                  <button className="header-action-btn" onClick={pauseSession} title="Pause timer" style={{ width: "32px", height: "32px" }}>
                    <Pause size={14} />
                  </button>
                )}
                <button 
                  className="btn-premium-danger" 
                  style={{ height: "36px", padding: "0 14px", fontSize: "0.8rem" }} 
                  onClick={() => setShowEndModal(true)}
                >
                  End Workout
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button 
                  className="btn-premium-secondary" 
                  onClick={() => navigate("/edit-routine")}
                  style={{ height: "42px" }}
                >
                  <Pencil size={15} /> Edit Routine
                </button>

                <button 
                  className="btn-premium-primary" 
                  onClick={() => startSession(selectedDay)}
                  disabled={totalExercises === 0}
                  style={{ height: "42px" }}
                >
                  <Play size={16} /> Start Workout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Grid (Sidebar Left + Exercise Cards Right) */}
      <div className="workout-split-layout">
        {/* Left Pane: Metric Widgets, Progress Ring, Rest Timer Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Top 3 Dashboard Metrics Cards */}
          <div className="dashboard-grid" style={{ gridTemplateColumns: "1fr", gap: "12px" }}>
            <div className="metric-card glow-orange" style={{ borderColor: "rgba(249, 115, 22, 0.2)" }}>
              <div className="metric-card-header">
                <span>Streak</span>
                <Flame size={16} color="var(--accent-abs)" />
              </div>
              <div className="metric-value">
                <span className="metric-value-dot">{profile?.streak?.current || 0}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginLeft: "4px" }}>days</span>
              </div>
            </div>

            <div className={`metric-card ${activeTimer ? "glow-red" : "glow-white"}`}>
              <div className="metric-card-header">
                <span>Session Timer</span>
                <Clock size={16} color={activeTimer ? "var(--accent-push)" : "var(--text-secondary)"} />
              </div>
              {activeTimer && activeTimer.dayKey === selectedDay ? (
                <div className="metric-value" style={{ color: "var(--accent-push)" }}>
                  <span className="metric-value-dot">{formatElapsed(activeTimer.elapsedSeconds)}</span>
                </div>
              ) : (
                <div className="metric-value" style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                  Not Started
                </div>
              )}
            </div>

            <div className={`metric-card ${isProteinAchieved ? "glow-green" : "glow-purple"}`}>
              <div className="metric-card-header">
                <span>Protein</span>
                <UtensilsCrossed size={16} color={isProteinAchieved ? "var(--accent-legs)" : "var(--accent-protein)"} />
              </div>
              <div className="metric-value">
                <span className="metric-value-dot">{proteinToday}</span>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}> / {proteinTarget}g</span>
              </div>
            </div>
          </div>

          {/* SVG Completion Ring Card */}
          <div className="progress-ring-card glow-white">
            <span className="nothing-label" style={{ marginBottom: "14px" }}>Routine Completion</span>
            <div className="circular-ring-container">
              <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="70" cy="70" r="58" stroke="var(--bg-secondary)" strokeWidth="10" fill="transparent" />
                <circle
                  cx="70"
                  cy="70"
                  r="58"
                  stroke={progressPct === 100 ? "var(--accent-success)" : "var(--text-primary)"}
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray="364"
                  strokeDashoffset={364 - (progressPct / 100) * 364}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.4s ease-out" }}
                />
              </svg>
              <div className="ring-percent-text">{progressPct}%</div>
            </div>
            <div className="ring-sub-text">{completedExercises} of {totalExercises} Completed</div>
          </div>

          {/* Rest Timer Widget Card */}
          <div className="premium-rest-card glow-timer">
            <div className="nothing-card-header" style={{ width: "100%", marginBottom: "0" }}>
              <span className="nothing-title" style={{ fontSize: "1rem" }}>Rest Timer</span>
              <span className="nothing-label">{restActive ? "RUNNING" : "STOPPED"}</span>
            </div>

            <div className="rest-circle-wrapper">
              <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="60" cy="60" r="50" stroke="var(--bg-secondary)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="var(--accent-timer)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="314"
                  strokeDashoffset={314 - (restSeconds / (restInitial || 90)) * 314}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.3s ease-out" }}
                />
              </svg>
              <div className="rest-time-text">{restSeconds}s</div>
            </div>

            {/* Rest Presets (30s, 60s, 90s, 120s, 180s) - Selects Duration Only */}
            <div className="rest-quick-pills" style={{ flexWrap: "wrap", gap: "6px" }}>
              <button className={`rest-pill-btn ${restInitial === 30 ? "active" : ""}`} onClick={() => selectRestDuration(30)}>30s</button>
              <button className={`rest-pill-btn ${restInitial === 60 ? "active" : ""}`} onClick={() => selectRestDuration(60)}>60s</button>
              <button className={`rest-pill-btn ${restInitial === 90 ? "active" : ""}`} onClick={() => selectRestDuration(90)}>90s</button>
              <button className={`rest-pill-btn ${restInitial === 120 ? "active" : ""}`} onClick={() => selectRestDuration(120)}>120s</button>
              <button className={`rest-pill-btn ${restInitial === 180 ? "active" : ""}`} onClick={() => selectRestDuration(180)}>180s</button>
            </div>

            <div className="rest-controls-row">
              {restActive ? (
                <button className="rest-ctrl-icon-btn" onClick={pauseRest} title="Pause rest"><Pause size={16} /></button>
              ) : (
                <button className="rest-ctrl-icon-btn" onClick={() => startRest()} title="Start rest countdown"><Play size={16} /></button>
              )}
              <button className="rest-ctrl-icon-btn" onClick={resetRest} title="Reset rest"><RotateCcw size={16} /></button>
            </div>
          </div>
        </div>

        {/* Right Pane: Exercise Grid Cards with Per-Set Tracking */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="nothing-card-header" style={{ marginBottom: "0" }}>
            <span className="nothing-title">Exercises ({totalExercises})</span>
            <span className="nothing-label">Per-Set Gym Tracker</span>
          </div>

          {totalExercises > 0 ? (
            <div className="exercise-responsive-grid">
              {activeWorkout.exercises.map((ex, index) => {
                const exPr = prs[ex.name.toLowerCase()];
                const setsList = getSetsList(ex);
                const completedSetsCount = setsList.filter(s => s.completed).length;
                const totalSetsCount = setsList.length;
                const isAllCompleted = totalSetsCount > 0 && completedSetsCount === totalSetsCount;
                const rec = getSmartRecommendation(ex, exPr);

                return (
                  <motion.div 
                    key={ex.id || index}
                    className={`premium-exercise-card ${isAllCompleted ? "completed" : ""} glow-white`}
                    whileHover={{ y: -2 }}
                  >
                    <div>
                      {/* Exercise Header */}
                      <div className="exercise-header-top">
                        <div className="exercise-title-area">
                          <div className="exercise-icon-box">
                            <Dumbbell size={20} />
                          </div>
                          <div className="exercise-meta-box">
                            <span style={{ fontSize: "1rem", fontWeight: "800", color: "var(--text-primary)" }}>
                              {ex.name}
                            </span>
                            <span className={`exercise-badge-muscle muscle-${ex.muscle || "other"}`}>
                              {ex.muscle || "General"}
                            </span>
                          </div>
                        </div>

                        {/* Exercise Completion Badge */}
                        <div>
                          {isAllCompleted ? (
                            <span style={{ background: "rgba(34, 197, 94, 0.15)", color: "var(--accent-success)", border: "1px solid var(--accent-success)", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                              <CheckCircle2 size={13} /> {completedSetsCount}/{totalSetsCount} Sets Complete
                            </span>
                          ) : (
                            <span style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-color)", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600" }}>
                              {completedSetsCount}/{totalSetsCount} Sets
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Per-Set Gym Logging Table */}
                      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "55px 1.2fr 1fr 44px", gap: "8px", padding: "0 4px", fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase" }}>
                          <span>SET</span>
                          <span>WEIGHT</span>
                          <span>REPS</span>
                          <span style={{ textAlign: "center" }}>DONE</span>
                        </div>

                        {setsList.map((setObj, setIdx) => (
                          <div 
                            key={setIdx}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "55px 1.2fr 1fr 44px",
                              gap: "8px",
                              alignItems: "center",
                              background: setObj.completed ? "rgba(34, 197, 94, 0.08)" : "var(--bg-secondary)",
                              border: setObj.completed ? "1px solid rgba(34, 197, 94, 0.35)" : "1px solid var(--border-color)",
                              borderRadius: "10px",
                              padding: "6px 8px",
                              transition: "all 0.15s ease"
                            }}
                          >
                            <span style={{ fontFamily: "var(--font-mono)", fontWeight: "700", fontSize: "0.85rem", color: "var(--text-secondary)", paddingLeft: "4px" }}>
                              Set {setObj.setNum}
                            </span>

                            {/* 2.5 kg Increment Weight Selector Dropdown */}
                            <div className="premium-input-box" style={{ height: "36px", background: "var(--bg-card)", padding: "0 4px" }}>
                              <select 
                                className="premium-inner-input"
                                style={{ fontSize: "0.85rem", padding: "0 2px", cursor: "pointer", background: "transparent", border: "none", color: "var(--text-primary)", fontWeight: "700" }}
                                value={setObj.weight || 0}
                                onChange={(e) => updateExerciseSet(selectedDay, index, setIdx, { weight: Number(e.target.value) })}
                              >
                                {WEIGHT_OPTIONS.map((w) => (
                                  <option key={w} value={w} style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>
                                    {formatWeightLabel(w)}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="premium-input-box" style={{ height: "36px", background: "var(--bg-card)" }}>
                              <input 
                                type="number"
                                className="premium-inner-input"
                                style={{ fontSize: "0.85rem", padding: "0 6px" }}
                                value={setObj.reps || 0}
                                onChange={(e) => updateExerciseSet(selectedDay, index, setIdx, { reps: Number(e.target.value) })}
                              />
                            </div>

                            <div style={{ display: "flex", justifyContent: "center" }}>
                              <label className="nothing-toggle-label" title={setObj.completed ? "Mark set incomplete" : "Mark set complete"}>
                                <input 
                                  type="checkbox"
                                  checked={setObj.completed}
                                  onChange={() => handleToggleSet(index, setIdx, setObj.completed)}
                                />
                                <span className="nothing-slider" />
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PR Record & Progressive Overload Footer */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border-color)", fontSize: "0.75rem" }}>
                      <div style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Trophy size={14} color="var(--accent-protein)" />
                        <span>Best: </span>
                        <strong style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                          {exPr ? `${exPr.highestWeight}kg` : "None"}
                        </strong>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "4px", color: rec.color, fontWeight: "600", fontSize: "0.72rem" }}>
                        <TrendingUp size={13} />
                        <span>{rec.text}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="nothing-card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <span className="nothing-label">Rest Day Routine</span>
              <div style={{ fontSize: "0.95rem", color: "var(--text-secondary)", marginTop: "6px" }}>
                No active exercises scheduled for this day. Focus on nutrition & recovery!
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal Dialog for Ending Workout */}
      {showEndModal && (
        <div className="modal-overlay" onClick={() => setShowEndModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nothing-card-header" style={{ marginBottom: "16px" }}>
              <span className="nothing-title" style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertCircle size={20} color="var(--accent-push)" /> End Workout Session?
              </span>
              <button className="header-action-btn" onClick={() => setShowEndModal(false)}>
                <X size={18} />
              </button>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5", marginBottom: "24px" }}>
              Are you sure you want to finish this session? Your workout duration, total volume, completed sets, and PR achievements will be calculated and saved to your Workout History.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button className="btn-premium-secondary" onClick={() => setShowEndModal(false)}>
                Continue Workout
              </button>
              <button 
                className="btn-premium-primary" 
                style={{ background: "var(--accent-push)", borderColor: "var(--accent-push)", color: "#fff" }}
                onClick={async () => {
                  setShowEndModal(false);
                  await finishSession();
                }}
              >
                End & Save Workout
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
