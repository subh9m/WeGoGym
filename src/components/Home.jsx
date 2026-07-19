import React, { useState, useEffect } from "react";
import { usePlanner } from "../contexts/PlannerContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Dumbbell, 
  Flame, 
  Trophy, 
  UtensilsCrossed, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Clock, 
  CalendarDays,
  Sparkles,
  Zap
} from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const { profile, workouts, activeTimer, history, prs, diets } = usePlanner();
  const [greeting, setGreeting] = useState("Good Day");

  useEffect(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting("Good Morning");
    else if (hrs < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // Compute Today's workout routine
  const todayIndex = new Date().getDay();
  const todayDayKey = todayIndex === 0 ? "day7" : `day${todayIndex}`;
  const todayWorkout = workouts[todayDayKey] || { type: "Rest", exercises: [] };
  const totalExercises = todayWorkout.exercises ? todayWorkout.exercises.length : 0;
  const completedExercises = todayWorkout.exercises ? todayWorkout.exercises.filter(e => e.completed).length : 0;
  const isWorkoutCompleted = totalExercises > 0 && completedExercises === totalExercises;
  const workoutProgressPct = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  // Compute Today's nutrition metrics
  const dayDiet = diets[todayDayKey] || { meals: { breakfast: [], lunch: [], snacks: [], dinner: [] } };
  let proteinToday = 0;
  Object.keys(dayDiet.meals || {}).forEach((mealKey) => {
    (dayDiet.meals[mealKey] || []).forEach((item) => {
      proteinToday += (item.proteinPerServing || 0) * (item.quantity || 1);
    });
  });

  const proteinTarget = profile?.proteinTarget || 100;
  const proteinProgressPct = Math.min(100, Math.round((proteinToday / proteinTarget) * 100));
  const estimatedCalories = Math.round(proteinToday * 4 + 1200); // Friendly estimated daily calorie total

  // Highest recent PR highlight
  const prKeys = Object.keys(prs || {});
  const topPrKey = prKeys.length > 0 ? prKeys[0] : null;
  const topPr = topPrKey ? prs[topPrKey] : null;

  const userName = profile?.name || "Athlete";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.25 }}
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* 1. Top Greeting Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "900", letterSpacing: "-0.5px" }}>
            {greeting}, {userName} 👋
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "2px" }}>
            {todayWorkout.isRest || todayDayKey === "day7" 
              ? "Rest day. Focus on recovery and hitting your protein goal." 
              : `Ready for your ${todayWorkout.type} workout today?`}
          </p>
        </div>
        <button 
          className="header-action-btn" 
          onClick={() => navigate("/profile")}
          title="View profile settings"
          style={{ width: "44px", height: "44px" }}
        >
          <Zap size={20} color="var(--accent-pull)" />
        </button>
      </div>

      {/* 2. Today's Workout Hero Card */}
      <div className="nothing-card" style={{ background: "linear-gradient(135deg, var(--bg-card), var(--bg-secondary))", borderColor: activeTimer ? "var(--accent-push)" : "var(--border-color)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <span className="nothing-label" style={{ color: "var(--accent-pull)", display: "flex", alignItems: "center", gap: "6px" }}>
              <Dumbbell size={14} /> Today's Routine
            </span>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "800", marginTop: "4px" }}>
              {todayWorkout.type || "Rest & Recovery"}
            </h2>
          </div>

          <div style={{ background: "rgba(99, 102, 241, 0.12)", color: "var(--accent-pull)", padding: "6px 14px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "700" }}>
            {totalExercises} Exercises
          </div>
        </div>

        {/* Progress Bar & Actions */}
        {totalExercises > 0 ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: "600" }}>
              <span>{completedExercises} of {totalExercises} Lifts Completed</span>
              <span>{workoutProgressPct}%</span>
            </div>
            <div style={{ width: "100%", height: "8px", background: "var(--bg-secondary)", borderRadius: "4px", overflow: "hidden", marginBottom: "20px" }}>
              <div 
                style={{ 
                  width: `${workoutProgressPct}%`, 
                  height: "100%", 
                  background: isWorkoutCompleted ? "var(--accent-success)" : "linear-gradient(90deg, var(--accent-pull), var(--accent-protein))",
                  transition: "width 0.4s ease-out" 
                }} 
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                className="btn-premium-primary" 
                style={{ flex: 1, minHeight: "50px" }}
                onClick={() => navigate("/workout")}
              >
                {activeTimer ? (
                  <>
                    <Clock size={18} /> Continue Workout
                  </>
                ) : (
                  <>
                    <Play size={18} /> {isWorkoutCompleted ? "View Completed Workout" : "Start Today's Workout"}
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
              No lifts scheduled today. Take a walk or stretch.
            </span>
            <button className="btn-premium-secondary" style={{ padding: "0 18px", minHeight: "44px" }} onClick={() => navigate("/workout")}>
              View Split <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 3. Streaks & PR Quick Highlights */}
      <div className="dashboard-grid">
        <div className="metric-card" style={{ borderLeft: "4px solid var(--accent-abs)" }}>
          <div className="metric-card-header">
            <span>Current Streak</span>
            <Flame size={18} color="var(--accent-abs)" />
          </div>
          <div className="metric-value">
            <span className="metric-value-dot">🔥 {profile?.streak?.current || 0}</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginLeft: "6px" }}>days streak</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid var(--accent-protein)" }}>
          <div className="metric-card-header">
            <span>Top Record</span>
            <Trophy size={18} color="var(--accent-protein)" />
          </div>
          <div className="metric-value">
            {topPr ? (
              <div>
                <span className="metric-value-dot">{topPr.highestWeight}kg</span>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "capitalize", fontWeight: "600" }}>
                  {topPr.exerciseName}
                </div>
              </div>
            ) : (
              <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: "600" }}>No PRs logged</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Daily Nutrition & Protein Progress Card */}
      <div className="nothing-card">
        <div className="nothing-card-header">
          <span className="nothing-title">
            <UtensilsCrossed size={18} color="var(--accent-protein)" /> Daily Nutrition Summary
          </span>
          <button className="header-action-btn" onClick={() => navigate("/diet")} title="Open Diet Tracker">
            <ArrowRight size={16} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div className="circular-ring-container" style={{ width: "110px", height: "110px", flexShrink: 0 }}>
              <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="55" cy="55" r="46" stroke="var(--bg-secondary)" strokeWidth="8" fill="transparent" />
                <circle
                  cx="55"
                  cy="55"
                  r="46"
                  stroke="var(--accent-protein)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="289"
                  strokeDashoffset={289 - (proteinProgressPct / 100) * 289}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.4s ease-out" }}
                />
              </svg>
              <div className="ring-percent-text" style={{ fontSize: "1.4rem" }}>{proteinProgressPct}%</div>
            </div>

            <div>
              <div style={{ fontSize: "1.4rem", fontWeight: "900" }}>
                {proteinToday}g <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: "600" }}>/ {proteinTarget}g</span>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "2px", fontWeight: "600" }}>
                Protein Consumed
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--accent-success)", marginTop: "6px", fontWeight: "700" }}>
                ~{estimatedCalories} kcal estimated
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ background: "var(--bg-secondary)", padding: "12px 16px", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "600" }}>Breakfast</span>
              <span style={{ fontWeight: "800", fontSize: "0.9rem" }}>{(dayDiet.meals?.breakfast || []).length} items</span>
            </div>
            <div style={{ background: "var(--bg-secondary)", padding: "12px 16px", borderRadius: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: "600" }}>Lunch</span>
              <span style={{ fontWeight: "800", fontSize: "0.9rem" }}>{(dayDiet.meals?.lunch || []).length} items</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Recent History Logs Shortcut */}
      <div className="nothing-card">
        <div className="nothing-card-header">
          <span className="nothing-title">
            <CalendarDays size={18} color="var(--accent-history)" /> Recent Activity
          </span>
          <button className="btn-premium-secondary" style={{ padding: "0 14px", minHeight: "36px", fontSize: "0.8rem" }} onClick={() => navigate("/history")}>
            View All Logs
          </button>
        </div>

        {history && history.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {history.slice(0, 2).map((log) => (
              <div 
                key={log.id}
                style={{
                  display: "flex",
                  justify: "space-between",
                  alignItems: "center",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                  cursor: "pointer"
                }}
                onClick={() => navigate("/history")}
              >
                <div>
                  <div style={{ fontWeight: "800", fontSize: "0.95rem" }}>{log.dayName} Split</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    {log.date} • {log.durationMinutes} mins • {log.completedCount} lifts
                  </div>
                </div>
                <CheckCircle2 size={20} color="var(--accent-success)" />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "0.85rem", fontFamily: "var(--font-mono)" }}>
            No recent workout logs recorded yet.
          </div>
        )}
      </div>

    </motion.div>
  );
}
