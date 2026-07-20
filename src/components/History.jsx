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
  ChevronRight,
  Trash2
} from "lucide-react";

export default function History() {
  const { history, profile, deleteHistoryLog } = usePlanner();
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

  const handleDeleteLog = async (logId) => {
    if (window.confirm("Are you sure you want to delete this workout history record?")) {
      await deleteHistoryLog(logId);
      setDrawerLog(null);
    }
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
            <span>Filter Year</span>
            <Activity size={16} color="var(--accent-blue)" />
          </div>
          <div className="metric-value" style={{ marginTop: "4px" }}>
            <select
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-primary)",
                fontFamily: "var(--font-dot)",
                fontSize: "1.4rem",
                fontWeight: "900",
                cursor: "pointer",
                outline: "none"
              }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {yearOptions.map(y => (
                <option key={y} value={y} style={{ background: "var(--bg-card)", color: "var(--text-primary)" }}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Automated History Logs List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div className="nothing-card-header">
          <span className="nothing-title">Automated Workout History Logs</span>
          <span className="nothing-label">Generated on Session Completion</span>
        </div>

        {(history || []).length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {history.map((log) => {
              const totalVol = log.totalVolume || getSessionVolume(log.exercises || []);
              const readableDate = formatReadableDate(log.date);

              return (
                <motion.div 
                  key={log.id}
                  className="nothing-card glow-white"
                  style={{ cursor: "pointer", padding: "16px 20px" }}
                  whileHover={{ x: 4 }}
                  onClick={() => setDrawerLog(log)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div className="exercise-icon-box" style={{ width: "42px", height: "42px", color: "var(--accent-push)" }}>
                        <Dumbbell size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: "1.05rem", fontWeight: "800" }}>
                          {log.dayName || "Workout"} Session
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                          {readableDate} • {log.startTime || ""} — {log.durationMinutes} mins
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontWeight: "800", color: "var(--accent-push)", fontSize: "1.1rem" }}>
                          {totalVol} kg
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                          {log.completedCount || 0} Ex • {log.completedSets || 0} Sets
                        </div>
                      </div>

                      <ChevronRight size={18} color="var(--text-muted)" />
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
              Complete your first workout session to view automatically logged history & statistics!
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
              
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button 
                  className="icon-action-btn delete-btn" 
                  onClick={() => handleDeleteLog(drawerLog.id)}
                  title="Delete History Log"
                  style={{ width: "32px", height: "32px" }}
                >
                  <Trash2 size={14} />
                </button>
                
                <button className="header-action-btn" onClick={() => setDrawerLog(null)}>
                  <X size={18} />
                </button>
              </div>
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
