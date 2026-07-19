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
  UtensilsCrossed,
  Trophy,
  CheckCircle2,
  TrendingUp,
  Sparkles
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
    resetRest,
    diets
  } = usePlanner();

  const [selectedDay, setSelectedDay] = useState("day1");

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
        total += (item.proteinPerServing || 0) * (item.quantity || 1);
      });
    });
    return total;
  };

  const proteinToday = getProteinToday();
  const proteinTarget = profile?.proteinTarget || 100;
  const isProteinAchieved = proteinToday >= proteinTarget;

  const handleToggleExercise = (index) => {
    const ex = activeWorkout.exercises[index];
    const isNowCompleted = !ex.completed;

    updateExercise(selectedDay, index, { completed: isNowCompleted });

    if (isNowCompleted && !restActive) {
      startRest(90);
    }

    if (!activeTimer && isNowCompleted) {
      startSession(selectedDay);
    }
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="nothing-label">Today's Routine</span>
            <h1 className="nothing-title" style={{ fontSize: "1.8rem", marginTop: "4px" }}>
              {activeWorkout.type} Routine
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {activeTimer && activeTimer.dayKey === selectedDay ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--accent-push)", padding: "8px 16px", borderRadius: "12px" }}>
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
                <button className="btn-premium-primary" style={{ height: "36px", padding: "0 14px", fontSize: "0.8rem" }} onClick={finishSession}>
                  Finish
                </button>
              </div>
            ) : (
              <button 
                className="btn-premium-primary" 
                onClick={() => startSession(selectedDay)}
                disabled={totalExercises === 0}
              >
                <Play size={16} /> Start Session
              </button>
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
                <span>Session Duration</span>
                <Clock size={16} color={activeTimer ? "var(--accent-push)" : "var(--text-secondary)"} />
              </div>
              {activeTimer && activeTimer.dayKey === selectedDay ? (
                <div className="metric-value" style={{ color: "var(--accent-push)" }}>
                  <span className="metric-value-dot">{formatElapsed(activeTimer.elapsedSeconds)}</span>
                </div>
              ) : (
                <div className="metric-value" style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                  Idle Session
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

            <div className="rest-quick-pills">
              <button className="rest-pill-btn" onClick={() => startRest(60)}>60s</button>
              <button className="rest-pill-btn" onClick={() => startRest(90)}>90s</button>
              <button className="rest-pill-btn" onClick={() => startRest(120)}>120s</button>
            </div>

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

        {/* Right Pane: Exercise Grid Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="nothing-card-header" style={{ marginBottom: "0" }}>
            <span className="nothing-title">Exercises ({totalExercises})</span>
            <span className="nothing-label">Day Routine Targets</span>
          </div>

          {totalExercises > 0 ? (
            <div className="exercise-responsive-grid">
              {activeWorkout.exercises.map((ex, index) => {
                const exPr = prs[ex.name.toLowerCase()];
                const isCompleted = ex.completed;

                return (
                  <motion.div 
                    key={ex.id || index}
                    className={`premium-exercise-card ${isCompleted ? "completed" : ""} glow-white`}
                    whileHover={{ y: -2 }}
                  >
                    <div>
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

                        {/* Nothing Checkbox Toggle Switch */}
                        <label className="nothing-toggle-label" title={isCompleted ? "Mark incomplete" : "Mark completed"}>
                          <input 
                            type="checkbox"
                            checked={isCompleted}
                            onChange={() => handleToggleExercise(index)}
                          />
                          <span className="nothing-slider" />
                        </label>
                      </div>

                      {/* Weight, Sets, Reps Controls */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginTop: "16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span className="nothing-label" style={{ fontSize: "0.6rem" }}>Weight</span>
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
                          <span className="nothing-label" style={{ fontSize: "0.6rem" }}>Sets</span>
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
                          <span className="nothing-label" style={{ fontSize: "0.6rem" }}>Reps</span>
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
                        <span>Best: </span>
                        <strong style={{ color: "var(--text-primary)" }}>{exPr ? `${exPr.highestWeight}kg` : "None"}</strong>
                      </div>
                      <span style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.7rem" }}>
                        {ex.notes || "+2.5kg recommended"}
                      </span>
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
    </motion.div>
  );
}
