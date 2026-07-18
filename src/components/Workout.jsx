import React, { useState, useEffect } from "react";
import { usePlanner } from "../contexts/PlannerContext";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dumbbell, 
  Clock, 
  Flame, 
  Moon, 
  Play, 
  Pause, 
  RotateCcw, 
  NotebookText, 
  UtensilsCrossed
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
    cancelSession, 
    finishSession,
    history,
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
  const [liveTime, setLiveTime] = useState("");

  // Live clock hook
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      let hrs = d.getHours();
      const mins = String(d.getMinutes()).padStart(2, '0');
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12 || 12;
      setLiveTime(`${hrs}:${mins} ${ampm}`);
    };
    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, []);

  // Sync horizontal selector triggers
  useEffect(() => {
    const today = new Date().getDay();
    const dayKey = today === 0 ? "day7" : `day${today}`;
    setSelectedDay(dayKey);
  }, []);

  // Listen to command palette day redirects
  useEffect(() => {
    const handleChangeDayTab = (e) => {
      if (e.detail?.dayKey) {
        setSelectedDay(e.detail.dayKey);
      }
    };
    window.addEventListener("changeDayTab", handleChangeDayTab);
    return () => window.removeEventListener("changeDayTab", handleChangeDayTab);
  }, []);

  // Router state syncs
  useEffect(() => {
    if (location.state && location.state.selectDayKey) {
      setSelectedDay(location.state.selectDayKey);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const activeWorkout = workouts[selectedDay] || { type: "Rest", exercises: [] };
  const totalExercises = activeWorkout.exercises ? activeWorkout.exercises.length : 0;
  const completedExercises = activeWorkout.exercises ? activeWorkout.exercises.filter(e => e.completed).length : 0;
  const progressPct = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  const formatElapsed = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getWorkoutColorName = (workoutType) => {
    const type = workoutType.toLowerCase();
    if (type.includes("push")) return "red";
    if (type.includes("pull")) return "blue";
    if (type.includes("leg")) return "green";
    if (type.includes("abs")) return "orange";
    return "white";
  };

  const getWorkoutColor = (workoutType) => {
    const type = workoutType.toLowerCase();
    if (type.includes("push")) return "var(--accent-push)";
    if (type.includes("pull")) return "var(--accent-blue)";
    if (type.includes("leg")) return "var(--accent-legs)";
    if (type.includes("abs")) return "var(--accent-orange)";
    return "var(--text-primary)";
  };

  const getProteinToday = () => {
    const today = new Date().getDay();
    const dayKey = today === 0 ? "day7" : `day${today}`;
    const dayDiet = diets[dayKey];
    if (!dayDiet) return 0;
    
    let total = 0;
    Object.keys(dayDiet.meals || {}).forEach((mealKey) => {
      dayDiet.meals[mealKey].forEach((item) => {
        total += (item.proteinPerServing || 0) * (item.quantity || 1);
      });
    });
    return total;
  };

  const proteinToday = getProteinToday();
  const proteinTarget = profile?.proteinTarget || 100;
  const isProteinAchieved = proteinToday >= proteinTarget;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="workout-split-layout"
    >
      {/* Left Sidebar Pane: Metric widgets, completed ring, circular rest controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Top metrics grids */}
        <div className="dashboard-grid">
          {/* Flame streak */}
          <div className="metric-card glow-orange" style={{ borderColor: "rgba(249, 115, 22, 0.15)" }}>
            <div className="metric-card-header">
              <span>Streak</span>
              <Flame size={16} color="var(--accent-abs)" />
            </div>
            <div className="metric-value">
              <span className="metric-value-dot">{profile?.streak?.current || 0}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginLeft: "4px" }}>days</span>
            </div>
          </div>

          {/* Active session clock timer */}
          <div className={`metric-card ${activeTimer ? "glow-red" : "glow-white"}`} style={{ borderColor: activeTimer ? "rgba(239, 68, 68, 0.25)" : "var(--border-color)" }}>
            <div className="metric-card-header">
              <span>Duration</span>
              <Clock size={16} color={activeTimer ? "var(--accent-push)" : "var(--text-secondary)"} />
            </div>
            {activeTimer && activeTimer.dayKey === selectedDay ? (
              <div className="metric-value" style={{ color: "var(--accent-push)" }}>
                <span className="metric-value-dot">{formatElapsed(activeTimer.elapsedSeconds)}</span>
              </div>
            ) : (
              <div className="metric-value" style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
                Idle
              </div>
            )}
          </div>

          {/* Protein target logs */}
          <div className={`metric-card ${isProteinAchieved ? "glow-green" : "glow-purple"}`} style={{ borderColor: isProteinAchieved ? "rgba(34, 197, 94, 0.3)" : "var(--border-color)" }}>
            <div className="metric-card-header">
              <span>Protein</span>
              <UtensilsCrossed size={16} color={isProteinAchieved ? "var(--accent-legs)" : "var(--accent-protein)"} />
            </div>
            <div className="metric-value">
              <span className="metric-value-dot">{proteinToday}</span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}> / {proteinTarget}g</span>
            </div>
          </div>

          {/* Clock tracker widget */}
          <div className="metric-card glow-white">
            <div className="metric-card-header">
              <span>Clock</span>
              <Clock size={16} color="var(--text-muted)" />
            </div>
            <div className="metric-value">
              <span className="metric-value-dot">{liveTime}</span>
            </div>
          </div>
        </div>

        {/* Circular SVG completed progress ring widget */}
        {totalExercises > 0 && (
          <div className={`progress-ring-card glow-${getWorkoutColorName(activeWorkout.type)}`}>
            <div className="circular-ring-container">
              <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="var(--border-color)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke={getWorkoutColor(activeWorkout.type)}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="314.16"
                  strokeDashoffset={314.16 - (progressPct / 100) * 314.16}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.35s ease-in-out" }}
                />
              </svg>
              <div className="ring-percent-text">{progressPct}%</div>
            </div>
            <div className="ring-sub-text">
              {completedExercises} of {totalExercises} exercises completed
            </div>
            {activeTimer && activeTimer.dayKey === selectedDay && (
              <div style={{ display: "flex", gap: "10px", marginTop: "16px", width: "100%" }}>
                {activeTimer.isPaused ? (
                  <button className="btn-premium-secondary" style={{ flex: 1, height: "40px" }} onClick={resumeSession}>
                    Resume
                  </button>
                ) : (
                  <button className="btn-premium-secondary" style={{ flex: 1, height: "40px" }} onClick={pauseSession}>
                    Pause
                  </button>
                )}
                <button className="btn-premium-primary" style={{ flex: 1, height: "40px", background: "var(--accent-push)", color: "#fff" }} onClick={finishSession}>
                  Finish
                </button>
              </div>
            )}
          </div>
        )}

        {/* Circular Rest Widget */}
        <div className="premium-rest-card glow-timer">
          <div className="rest-quick-pills">
            <button className="rest-pill-btn" onClick={() => startRest(60)}>60s</button>
            <button className="rest-pill-btn" onClick={() => startRest(90)}>90s</button>
            <button className="rest-pill-btn" onClick={() => startRest(120)}>120s</button>
          </div>

          <div className="rest-circle-wrapper">
            <svg width="100" height="100" style={{ transform: "rotate(-90deg)" }}>
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="var(--border-color)"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="var(--accent-timer)"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray="276.46"
                strokeDashoffset={restActive ? 276.46 - (restSeconds / restInitial) * 276.46 : 276.46}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="rest-time-text">
              {Math.floor(restSeconds / 60)}:{(restSeconds % 60).toString().padStart(2, "0")}
            </div>
          </div>

          <div className="rest-controls-row">
            {restActive ? (
              <button className="rest-ctrl-icon-btn" onClick={pauseRest} title="Pause rest">
                <Pause size={16} />
              </button>
            ) : (
              <button className="rest-ctrl-icon-btn" onClick={resumeRest} title="Start rest">
                <Play size={16} />
              </button>
            )}
            <button className="rest-ctrl-icon-btn" onClick={resetRest} title="Reset rest">
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* Right Sidebar Pane: Horizontal pills day selector, Exercise grid cards */}
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        
        {/* Horizontal Pills Segmented Day Selector */}
        <div className="segmented-pills-container">
          {DAYS_CONFIG.map((day) => (
            <button
              key={day.key}
              className={`segmented-pill-btn ${selectedDay === day.key ? "active" : ""}`}
              onClick={() => setSelectedDay(day.key)}
            >
              {selectedDay === day.key && (
                <motion.div 
                  layoutId="activePillTab" 
                  className="segmented-pill-active-bg" 
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span style={{ position: "relative", zIndex: 1 }}>{day.label}</span>
            </button>
          ))}
        </div>

        {/* Routine Title */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "800", letterSpacing: "-0.5px" }}>
            {activeWorkout.type}
          </h2>
          <span className="nothing-label" style={{ color: getWorkoutColor(activeWorkout.type) }}>
            {selectedDay === "day7" || activeWorkout.isRest ? "Rest day" : "Work day"}
          </span>
        </div>

        {/* Exercises Grid Panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {selectedDay === "day7" || activeWorkout.isRest ? (
              <div className="nothing-card glow-white" style={{ padding: "40px", textAlign: "center" }}>
                <Moon size={36} color="var(--text-muted)" style={{ marginBottom: "12px" }} />
                <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>Rest & Recovery</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "6px" }}>
                  Muscle grows during rest. Complete your protein intake, stretch, and recover.
                </div>
              </div>
            ) : (
              <div className="exercise-responsive-grid">
                {activeWorkout.exercises && activeWorkout.exercises.map((ex, index) => (
                  <ExercisePremiumCard
                    key={index}
                    exercise={ex}
                    index={index}
                    dayKey={selectedDay}
                    updateExercise={updateExercise}
                    historyLogs={history}
                    workoutColorName={getWorkoutColorName(activeWorkout.type)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </motion.div>
  );
}

// Exercise single item card component in grid mode
function ExercisePremiumCard({ exercise, index, dayKey, updateExercise, historyLogs, workoutColorName }) {
  const { startRest, prs } = usePlanner();
  const [weight, setWeight] = useState(exercise.weight || "");
  const [sets, setSets] = useState(exercise.sets || 0);
  const [reps, setReps] = useState(exercise.reps || "");
  const [notes, setNotes] = useState(exercise.notes || "");
  const [completed, setCompleted] = useState(exercise.completed || false);
  const [showNotes, setShowNotes] = useState(false);

  // Stats progression metrics
  const [prevLogs, setPrevLogs] = useState([]);
  const [smartSuggestion, setSmartSuggestion] = useState(null);

  useEffect(() => {
    setWeight(exercise.weight || "");
    setSets(exercise.sets || 0);
    setReps(exercise.reps || "");
    setNotes(exercise.notes || "");
    setCompleted(exercise.completed || false);
  }, [exercise]);

  // Compute smart weight advice
  useEffect(() => {
    if (historyLogs && historyLogs.length > 0) {
      const matchName = exercise.name.toLowerCase().trim();
      const matchLogs = [];

      const sortedHistory = [...historyLogs].sort((a,b) => a.id.localeCompare(b.id));
      sortedHistory.forEach((log) => {
        const found = log.exercises?.find((ex) => ex.name.toLowerCase().trim() === matchName && ex.completed);
        if (found) {
          matchLogs.push({
            date: log.date,
            weight: parseFloat(found.weight) || 0,
            reps: parseInt(found.reps) || 0,
            sets: parseInt(found.sets) || 0
          });
        }
      });

      const latestLogs = [...matchLogs].reverse().slice(0, 3);
      setPrevLogs(latestLogs);

      if (latestLogs.length > 0) {
        const last = latestLogs[0];
        const lastWeight = last.weight;
        const lastReps = last.reps;

        if (lastReps >= 10 && lastWeight > 0) {
          setSmartSuggestion({
            type: "increase",
            text: `Increase to ${lastWeight + 2.5}kg`
          });
        } else if (lastReps > 0 && lastReps < 6 && lastWeight > 0) {
          setSmartSuggestion({
            type: "reduce",
            text: "Focus form / reduce weight"
          });
        } else {
          setSmartSuggestion({
            type: "keep",
            text: "Keep current weight"
          });
        }
      } else {
        setSmartSuggestion(null);
      }
    }
  }, [historyLogs, exercise]);

  const handleBlur = (field, localVal) => {
    let saveVal = localVal;
    if (field === "sets") {
      saveVal = parseInt(localVal) || 0;
    }
    if (exercise[field] !== saveVal) {
      updateExercise(dayKey, index, { [field]: saveVal });
    }
  };

  const handleToggle = (checked) => {
    setCompleted(checked);
    updateExercise(dayKey, index, { completed: checked });
    if (checked) {
      startRest(90); // default 90s rest
    }
  };

  const sanitizedName = exercise.name.toLowerCase().trim();
  const currentPr = prs[sanitizedName];

  const getMuscleBadgeClass = (muscle) => {
    const m = (muscle || "").toLowerCase();
    if (m.includes("chest") || m.includes("tricep")) return "muscle-push";
    if (m.includes("back") || m.includes("bicep")) return "muscle-pull";
    if (m.includes("quad") || m.includes("hamstring") || m.includes("calf") || m.includes("leg")) return "muscle-legs";
    if (m.includes("abs")) return "muscle-abs";
    return "muscle-other";
  };

  return (
    <div className={`premium-exercise-card glow-${workoutColorName} ${completed ? "completed" : ""}`}>
      {/* Top row Info */}
      <div className="exercise-header-top">
        <div className="exercise-title-area">
          <div className="exercise-icon-box" style={{ borderColor: completed ? "var(--accent-success)" : "var(--border-color)" }}>
            <Dumbbell size={18} color={completed ? "var(--accent-success)" : "var(--text-primary)"} />
          </div>
          <div className="exercise-meta-box">
            <span style={{ fontSize: "0.95rem", fontWeight: "700" }}>{exercise.name}</span>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <span className={`exercise-badge-muscle ${getMuscleBadgeClass(exercise.muscleGroup)}`}>
                {exercise.muscleGroup || "Body"}
              </span>
              {currentPr && (
                <span className="pr-tag-unlocked" style={{ margin: 0, fontSize: "0.55rem" }}>
                  PR: {currentPr.highestWeight}kg
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions Complete & Notes Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button 
            className="header-action-btn" 
            style={{ color: notes ? "var(--accent-orange)" : "var(--text-secondary)", width: "30px", height: "30px" }}
            onClick={() => setShowNotes(!showNotes)}
            title="Toggle notes"
          >
            <NotebookText size={16} />
          </button>
          
          <div className="nothing-toggle">
            <label className="nothing-toggle-label">
              <input
                type="checkbox"
                checked={completed}
                onChange={(e) => handleToggle(e.target.checked)}
              />
              <span className="nothing-slider"></span>
            </label>
          </div>
        </div>
      </div>

      {/* Inputs Form Row */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", margin: "10px 0" }}>
        
        {/* Weight input box */}
        <div className="premium-input-box">
          <input
            type="text"
            className="premium-inner-input"
            value={weight}
            placeholder="0"
            onChange={(e) => setWeight(e.target.value)}
            onBlur={() => handleBlur("weight", weight)}
          />
          <span className="premium-input-unit">kg</span>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {/* Sets input box */}
          <div className="premium-input-box">
            <input
              type="number"
              className="premium-inner-input"
              value={sets}
              min="0"
              max="10"
              onChange={(e) => setSets(e.target.value)}
              onBlur={() => handleBlur("sets", sets)}
            />
            <span className="premium-input-unit">Sets</span>
          </div>

          {/* Reps input box */}
          <div className="premium-input-box">
            <input
              type="text"
              className="premium-inner-input"
              value={reps}
              placeholder="0"
              onChange={(e) => setReps(e.target.value)}
              onBlur={() => handleBlur("reps", reps)}
            />
            <span className="premium-input-unit">Reps</span>
          </div>
        </div>

      </div>

      {/* Progression details footer */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {smartSuggestion && (
          <div className={`exercise-suggest-badge ${smartSuggestion.type}`} style={{ width: "fit-content" }}>
            <span>💡</span> {smartSuggestion.text}
          </div>
        )}
        
        {prevLogs.length > 0 && (
          <div className="exercise-previous-readout" style={{ fontSize: "0.65rem" }}>
            Prev: {prevLogs.map((l) => `${l.weight}kg × ${l.reps}`).join(", ")}
          </div>
        )}
      </div>

      {/* Notes Textarea expander */}
      {showNotes && (
        <div style={{ marginTop: "10px" }}>
          <textarea
            className="nothing-input"
            style={{ height: "45px", fontSize: "0.8rem", padding: "6px 10px", fontFamily: "var(--font-sans)", resize: "none", backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)" }}
            placeholder="Enter training notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => handleBlur("notes", notes)}
          />
        </div>
      )}
    </div>
  );
}
