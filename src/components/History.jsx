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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.25 }}
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* Top 4 Dashboard Stat Metrics Cards */}
      <div className="dashboard-grid">
        <div className="metric-card glow-orange" style={{ borderColor: "rgba(249, 115, 22, 0.2)" }}>
          <div className="metric-card-header">
            <span>Current Streak</span>
            <Flame size={16} color="var(--accent-abs)" />
          </div>
          <div className="metric-value">
            <span className="metric-value-dot">{currentStreak}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginLeft: "4px" }}>days</span>
          </div>
        </div>

        <div className="metric-card glow-white">
          <div className="metric-card-header">
            <span>Longest Streak</span>
            <Trophy size={16} color="var(--accent-history)" />
          </div>
          <div className="metric-value">
            <span className="metric-value-dot">{longestStreak}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginLeft: "4px" }}>days</span>
          </div>
        </div>

        <div className="metric-card glow-green">
          <div className="metric-card-header">
            <span>Active Days</span>
            <CalendarDays size={16} color="var(--accent-legs)" />
          </div>
          <div className="metric-value">
            <span className="metric-value-dot">{totalWorkoutDays}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginLeft: "4px" }}>days</span>
          </div>
        </div>

        <div className="metric-card glow-blue">
          <div className="metric-card-header">
            <span>Total Workouts</span>
            <Dumbbell size={16} color="var(--accent-blue)" />
          </div>
          <div className="metric-value">
            <span className="metric-value-dot">{totalWorkoutDays}</span>
            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginLeft: "4px" }}>sessions</span>
          </div>
        </div>
      </div>

      {/* LeetCode Activity Heatmap Card */}
      <div className="heatmap-container glow-white">
        <div className="nothing-card-header" style={{ marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <span className="nothing-title">
            <Activity size={18} /> Workout Activity Heatmap
          </span>

          <select 
            className="premium-input-box"
            style={{ width: "auto", height: "36px", background: "var(--bg-secondary)", padding: "0 12px", fontSize: "0.8rem", fontWeight: "700" }}
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

      {/* Timeline Workout Log Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="nothing-card-header" style={{ marginBottom: "0" }}>
          <span className="nothing-title">Workout Logs ({history.length})</span>
          <span className="nothing-label">Session Archives</span>
        </div>

        {history && history.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {history.map((log) => {
              const sessionVol = getSessionVolume(log.exercises || []);

              return (
                <motion.div
                  key={log.id}
                  className="nothing-card glow-white"
                  whileHover={{ y: -2 }}
                  style={{ cursor: "pointer", padding: "20px" }}
                  onClick={() => setDrawerLog(log)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.1rem", fontWeight: "800" }}>{log.dayName} Workout</span>
                        <span className="exercise-badge-muscle muscle-push" style={{ fontSize: "0.65rem" }}>
                          {log.routineType || "Split Routine"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                        {formatReadableDate(log.date)} • {log.durationMinutes} mins duration
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: "800", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                          {sessionVol}kg
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "600" }}>
                          {log.completedCount} exercises
                        </div>
                      </div>
                      <ChevronRight size={18} color="var(--text-secondary)" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="nothing-card" style={{ textAlign: "center", padding: "40px 20px" }}>
            <span className="nothing-label">No History Yet</span>
            <div style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginTop: "6px" }}>
              Complete your first workout session to view logged history & statistics!
            </div>
          </div>
        )}
      </div>

      {/* Slide-Over Right Drawer Panel */}
      {drawerLog && (
        <div className="drawer-overlay" onClick={() => setDrawerLog(null)}>
          <div className="right-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h3 className="nothing-title" style={{ fontSize: "1.2rem" }}>{drawerLog.dayName} Log Details</h3>
                <span className="nothing-label">{formatReadableDate(drawerLog.date)}</span>
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
                  <span className="nothing-label">Session Volume</span>
                  <div className="metric-value">{getSessionVolume(drawerLog.exercises || [])}kg</div>
                </div>
              </div>

              <div>
                <span className="nothing-label" style={{ marginBottom: "8px", display: "block" }}>Lifting Log Entries</span>
                <div style={{ border: "1px solid var(--border-color)", borderRadius: "12px", overflowX: "auto", width: "100%", WebkitOverflowScrolling: "touch" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
                        <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--text-secondary)" }}>Exercise</th>
                        <th style={{ padding: "10px 14px", textAlign: "right", color: "var(--text-secondary)" }}>Weight</th>
                        <th style={{ padding: "10px 14px", textAlign: "right", color: "var(--text-secondary)" }}>Sets</th>
                        <th style={{ padding: "10px 14px", textAlign: "right", color: "var(--text-secondary)" }}>Reps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(drawerLog.exercises || []).filter(ex => ex.completed).map((ex, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                          <td style={{ padding: "10px 14px" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: "700" }}>{ex.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{ex.weight}kg</td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{ex.sets}</td>
                          <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{ex.reps}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
