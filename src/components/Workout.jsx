import React, { useState, useEffect } from "react";
import { usePlanner } from "../contexts/PlannerContext";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dumbbell, 
  Clock, 
  Flame, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Check, 
  Trophy, 
  Timer, 
  Sparkles,
  Zap,
  Trash2
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

export default function Workout() {
  const location = useLocation();
  const { 
    workouts, 
    updateExercise, 
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
    startRest,
    pauseRest,
    resumeRest,
    resetRest
  } = usePlanner();

  const [selectedDay, setSelectedDay] = useState("day1");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for adding custom exercise
  const [newExName, setNewExName] = useState("");
  const [newExMuscle, setNewExMuscle] = useState("push");
  const [newExWeight, setNewExWeight] = useState(40);
  const [newExSets, setNewExSets] = useState(3);
  const [newExReps, setNewExReps] = useState(10);

  // Sync today's day on load
  useEffect(() => {
    const today = new Date().getDay();
    const dayKey = today === 0 ? "day7" : `day${today}`;
    setSelectedDay(dayKey);
  }, []);

  // Listen to command palette / arrow navigation
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
  const completedExercises = activeWorkout.exercises ? activeWorkout.exercises.filter(e => e.completed).length : 0;
  const progressPct = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  const formatElapsed = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const handleToggleExercise = (index) => {
    const ex = activeWorkout.exercises[index];
    const isNowCompleted = !ex.completed;

    updateExercise(selectedDay, index, { completed: isNowCompleted });

    // If starting or completing an exercise, trigger rest timer
    if (isNowCompleted && !restActive) {
      startRest(90);
    }

    // Auto start active timer if not active
    if (!activeTimer && isNowCompleted) {
      startSession(selectedDay);
    }
  };

  const handleAddCustomExercise = (e) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    const newEx = {
      id: `custom_${Date.now()}`,
      name: newExName,
      muscle: newExMuscle,
      weight: Number(newExWeight),
      sets: Number(newExSets),
      reps: Number(newExReps),
      completed: false,
      notes: "Custom target"
    };

    const updatedExercises = [...(activeWorkout.exercises || []), newEx];
    updateExercise(selectedDay, null, null, updatedExercises);

    setNewExName("");
    setShowAddModal(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.25 }}
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* 1. Day Split Pills Selector */}
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

      {/* 2. Main Routine Header & Active Timer Control */}
      <div className="nothing-card" style={{ background: "linear-gradient(135deg, var(--bg-card), var(--bg-secondary))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="nothing-label" style={{ color: "var(--accent-pull)" }}>
                Routine Schedule
              </span>
              <span style={{ background: "rgba(16, 185, 129, 0.12)", color: "var(--accent-success)", padding: "2px 8px", borderRadius: "10px", fontSize: "0.7rem", fontWeight: "700" }}>
                🔥 {profile?.streak?.current || 0} Day Streak
              </span>
            </div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "900", marginTop: "4px" }}>
              {activeWorkout.type} Routine
            </h1>
          </div>

          {/* Active Workout Timer Banner */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {activeTimer && activeTimer.dayKey === selectedDay ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--accent-push)", padding: "8px 16px", borderRadius: "16px" }}>
                <Clock size={18} color="var(--accent-push)" />
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: "800", color: "var(--accent-push)", fontSize: "1.1rem" }}>
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
                <button className="btn-premium-primary" style={{ minHeight: "36px", padding: "0 14px", fontSize: "0.8rem" }} onClick={finishSession}>
                  Finish
                </button>
              </div>
            ) : (
              <button 
                className="btn-premium-primary" 
                onClick={() => startSession(selectedDay)}
                disabled={totalExercises === 0}
              >
                <Play size={18} /> Start Session
              </button>
            )}
          </div>
        </div>

        {/* Workout Completion Progress Ring / Bar */}
        {totalExercises > 0 && (
          <div style={{ marginTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: "600" }}>
              <span>{completedExercises} of {totalExercises} Exercises Completed</span>
              <span>{progressPct}%</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "var(--bg-secondary)", borderRadius: "4px", overflow: "hidden" }}>
              <div 
                style={{ 
                  width: `${progressPct}%`, 
                  height: "100%", 
                  background: progressPct === 100 ? "var(--accent-success)" : "linear-gradient(90deg, var(--accent-pull), var(--accent-protein))",
                  transition: "width 0.4s ease-out" 
                }} 
              />
            </div>
          </div>
        )}
      </div>

      {/* 3. Main Split Grid (Exercise Cards + Rest Timer Widget Side-by-Side) */}
      <div className="workout-split-layout">
        {/* Left Side: Rest Timer & Quick Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="nothing-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div className="nothing-card-header" style={{ width: "100%", marginBottom: "0" }}>
              <span className="nothing-title" style={{ fontSize: "0.95rem" }}>
                <Timer size={16} color="var(--accent-timer)" /> Rest Timer
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                {restActive ? "ACTIVE" : "READY"}
              </span>
            </div>

            {/* Circular Rest Clock */}
            <div className="circular-ring-container" style={{ width: "130px", height: "130px" }}>
              <svg width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="65" cy="65" r="54" stroke="var(--bg-secondary)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="65"
                  cy="65"
                  r="54"
                  stroke="var(--accent-timer)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="339"
                  strokeDashoffset={339 - (restSeconds / (restInitial || 90)) * 339}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.3s ease-out" }}
                />
              </svg>
              <div className="ring-percent-text" style={{ fontSize: "1.6rem", color: "var(--accent-timer)" }}>
                {restSeconds}s
              </div>
            </div>

            {/* Quick Rest Presets */}
            <div className="rest-quick-pills">
              <button className="rest-pill-btn" onClick={() => startRest(60)}>60s</button>
              <button className="rest-pill-btn" onClick={() => startRest(90)}>90s</button>
              <button className="rest-pill-btn" onClick={() => startRest(120)}>120s</button>
            </div>

            {/* Rest Controls */}
            <div className="rest-controls-row">
              {restActive ? (
                <button className="rest-ctrl-icon-btn" onClick={pauseRest} title="Pause rest"><Pause size={16} /></button>
              ) : (
                <button className="rest-ctrl-icon-btn" onClick={resumeRest} title="Resume rest"><Play size={16} /></button>
              )}
              <button className="rest-ctrl-icon-btn" onClick={resetRest} title="Reset rest"><RotateCcw size={16} /></button>
            </div>
          </div>
        </div>

        {/* Right Side: Exercise Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: "800" }}>
              Lifting Exercises ({totalExercises})
            </h2>
            <button className="btn-premium-secondary" style={{ padding: "0 14px", minHeight: "38px", fontSize: "0.8rem" }} onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add Exercise
            </button>
          </div>

          {totalExercises > 0 ? (
            <div className="exercise-responsive-grid">
              {activeWorkout.exercises.map((ex, index) => {
                const exPr = prs[ex.name.toLowerCase()];
                const isCompleted = ex.completed;

                return (
                  <motion.div 
                    key={ex.id || index}
                    className={`premium-exercise-card ${isCompleted ? "completed" : ""}`}
                    whileHover={{ y: -2 }}
                  >
                    {/* Header */}
                    <div>
                      <div className="exercise-header-top">
                        <div className="exercise-title-area">
                          <div className="exercise-icon-box">
                            <Dumbbell size={20} color={isCompleted ? "var(--accent-success)" : "var(--accent-pull)"} />
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

                        {/* Animated Set Complete Toggle Button */}
                        <button
                          className={`set-complete-toggle-btn ${isCompleted ? "completed" : ""}`}
                          onClick={() => handleToggleExercise(index)}
                          title={isCompleted ? "Mark incomplete" : "Mark completed"}
                        >
                          <Check size={18} />
                        </button>
                      </div>

                      {/* Weight, Sets, Reps Controls */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginTop: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase" }}>Weight</span>
                          <div className="premium-input-box" style={{ height: "42px" }}>
                            <input 
                              type="number" 
                              className="premium-inner-input"
                              value={ex.weight || 0}
                              onChange={(e) => updateExercise(selectedDay, index, { weight: Number(e.target.value) })}
                            />
                            <span className="premium-input-unit">kg</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase" }}>Sets</span>
                          <div className="premium-input-box" style={{ height: "42px" }}>
                            <input 
                              type="number" 
                              className="premium-inner-input"
                              value={ex.sets || 0}
                              onChange={(e) => updateExercise(selectedDay, index, { sets: Number(e.target.value) })}
                            />
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase" }}>Reps</span>
                          <div className="premium-input-box" style={{ height: "42px" }}>
                            <input 
                              type="number" 
                              className="premium-inner-input"
                              value={ex.reps || 0}
                              onChange={(e) => updateExercise(selectedDay, index, { reps: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PR Footer */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-color)", fontSize: "0.75rem" }}>
                      <div style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Trophy size={14} color="var(--accent-protein)" />
                        <span>Best Record: </span>
                        <strong style={{ color: "var(--text-primary)" }}>{exPr ? `${exPr.highestWeight}kg` : "None"}</strong>
                      </div>
                      <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                        {ex.notes || "Stay consistent"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="nothing-card" style={{ textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-secondary)" }}>No exercises added to this routine yet.</div>
              <button className="btn-premium-primary" style={{ margin: "16px auto 0 auto" }} onClick={() => setShowAddModal(true)}>
                <Plus size={16} /> Add First Exercise
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button (FAB) for adding exercises */}
      <button 
        className="fab-button" 
        onClick={() => setShowAddModal(true)}
        title="Add Exercise"
      >
        <Plus size={28} />
      </button>

      {/* Add Exercise Modal Dialog */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nothing-card-header" style={{ marginBottom: "16px" }}>
              <span className="nothing-title">Add Custom Exercise</span>
              <button className="header-action-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleAddCustomExercise} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "700" }}>EXERCISE NAME</label>
                <div className="premium-input-box">
                  <input 
                    type="text" 
                    className="premium-inner-input"
                    placeholder="e.g. Incline DB Press"
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "700" }}>MUSCLE GROUP</label>
                <select 
                  className="premium-input-box" 
                  style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", padding: "0 14px" }}
                  value={newExMuscle}
                  onChange={(e) => setNewExMuscle(e.target.value)}
                >
                  <option value="push">Push (Chest / Shoulder / Triceps)</option>
                  <option value="pull">Pull (Back / Biceps)</option>
                  <option value="legs">Legs (Quads / Hamstrings)</option>
                  <option value="abs">Abs / Core</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "700" }}>WEIGHT (KG)</label>
                  <div className="premium-input-box">
                    <input 
                      type="number" 
                      className="premium-inner-input"
                      value={newExWeight}
                      onChange={(e) => setNewExWeight(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "700" }}>SETS</label>
                  <div className="premium-input-box">
                    <input 
                      type="number" 
                      className="premium-inner-input"
                      value={newExSets}
                      onChange={(e) => setNewExSets(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "700" }}>REPS</label>
                  <div className="premium-input-box">
                    <input 
                      type="number" 
                      className="premium-inner-input"
                      value={newExReps}
                      onChange={(e) => setNewExReps(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-premium-primary" style={{ marginTop: "10px" }}>
                Save Exercise to Routine
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
