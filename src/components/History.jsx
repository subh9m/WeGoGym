import React, { useState, useEffect } from "react";
import { usePlanner } from "../contexts/PlannerContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Dumbbell, 
  TrendingUp, 
  ChevronRight, 
  X, 
  Flame, 
  Trophy, 
  CalendarDays,
  Activity
} from "lucide-react";

export default function History() {
  const { history, prs, profile } = usePlanner();
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [drawerLog, setDrawerLog] = useState(null);
  const [yearOptions, setYearOptions] = useState([]);

  useEffect(() => {
    const yearsSet = new Set([new Date().getFullYear()]);
    (history || []).forEach((log) => {
      if (log.date) {
        const y = parseInt(log.date.split("-")[0]);
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    setYearOptions([...yearsSet].sort((a,b) => b - a));
  }, [history]);

  const getSessionVolume = (exercises) => {
    return (exercises || []).reduce((acc, ex) => {
      const w = parseFloat(ex.weight) || 0;
      const s = parseInt(ex.sets) || 0;
      const r = parseInt(ex.reps) || 0;
      return acc + (w * s * r);
    }, 0);
  };

  const formatReadableDate = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const totalWorkoutDays = (history || []).length;
  const currentStreak = profile?.streak?.current || 0;
  const longestStreak = profile?.streak?.longest || 0;

  // Calculate total volume across all history
  let totalVolumeKg = 0;
  (history || []).forEach((log) => {
    totalVolumeKg += getSessionVolume(log.exercises || []);
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.25 }}
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* 1. Top Statistics Summary Cards */}
      <div className="dashboard-grid">
        <div className="metric-card" style={{ borderLeft: "4px solid var(--accent-abs)" }}>
          <div className="metric-card-header">
            <span>Current Streak</span>
            <Flame size={16} color="var(--accent-abs)" />
          </div>
          <div className="metric-value">
            <span className="metric-value-dot">🔥 {currentStreak}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginLeft: "4px" }}>days</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid var(--accent-pr)" }}>
          <div className="metric-card-header">
            <span>Longest Streak</span>
            <Trophy size={16} color="var(--accent-pr)" />
          </div>
          <div className="metric-value">
            <span className="metric-value-dot">{longestStreak}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginLeft: "4px" }}>days best</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid var(--accent-success)" }}>
          <div className="metric-card-header">
            <span>Total Sessions</span>
            <CalendarDays size={16} color="var(--accent-success)" />
          </div>
          <div className="metric-value">
            <span className="metric-value-dot">{totalWorkoutDays}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginLeft: "4px" }}>workouts</span>
          </div>
        </div>

        <div className="metric-card" style={{ borderLeft: "4px solid var(--accent-pull)" }}>
          <div className="metric-card-header">
            <span>Total Volume</span>
            <TrendingUp size={16} color="var(--accent-pull)" />
          </div>
          <div className="metric-value">
            <span className="metric-value-dot">{Math.round(totalVolumeKg)}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginLeft: "4px" }}>kg lifted</span>
          </div>
        </div>
      </div>

      {/* 2. LeetCode Activity Heatmap Card */}
      <div className="heatmap-container">
        <div className="nothing-card-header" style={{ marginBottom: "16px" }}>
          <span className="nothing-title">
            <Activity size={18} color="var(--accent-legs)" /> Activity Heatmap
          </span>

          <select 
            className="premium-input-box"
            style={{ width: "auto", height: "38px", background: "var(--bg-secondary)", padding: "0 12px", fontSize: "0.8rem", fontWeight: "700" }}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="heatmap-wrapper">
          <div className="heatmap-scroll-area">
            {/* Heatmap Grid Matrix */}
            <div className="heatmap-grid-core">
              {Array.from({ length: 371 }).map((_, idx) => {
                const level = (history || []).length > 0 && idx % 7 === 0 ? 3 : (history || []).length > 0 && idx % 11 === 0 ? 1 : 0;
                return (
                  <div 
                    key={idx} 
                    className={`heatmap-cell level-${level}`}
                    title={`Day ${idx + 1}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Timeline History Log Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "800" }}>
          Past Workout Logs ({history.length})
        </h2>

        {history && history.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {history.map((log) => {
              const sessionVol = getSessionVolume(log.exercises || []);

              return (
                <motion.div
                  key={log.id}
                  className="nothing-card"
                  whileHover={{ y: -2 }}
                  style={{ cursor: "pointer", padding: "20px" }}
                  onClick={() => setDrawerLog(log)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.1rem", fontWeight: "800" }}>{log.dayName} Workout</span>
                        <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.12)", color: "var(--accent-pull)", fontWeight: "700" }}>
                          {log.routineType || "Split Routine"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                        {formatReadableDate(log.date)} • {log.durationMinutes} mins duration
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: "900", fontFamily: "var(--font-mono)", color: "var(--accent-protein)" }}>
                          {sessionVol}kg
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700" }}>
                          {log.completedCount} exercises
                        </div>
                      </div>
                      <ChevronRight size={20} color="var(--text-secondary)" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="nothing-card" style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            No past workout logs recorded yet. Start a session from the Workout tab!
          </div>
        )}
      </div>

      {/* 4. Slide-Over Detail Drawer */}
      {drawerLog && (
        <div className="drawer-overlay" onClick={() => setDrawerLog(null)}>
          <div className="right-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: "800" }}>{drawerLog.dayName} Log Summary</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{formatReadableDate(drawerLog.date)}</span>
              </div>
              <button className="header-action-btn" onClick={() => setDrawerLog(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                <div className="metric-card">
                  <span className="nothing-label">Duration</span>
                  <div className="metric-value">{drawerLog.durationMinutes} mins</div>
                </div>
                <div className="metric-card">
                  <span className="nothing-label">Total Volume</span>
                  <div className="metric-value">{getSessionVolume(drawerLog.exercises || [])}kg</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: "0.95rem", fontWeight: "800", marginBottom: "10px" }}>Completed Lifts</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(drawerLog.exercises || []).filter(e => e.completed).map((ex, idx) => (
                    <div key={idx} style={{ padding: "12px", background: "var(--bg-secondary)", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: "800", fontSize: "0.9rem" }}>{ex.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{ex.sets} sets × {ex.reps} reps</div>
                      </div>
                      <div style={{ fontWeight: "900", fontFamily: "var(--font-mono)" }}>{ex.weight}kg</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
