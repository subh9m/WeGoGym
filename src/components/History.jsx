import React, { useState, useEffect, useMemo } from "react";
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
  Trash2,
  Utensils,
  Award,
  Sparkles,
  Info
} from "lucide-react";

export default function History() {
  const { history, diets, profile, deleteHistoryLog } = usePlanner();
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  
  // Selected Day Details for Drawer (Desktop) & Bottom Sheet (Mobile)
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);
  const [yearOptions, setYearOptions] = useState([]);

  const proteinTarget = profile?.proteinTarget || 100;

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

  // Helper to format date string YYYY-MM-DD
  const getFormattedDate = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Generate 52 Weeks Heatmap Grid Data grouped into 12 Month Blocks
  const heatmapMonthBlocks = useMemo(() => {
    const today = new Date();
    
    // Create map of history logs keyed by YYYY-MM-DD
    const historyMap = {};
    (history || []).forEach((log) => {
      if (log.date) {
        historyMap[log.date] = log;
      }
    });

    const monthMap = new Map();

    // Generate last 364 days
    for (let i = 363; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const dateStr = getFormattedDate(d);
      
      const yearMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = d.toLocaleDateString("en-US", { month: "short" });

      if (!monthMap.has(yearMonthKey)) {
        monthMap.set(yearMonthKey, {
          yearMonthKey,
          monthLabel,
          days: []
        });
      }

      const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon...
      const rowIndex = (dayOfWeek + 6) % 7; // Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
      const dayKey = dayOfWeek === 0 ? "day7" : `day${dayOfWeek}`;
      
      const historyLog = historyMap[dateStr] || null;
      const dayDiet = diets[dateStr] || diets[dayKey] || null;

      // Calculate total protein consumed for that date
      let proteinVal = 0;
      let mealsList = { breakfast: [], lunch: [], snacks: [], dinner: [] };
      if (dayDiet && dayDiet.meals) {
        mealsList = dayDiet.meals;
        Object.keys(dayDiet.meals).forEach((mKey) => {
          (dayDiet.meals[mKey] || []).forEach((item) => {
            proteinVal += (parseInt(item.proteinPerServing ?? item.protein) || 0) * (parseInt(item.quantity) || 1);
          });
        });
      }

      const hasWorkout = Boolean(historyLog);
      const isProteinGoalMet = proteinVal >= proteinTarget;
      const hasPR = Boolean(historyLog?.prsAchieved?.length > 0);

      // Determine 5-Level Dynamic Heatmap Color
      let level = "level-0"; // No Activity
      if (hasWorkout && isProteinGoalMet && hasPR) {
        level = "level-gold"; // Gold Highlight (Workout + Protein + PR)
      } else if (hasWorkout && isProteinGoalMet) {
        level = "level-both"; // Bright Purple (Workout + Protein)
      } else if (hasWorkout && !isProteinGoalMet) {
        level = "level-workout"; // Green Glow (Workout Only)
      } else if (!hasWorkout && isProteinGoalMet) {
        level = "level-protein"; // Blue Glow (Protein Only)
      }

      monthMap.get(yearMonthKey).days.push({
        dateObj: d,
        dateStr,
        dayKey,
        rowIndex,
        historyLog,
        mealsList,
        proteinVal,
        isProteinGoalMet,
        hasWorkout,
        hasPR,
        level
      });
    }

    // Format days into week columns for each month block
    const blocks = [];
    monthMap.forEach((monthData) => {
      const days = monthData.days;
      const columns = [];
      let currentColumn = new Array(7).fill(null);

      days.forEach((dayItem) => {
        if (dayItem.rowIndex === 0 && currentColumn.some(x => x !== null)) {
          columns.push(currentColumn);
          currentColumn = new Array(7).fill(null);
        }
        currentColumn[dayItem.rowIndex] = dayItem;
      });

      if (currentColumn.some(x => x !== null)) {
        columns.push(currentColumn);
      }

      blocks.push({
        monthLabel: monthData.monthLabel,
        columns
      });
    });

    return blocks;
  }, [history, diets, proteinTarget]);

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
    const parts = dateStr.split("-");
    if (parts.length < 3) return dateStr;
    const [y, m, d] = parts;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm("Are you sure you want to delete this workout history record?")) {
      await deleteHistoryLog(logId);
      setSelectedDayDetails(null);
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

      {/* GitHub / LeetCode Style Interactive Contribution Heatmap Card */}
      <div className="heatmap-container">
        {/* Top Header Submissions & Meta Stats Row (Matching LeetCode Header) */}
        <div className="heatmap-header-stats-row">
          <div className="heatmap-sub-count">
            <span className="heatmap-sub-count-num">{(history || []).length}</span>
            <span>submissions in the past one year</span>
            <Info size={14} color="var(--text-muted)" style={{ cursor: "pointer" }} title="Tracked workouts and daily protein targets over the past 365 days" />
          </div>

          <div className="heatmap-stats-meta">
            <div className="heatmap-stat-item">
              <span>Total active days:</span>
              <span className="heatmap-stat-val">{totalWorkoutDays}</span>
            </div>
            <div className="heatmap-stat-item">
              <span>Max streak:</span>
              <span className="heatmap-stat-val">{longestStreak}</span>
            </div>

            {/* Color Legend Badges */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.7rem", color: "var(--text-secondary)", marginLeft: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#18181b", border: "1px solid #27272a" }} />
                <span>None</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#166534", border: "1px solid #22c55e" }} />
                <span>Workout</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#1e40af", border: "1px solid #3b82f6" }} />
                <span>Protein</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#6b21a8", border: "1px solid #a855f7" }} />
                <span>Both</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#b45309", border: "1px solid #f59e0b", boxShadow: "0 0 6px rgba(245,158,11,0.8)" }} />
                <span>PR</span>
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap Main Container with Weekday Initials Column & Month Blocks */}
        <div className="heatmap-main-container">
          {/* Left Weekday Initials Column */}
          <div className="heatmap-weekday-initials-col">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
            <span>S</span>
          </div>

          {/* Right Scrollable Month Blocks Wrapper */}
          <div className="heatmap-scroll-area">
            {heatmapMonthBlocks.map((block, bIdx) => (
              <div key={bIdx} className="heatmap-month-block">
                <div className="heatmap-month-columns-grid">
                  {block.columns.map((col, cIdx) => (
                    <div key={cIdx} className="heatmap-week-column">
                      {col.map((dayItem, rIdx) => {
                        if (!dayItem) {
                          return <div key={rIdx} className="heatmap-cell invisible" />;
                        }
                        return (
                          <div
                            key={rIdx}
                            title={`${dayItem.dateStr}: ${dayItem.hasWorkout ? dayItem.historyLog.dayName : "No Workout"}, ${dayItem.proteinVal}g Protein`}
                            onClick={() => setSelectedDayDetails(dayItem)}
                            className={`heatmap-cell ${dayItem.level}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="heatmap-month-label">{block.monthLabel}</div>
              </div>
            ))}
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
                  onClick={() => {
                    setSelectedDayDetails({
                      dateStr: log.date,
                      historyLog: log,
                      mealsList: diets[log.date]?.meals || { breakfast: [], lunch: [], snacks: [], dinner: [] },
                      proteinVal: 0,
                      isProteinGoalMet: false,
                      hasWorkout: true,
                      hasPR: Boolean(log.prsAchieved?.length)
                    });
                  }}
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

      {/* Slide-Over Right Drawer Panel (Desktop) & Bottom Sheet (Mobile) */}
      {selectedDayDetails && (
        <div className="drawer-overlay" onClick={() => setSelectedDayDetails(null)}>
          <div className="right-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h3 className="nothing-title" style={{ fontSize: "1.2rem" }}>
                  {formatReadableDate(selectedDayDetails.dateStr)} Summary
                </h3>
                <span className="nothing-label">
                  {selectedDayDetails.hasWorkout ? `✓ ${selectedDayDetails.historyLog.dayName} Workout` : "No Workout Recorded"}
                </span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {selectedDayDetails.historyLog && (
                  <button 
                    className="icon-action-btn delete-btn" 
                    onClick={() => handleDeleteLog(selectedDayDetails.historyLog.id)}
                    title="Delete History Log"
                    style={{ width: "32px", height: "32px" }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                
                <button className="header-action-btn" onClick={() => setSelectedDayDetails(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="drawer-body" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* 🏋️ SECTION 1: WORKOUT DETAILS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <span className="nothing-label" style={{ fontSize: "0.75rem", color: "var(--accent-push)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Dumbbell size={15} /> WORKOUT SUMMARY & DETAILS
                </span>

                {selectedDayDetails.hasWorkout ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
                      <div className="metric-card">
                        <span className="nothing-label" style={{ fontSize: "0.6rem" }}>DURATION</span>
                        <div className="metric-value" style={{ fontSize: "1.1rem" }}>{selectedDayDetails.historyLog.durationMinutes} mins</div>
                      </div>

                      <div className="metric-card">
                        <span className="nothing-label" style={{ fontSize: "0.6rem" }}>TOTAL VOLUME</span>
                        <div className="metric-value" style={{ fontSize: "1.1rem", color: "var(--accent-push)" }}>
                          {selectedDayDetails.historyLog.totalVolume || getSessionVolume(selectedDayDetails.historyLog.exercises || [])}kg
                        </div>
                      </div>

                      <div className="metric-card">
                        <span className="nothing-label" style={{ fontSize: "0.6rem" }}>EST. CALORIES</span>
                        <div className="metric-value" style={{ fontSize: "1.1rem", color: "var(--accent-abs)" }}>
                          {selectedDayDetails.historyLog.estimatedCalories || 0} kcal
                        </div>
                      </div>

                      <div className="metric-card">
                        <span className="nothing-label" style={{ fontSize: "0.6rem" }}>SETS COMPLETED</span>
                        <div className="metric-value" style={{ fontSize: "1.1rem", color: "var(--accent-legs)" }}>
                          {selectedDayDetails.historyLog.completedSets || 0} sets
                        </div>
                      </div>
                    </div>

                    {/* PRs Achieved Badge Alert */}
                    {selectedDayDetails.historyLog.prsAchieved && selectedDayDetails.historyLog.prsAchieved.length > 0 && (
                      <div style={{ background: "rgba(236, 72, 153, 0.1)", border: "1px solid var(--accent-pr)", padding: "12px 14px", borderRadius: "12px", display: "flex", alignItems: "center", gap: "10px" }}>
                        <Trophy size={18} color="var(--accent-pr)" />
                        <div style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: "600" }}>
                          Personal Records Unlocked: <strong style={{ color: "var(--accent-pr)" }}>{selectedDayDetails.historyLog.prsAchieved.join(", ")}</strong>
                        </div>
                      </div>
                    )}

                    {/* Exercises List Breakdown */}
                    {(selectedDayDetails.historyLog.exercises || []).map((ex, exIdx) => {
                      const setsList = Array.isArray(ex.setsList) && ex.setsList.length > 0 
                        ? ex.setsList 
                        : Array.from({ length: ex.sets || 3 }).map((_, i) => ({ setNum: i + 1, weight: ex.weight || 0, reps: ex.reps || 0, completed: ex.completed }));

                      return (
                        <div key={exIdx} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "14px", padding: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: "800", fontSize: "0.95rem" }}>{ex.name}</span>
                            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "700" }}>
                              Vol: {ex.volume || 0}kg
                            </span>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                            {setsList.map((s, sIdx) => (
                              <div key={sIdx} style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", display: "flex", justifyContent: "space-between" }}>
                                <span>• Set {s.setNum || sIdx + 1} : <strong style={{ color: "var(--text-primary)" }}>{s.weight}kg × {s.reps}</strong></span>
                                {s.completed && <span style={{ color: "var(--accent-success)", fontWeight: "700" }}>✓</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="nothing-card" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                    No workout recorded for this date.
                  </div>
                )}
              </div>

              {/* 🥗 SECTION 2: NUTRITION SUMMARY */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <span className="nothing-label" style={{ fontSize: "0.75rem", color: "var(--accent-protein)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Utensils size={15} /> NUTRITION SUMMARY
                </span>

                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", padding: "14px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="nothing-label" style={{ fontSize: "0.7rem" }}>Daily Protein Target</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: "800", color: selectedDayDetails.isProteinGoalMet ? "var(--accent-success)" : "var(--accent-protein)", fontSize: "0.95rem" }}>
                      {selectedDayDetails.proteinVal}g / {proteinTarget}g
                    </span>
                  </div>

                  <div style={{ width: "100%", background: "var(--bg-card)", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                    <div 
                      style={{ 
                        width: `${Math.min(100, Math.round((selectedDayDetails.proteinVal / proteinTarget) * 100))}%`, 
                        height: "100%", 
                        background: selectedDayDetails.isProteinGoalMet ? "var(--accent-success)" : "var(--accent-protein)",
                        transition: "width 0.3s ease" 
                      }} 
                    />
                  </div>
                </div>

                {/* Meal Breakdown List */}
                {Object.keys(selectedDayDetails.mealsList || {}).some(k => (selectedDayDetails.mealsList[k] || []).length > 0) ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {Object.entries(selectedDayDetails.mealsList).map(([mealKey, itemsList]) => {
                      if (!itemsList || itemsList.length === 0) return null;
                      return (
                        <div key={mealKey} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "12px" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: "800", textTransform: "capitalize", color: "var(--text-primary)", display: "block", marginBottom: "6px" }}>
                            {mealKey}
                          </span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {itemsList.map((fItem, fIdx) => (
                              <div key={fIdx} style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
                                <span>- {fItem.foodName || fItem.name} ({fItem.quantity || 1}x)</span>
                                <span style={{ fontFamily: "var(--font-mono)", fontWeight: "700", color: "var(--accent-protein)" }}>
                                  {(parseInt(fItem.proteinPerServing ?? fItem.protein) || 0) * (parseInt(fItem.quantity) || 1)}g
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="nothing-card" style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                    No meals logged for this date.
                  </div>
                )}
              </div>

              {/* 🏆 SECTION 3: ACHIEVEMENTS FOOTER */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <span className="nothing-label" style={{ fontSize: "0.75rem", color: "var(--accent-abs)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Award size={15} /> DAILY ACHIEVEMENTS
                </span>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "12px", textAlign: "center" }}>
                    <Trophy size={16} color="var(--accent-pr)" style={{ margin: "0 auto 4px" }} />
                    <span className="nothing-label" style={{ fontSize: "0.55rem" }}>NEW PR</span>
                    <div style={{ fontSize: "0.75rem", fontWeight: "800", marginTop: "2px" }}>
                      {selectedDayDetails.hasPR ? "YES 🎉" : "NONE"}
                    </div>
                  </div>

                  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "12px", textAlign: "center" }}>
                    <Flame size={16} color="var(--accent-abs)" style={{ margin: "0 auto 4px" }} />
                    <span className="nothing-label" style={{ fontSize: "0.55rem" }}>STREAK</span>
                    <div style={{ fontSize: "0.75rem", fontWeight: "800", marginTop: "2px" }}>
                      {currentStreak} Days
                    </div>
                  </div>

                  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "12px", textAlign: "center" }}>
                    <Sparkles size={16} color="var(--accent-push)" style={{ margin: "0 auto 4px" }} />
                    <span className="nothing-label" style={{ fontSize: "0.55rem" }}>VOLUME</span>
                    <div style={{ fontSize: "0.75rem", fontWeight: "800", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
                      {selectedDayDetails.hasWorkout ? `${selectedDayDetails.historyLog.totalVolume || 0}kg` : "0kg"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
