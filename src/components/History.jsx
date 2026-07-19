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
  
  // Custom states for Year filter options
  const [yearOptions, setYearOptions] = useState([]);

  useEffect(() => {
    const yearsSet = new Set([new Date().getFullYear()]);
    history.forEach((log) => {
      if (log.date) {
        const y = parseInt(log.date.split("-")[0]);
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    setYearOptions([...yearsSet].sort((a,b) => b - a));
  }, [history]);

  // Calculate session volume (reps x sets x weight)
  const getSessionVolume = (exercises) => {
    return exercises.reduce((acc, ex) => {
      const w = parseFloat(ex.weight) || 0;
      const s = parseInt(ex.sets) || 0;
      const r = parseInt(ex.reps) || 0;
      return acc + (w * s * r);
    }, 0);
  };

  // Format date readable (e.g. 18 Jul 2026)
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

  const getWorkoutTagClass = (workoutType) => {
    const type = (workoutType || "").toLowerCase();
    if (type.includes("push")) return "timeline-tag-push";
    if (type.includes("pull")) return "timeline-tag-pull";
    if (type.includes("leg")) return "timeline-tag-legs";
    if (type.includes("abs")) return "timeline-tag-abs";
    return "timeline-tag-other";
  };

  // Calculate workout statistics
  const totalWorkoutDays = history.length;
  const totalWorkoutsCount = history.length; // distinct workout sessions
  const currentStreak = profile?.streak?.current || 0;
  const longestStreak = profile?.streak?.longest || 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* Top row stats summary (Streaks & counts) */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <div className="metric-card glow-orange" style={{ borderColor: "rgba(249, 115, 22, 0.2)" }}>
          <div className="metric-card-header">
            <span>Current Streak</span>
            <Flame size={16} color="var(--accent-abs)" />
          </div>
          <div className="metric-value">
            <span className="metric-value-dot">🔥 {currentStreak}</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginLeft: "4px" }}>days</span>
          </div>
        </div>

        <div className="metric-card glow-purple" style={{ borderColor: "rgba(168, 85, 247, 0.2)" }}>
          <div className="metric-card-header">
            <span>Longest Streak</span>
            <Trophy size={16} color="var(--accent-protein)" />
          </div>
          <div className="metric-value">
            <span className="metric-value-dot">🏆 {longestStreak}</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginLeft: "4px" }}>days</span>
          </div>
        </div>

        <div className="metric-card glow-green" style={{ borderColor: "rgba(34, 197, 94, 0.2)" }}>
          <div className="metric-card-header">
            <span>Total Active Days</span>
            <CalendarDays size={16} color="var(--accent-legs)" />
          </div>
          <div className="metric-value">
            <span className="metric-value-dot">📅 {totalWorkoutDays}</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginLeft: "4px" }}>logged</span>
          </div>
        </div>

        <div className="metric-card glow-blue" style={{ borderColor: "rgba(59, 130, 246, 0.2)" }}>
          <div className="metric-card-header">
            <span>Total Workouts</span>
            <Activity size={16} color="var(--accent-blue)" />
          </div>
          <div className="metric-value">
            <span className="metric-value-dot">💪 {totalWorkoutsCount}</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginLeft: "4px" }}>sessions</span>
          </div>
        </div>
      </div>

      {/* Heatmap Contribution Section */}
      <div className="heatmap-container glow-history">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>
              Workout History Calendar
            </h3>
            <span className="nothing-label" style={{ fontSize: "0.65rem", color: "var(--text-secondary)", textTransform: "none" }}>
              Submission frequency map (Level 1: light, Level 3: heavy)
            </span>
          </div>

          {/* Year Switcher Dropdown */}
          <div className="premium-input-box" style={{ width: "120px", height: "36px", borderRadius: "8px", padding: "0 8px" }}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{ background: "transparent", border: "none", color: "var(--text-primary)", width: "100%", outline: "none", fontSize: "0.85rem", fontWeight: "700", cursor: "pointer" }}
            >
              {yearOptions.map(y => (
                <option key={y} value={y} style={{ backgroundColor: "var(--bg-card)", color: "var(--text-primary)" }}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <WorkoutHistoryHeatmap 
          history={history} 
          prs={prs}
          selectedYear={selectedYear} 
          onCellClick={(log) => setDrawerLog(log)} 
        />
      </div>

      {/* Chronological completed logs timeline below */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: "700" }}>Timeline List</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {history.length > 0 ? (
            [...history].sort((a,b) => b.id.localeCompare(a.id)).map((log) => {
              const volume = getSessionVolume(log.exercises || []);
              
              return (
                <div 
                  key={log.id} 
                  className="timeline-card glow-history"
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onClick={() => setDrawerLog(log)}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span className={`timeline-workout-tag ${getWorkoutTagClass(log.dayName)}`}>
                        {log.dayName}
                      </span>
                      <span style={{ fontSize: "0.95rem", fontWeight: "700" }}>
                        {formatReadableDate(log.date)}
                      </span>
                    </div>

                    <div className="timeline-meta-row" style={{ marginTop: "4px" }}>
                      <div className="timeline-meta-item">
                        <Clock size={12} />
                        <span>{log.durationMinutes} mins</span>
                      </div>
                      <div className="timeline-meta-item">
                        <Dumbbell size={12} />
                        <span>{log.completedCount} exercises</span>
                      </div>
                      <div className="timeline-meta-item">
                        <TrendingUp size={12} />
                        <span>{volume.toLocaleString()} kg Volume</span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight size={18} color="var(--text-secondary)" />
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: "center", padding: "40px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
              No completed logs recorded.
            </div>
          )}
        </div>
      </div>

      {/* Right Side Slider Drawer details */}
      <AnimatePresence>
        {drawerLog && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="drawer-overlay"
              onClick={() => setDrawerLog(null)}
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="right-drawer-panel"
            >
              <div className="drawer-header">
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "800" }}>Workout Summary</h3>
                  <span className="nothing-label" style={{ fontSize: "0.65rem", color: "var(--accent-purple)", marginTop: "2px" }}>
                    {drawerLog.dayName} Split
                  </span>
                </div>
                <button 
                  className="header-action-btn"
                  onClick={() => setDrawerLog(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="drawer-body">
                {/* Details indicators */}
                <div style={{ display: "flex", gap: "10px" }}>
                  <div className="drawer-metric-pill" style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Date</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: "700" }}>{formatReadableDate(drawerLog.date)}</span>
                  </div>
                  <div className="drawer-metric-pill" style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Duration</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: "700" }}>{drawerLog.durationMinutes} mins</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <div className="drawer-metric-pill" style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Exercises</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: "700" }}>{drawerLog.completedCount} lifts</span>
                  </div>
                  <div className="drawer-metric-pill" style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Total Volume</span>
                    <span style={{ fontSize: "0.9rem", fontWeight: "700" }}>{getSessionVolume(drawerLog.exercises || []).toLocaleString()} kg</span>
                  </div>
                </div>

                {/* Exercises list table */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                  <span className="nothing-label" style={{ fontSize: "0.65rem" }}>Lifting Log Entries</span>
                  <div style={{ border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
                    <table className="reference-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                      <thead>
                        <tr style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-color)" }}>
                          <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--text-secondary)" }}>Exercise</th>
                          <th style={{ padding: "10px 14px", textAlign: "right", color: "var(--text-secondary)" }}>Weight</th>
                          <th style={{ padding: "10px 14px", textAlign: "right", color: "var(--text-secondary)" }}>Sets</th>
                          <th style={{ padding: "10px 14px", textAlign: "right", color: "var(--text-secondary)" }}>Reps</th>
                        </tr>
                      </thead>
                      <tbody>
                        {drawerLog.exercises && drawerLog.exercises.filter(ex => ex.completed).map((ex, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                            <td style={{ padding: "10px 14px" }}>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: "700" }}>{ex.name}</span>
                                {ex.notes && (
                                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                                    Note: {ex.notes}
                                  </span>
                                )}
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function getFormattedDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Leetcode style heatmap generator component
function WorkoutHistoryHeatmap({ history, prs, selectedYear, onCellClick }) {
  const [cells, setCells] = useState([]);
  const [monthLabels, setMonthLabels] = useState([]);
  const [tooltip, setTooltip] = useState({ visible: false, content: null, x: 0, y: 0 });

  useEffect(() => {
    // 1. Sunday on or before Jan 1st of selectedYear
    const firstDay = new Date(selectedYear, 0, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 is Sunday, 6 is Saturday
    const startSunday = new Date(selectedYear, 0, 1 - startDayOfWeek);

    const logMap = {};
    history.forEach((log) => {
      logMap[log.date] = log;
    });

    const tempCells = [];
    const todayStr = getFormattedDate(new Date());

    // Leetcode Grid displays exactly 53 weeks (7 rows x 53 columns = 371 cells)
    for (let i = 0; i < 371; i++) {
      const currentCellDate = new Date(startSunday);
      currentCellDate.setDate(startSunday.getDate() + i);
      const dateStr = getFormattedDate(currentCellDate);

      const inYear = currentCellDate.getFullYear() === selectedYear;
      const log = inYear ? logMap[dateStr] : null;

      let level = 0;
      let isPrDay = false;
      if (log) {
        const sets = log.totalSets || 0;
        if (sets === 0) level = 0;
        else if (sets <= 8) level = 1;
        else if (sets <= 16) level = 2;
        else level = 3;

        // Verify PR achievements outline
        isPrDay = log.exercises?.some(ex => {
          const pr = prs[ex.name.toLowerCase().trim()];
          return pr && parseFloat(ex.weight) >= parseFloat(pr.highestWeight);
        });
      }

      tempCells.push({
        date: dateStr,
        inYear,
        level,
        log,
        isPrDay,
        isToday: dateStr === todayStr,
        dayOfWeek: currentCellDate.getDay(),
        formattedString: currentCellDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
      });
    }

    // 2. Identify the column indices where each month begins
    const labels = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    monthNames.forEach((monthName, idx) => {
      const firstOfMonth = new Date(selectedYear, idx, 1);
      const diffTime = firstOfMonth - startSunday;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const colIndex = Math.floor(diffDays / 7);
      
      // Ensure the column falls within our grid
      if (colIndex >= 0 && colIndex < 53) {
        labels.push({ name: monthName, col: colIndex });
      }
    });

    setCells(tempCells);
    setMonthLabels(labels);
  }, [history, prs, selectedYear]);

  const handleMouseEnter = (cell, e) => {
    if (!cell.inYear) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + window.scrollX - 70;
    const y = rect.top + window.scrollY - 90;

    let content = null;
    if (cell.log) {
      const vol = cell.log.exercises?.reduce((acc, ex) => acc + (parseFloat(ex.weight) || 0) * (parseInt(ex.sets) || 0) * (parseInt(ex.reps) || 0), 0) || 0;
      content = {
        date: cell.formattedString,
        type: `${cell.log.dayName} Day`,
        duration: `${cell.log.durationMinutes} mins`,
        exercises: `${cell.log.completedCount} Exercises`,
        volume: `${vol.toLocaleString()} kg Volume`
      };
    } else {
      content = {
        date: cell.formattedString,
        type: "Rest Day",
        duration: "0 mins",
        exercises: "0 Exercises",
        volume: "0 kg Volume"
      };
    }

    setTooltip({
      visible: true,
      content,
      x,
      y
    });
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div className="heatmap-wrapper">
      <div className="heatmap-scroll-area">
        {/* Month labels grid */}
        <div className="heatmap-months-row-grid">
          <div style={{ width: "30px" }} /> {/* Weekdays labels spacer */}
          {monthLabels.map((m, idx) => (
            <span
              key={idx}
              className="heatmap-month-label"
              style={{ gridColumnStart: m.col + 2 }} // +2 offset for spacer column
            >
              {m.name}
            </span>
          ))}
        </div>

        {/* Heatmap Grid structure */}
        <div className="heatmap-grid-with-labels">
          <div className="heatmap-weekdays-column">
            <span></span>
            <span>Mon</span>
            <span></span>
            <span>Wed</span>
            <span></span>
            <span>Fri</span>
            <span></span>
          </div>

          <div className="heatmap-grid-core">
            {cells.map((cell, idx) => {
              const cellClass = cell.inYear 
                ? `level-${cell.level}` 
                : "level-outside";
              
              const borderHighlight = cell.isToday 
                ? "current-day-highlight" 
                : cell.isPrDay 
                  ? "pr-day-highlight" 
                  : "";

              return (
                <div
                  key={idx}
                  className={`heatmap-cell ${cellClass} ${borderHighlight}`}
                  style={{ opacity: cell.inYear ? 1 : 0.15, pointerEvents: cell.inYear ? "auto" : "none" }}
                  onMouseEnter={(e) => handleMouseEnter(cell, e)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => cell.log && onCellClick(cell.log)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating smooth Tooltip portal */}
      <AnimatePresence>
        {tooltip.visible && tooltip.content && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="heatmap-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            <span style={{ fontWeight: "700", color: "var(--text-primary)" }}>{tooltip.content.date}</span>
            <span style={{ color: "var(--accent-purple)", fontWeight: "600" }}>{tooltip.content.type}</span>
            <span style={{ color: "var(--text-secondary)" }}>⏰ {tooltip.content.duration}</span>
            <span style={{ color: "var(--text-secondary)" }}>💪 {tooltip.content.exercises}</span>
            <span style={{ color: "var(--accent-success)", fontWeight: "700" }}>🏋️ {tooltip.content.volume}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
