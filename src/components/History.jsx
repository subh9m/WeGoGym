import React, { useState, useEffect } from "react";
import { usePlanner } from "../contexts/PlannerContext";
import { motion } from "framer-motion";
import { 
  Dumbbell, 
  X, 
  Flame, 
  Trophy, 
  CalendarDays,
  Activity,
  CheckCircle2,
  Zap,
  ChevronRight
} from "lucide-react";

export default function History() {
  const { history, profile } = usePlanner();
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
      if (ex.volume !== undefined) return acc + ex.volume;
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
              const sessionVol = log.totalVolume || getSessionVolume(log.exercises || []);

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
                        {log.prsAchieved && log.prsAchieved.length > 0 && (
                          <span style={{ background: "rgba(236, 72, 153, 0.15)", color: "var(--accent-pr)", border: "1px solid var(--accent-pr)", padding: "2px 8px", borderRadius: "10px", fontSize: "0.65rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            🏆 PR Unlocked
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                        {formatReadableDate(log.date)} • {log.durationMinutes} mins duration • {log.estimatedCalories || 0} kcal
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "1.1rem", fontWeight: "800", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                          {sessionVol}kg
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "600" }}>
                          {log.completedCount || 0} exercises • {log.completedSets || 0} sets
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

      {/* Slide-Over Right Drawer Panel with Per-Set Breakdown */}
      {drawerLog && (
        <div className="drawer-overlay" onClick={() => setDrawerLog(null)}>
          <div className="right-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h3 className="nothing-title" style={{ fontSize: "1.2rem" }}>{drawerLog.dayName} Workout Details</h3>
                <span className="nothing-label">{formatReadableDate(drawerLog.date)} • {drawerLog.startTime || ""}</span>
              </div>
              <button className="header-action-btn" onClick={() => setDrawerLog(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="drawer-body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* 4 Summary Stat Widgets */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                <div className="metric-card">
                  <span className="nothing-label" style={{ fontSize: "0.6rem" }}>DURATION</span>
                  <div className="metric-value" style={{ fontSize: "1.2rem" }}>{drawerLog.durationMinutes} mins</div>
                </div>

                <div className="metric-card">
                  <span className="nothing-label" style={{ fontSize: "0.6rem" }}>TOTAL VOLUME</span>
                  <div className="metric-value" style={{ fontSize: "1.2rem", color: "var(--accent-push)" }}>
                    {drawerLog.totalVolume || getSessionVolume(drawerLog.exercises || [])}kg
                  </div>
                </div>

                <div className="metric-card">
                  <span className="nothing-label" style={{ fontSize: "0.6rem" }}>EST. CALORIES</span>
                  <div className="metric-value" style={{ fontSize: "1.2rem", color: "var(--accent-abs)" }}>
                    {drawerLog.estimatedCalories || 0} kcal
                  </div>
                </div>

                <div className="metric-card">
                  <span className="nothing-label" style={{ fontSize: "0.6rem" }}>COMPLETED SETS</span>
                  <div className="metric-value" style={{ fontSize: "1.2rem", color: "var(--accent-legs)" }}>
                    {drawerLog.completedSets || 0} sets
                  </div>
                </div>
              </div>

              {/* PRs Achieved Badge Alert */}
              {drawerLog.prsAchieved && drawerLog.prsAchieved.length > 0 && (
                <div style={{ background: "rgba(236, 72, 153, 0.1)", border: "1px solid var(--accent-pr)", padding: "12px 14px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Trophy size={18} color="var(--accent-pr)" />
                  <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: "600" }}>
                    Personal Records Unlocked: <strong style={{ color: "var(--accent-pr)" }}>{drawerLog.prsAchieved.join(", ")}</strong>
                  </div>
                </div>
              )}

              {/* Detailed Exercises & Per-Set Tables */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <span className="nothing-label" style={{ fontSize: "0.75rem" }}>PER-SET LOGGING BREAKDOWN</span>

                {(drawerLog.exercises || []).map((ex, exIdx) => {
                  const setsList = Array.isArray(ex.setsList) && ex.setsList.length > 0 
                    ? ex.setsList 
                    : Array.from({ length: ex.sets || 3 }).map((_, i) => ({ setNum: i + 1, weight: ex.weight || 0, reps: ex.reps || 0, completed: ex.completed }));

                  return (
                    <div key={exIdx} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: "800", fontSize: "0.95rem" }}>{ex.name}</span>
                          <span className={`exercise-badge-muscle muscle-${ex.muscle || "push"}`} style={{ fontSize: "0.6rem" }}>
                            {ex.muscle || "General"}
                          </span>
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "700" }}>
                          Vol: {ex.volume || 0}kg
                        </span>
                      </div>

                      <div style={{ border: "1px solid var(--border-color)", borderRadius: "10px", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                          <thead>
                            <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: "0.65rem", fontFamily: "var(--font-mono)" }}>
                              <th style={{ padding: "8px 12px", textAlign: "left" }}>SET #</th>
                              <th style={{ padding: "8px 12px", textAlign: "right" }}>WEIGHT</th>
                              <th style={{ padding: "8px 12px", textAlign: "right" }}>REPS</th>
                              <th style={{ padding: "8px 12px", textAlign: "center" }}>STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {setsList.map((s, sIdx) => (
                              <tr key={sIdx} style={{ borderBottom: sIdx < setsList.length - 1 ? "1px solid var(--border-color)" : "none", background: s.completed ? "rgba(34, 197, 94, 0.05)" : "transparent" }}>
                                <td style={{ padding: "8px 12px", fontWeight: "700", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                                  Set {s.setNum || sIdx + 1}
                                </td>
                                <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{s.weight} kg</td>
                                <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "var(--font-mono)" }}>{s.reps}</td>
                                <td style={{ padding: "8px 12px", textAlign: "center" }}>
                                  {s.completed ? (
                                    <CheckCircle2 size={14} color="var(--accent-success)" style={{ margin: "0 auto" }} />
                                  ) : (
                                    <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
