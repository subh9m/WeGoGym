import React, { useState, useEffect } from "react";
import { usePlanner } from "../contexts/PlannerContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dumbbell, 
  Plus, 
  Trash2, 
  Copy, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Check, 
  AlertCircle,
  Pencil,
  ChevronLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

const DAYS_CONFIG = [
  { key: "day1", label: "Day 1" },
  { key: "day2", label: "Day 2" },
  { key: "day3", label: "Day 3" },
  { key: "day4", label: "Day 4" },
  { key: "day5", label: "Day 5" },
  { key: "day6", label: "Day 6" },
  { key: "day7", label: "Rest" }
];

const MUSCLE_GROUPS = [
  { id: "push", label: "Push (Chest/Triceps)" },
  { id: "pull", label: "Pull (Back/Biceps)" },
  { id: "legs", label: "Legs (Quads/Hamstrings)" },
  { id: "abs", label: "Abs / Core" },
  { id: "shoulders", label: "Shoulders" },
  { id: "arms", label: "Arms" },
  { id: "cardio", label: "Cardio / Conditioning" },
  { id: "other", label: "Other / General" }
];

export default function EditRoutine() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { workouts } = usePlanner();

  const [selectedDay, setSelectedDay] = useState("day1");
  const [dayType, setDayType] = useState("Push");
  const [exercisesList, setExercisesList] = useState([]);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load current day workout from context
  useEffect(() => {
    const currentWorkout = workouts[selectedDay] || { type: "Push", exercises: [] };
    setDayType(currentWorkout.type || "Split");
    
    // Normalize exercises into editable structures
    const normalized = (currentWorkout.exercises || []).map((ex, idx) => ({
      id: ex.id || `ex_${Date.now()}_${idx}`,
      name: ex.name || "Untitled Exercise",
      muscle: ex.muscle || "push",
      targetSets: parseInt(ex.targetSets || ex.sets) || 3,
      targetReps: parseInt(ex.targetReps || ex.reps) || 10,
      defaultWeight: parseFloat(ex.defaultWeight || ex.weight) || 40,
      notes: ex.notes || ""
    }));

    setExercisesList(normalized);
    setErrorMsg("");
    setSaveSuccess(false);
  }, [selectedDay, workouts]);

  // Exercise Modification Helpers
  const handleAddExercise = () => {
    const newEx = {
      id: `ex_${Date.now()}`,
      name: "New Exercise",
      muscle: "push",
      targetSets: 3,
      targetReps: 10,
      defaultWeight: 20,
      notes: ""
    };
    setExercisesList([...exercisesList, newEx]);
  };

  const handleDeleteExercise = (idx) => {
    const updated = [...exercisesList];
    updated.splice(idx, 1);
    setExercisesList(updated);
  };

  const handleDuplicateExercise = (idx) => {
    const target = exercisesList[idx];
    const cloned = {
      ...target,
      id: `ex_${Date.now()}`,
      name: `${target.name} (Copy)`
    };
    const updated = [...exercisesList];
    updated.splice(idx + 1, 0, cloned);
    setExercisesList(updated);
  };

  const handleMoveUp = (idx) => {
    if (idx <= 0) return;
    const updated = [...exercisesList];
    const temp = updated[idx];
    updated[idx] = updated[idx - 1];
    updated[idx - 1] = temp;
    setExercisesList(updated);
  };

  const handleMoveDown = (idx) => {
    if (idx >= exercisesList.length - 1) return;
    const updated = [...exercisesList];
    const temp = updated[idx];
    updated[idx] = updated[idx + 1];
    updated[idx + 1] = temp;
    setExercisesList(updated);
  };

  const handleFieldChange = (idx, field, value) => {
    const updated = [...exercisesList];
    updated[idx] = {
      ...updated[idx],
      [field]: value
    };
    setExercisesList(updated);
  };

  const handleSetChange = (idx, delta) => {
    const current = exercisesList[idx].targetSets || 3;
    const newSets = Math.max(1, current + delta);
    handleFieldChange(idx, "targetSets", newSets);
  };

  const handleRepChange = (idx, delta) => {
    const current = exercisesList[idx].targetReps || 10;
    const newReps = Math.max(1, current + delta);
    handleFieldChange(idx, "targetReps", newReps);
  };

  // Validate & Save to Firestore
  const handleSaveRoutine = async () => {
    setErrorMsg("");
    setSaveSuccess(false);

    // Validation 1: Exercise Names
    for (let i = 0; i < exercisesList.length; i++) {
      if (!exercisesList[i].name || !exercisesList[i].name.trim()) {
        return setErrorMsg(`Exercise #${i + 1} cannot have an empty name.`);
      }
      if (exercisesList[i].targetSets < 1) {
        return setErrorMsg(`Exercise "${exercisesList[i].name}" must have at least 1 set.`);
      }
      if (exercisesList[i].targetReps < 1) {
        return setErrorMsg(`Exercise "${exercisesList[i].name}" must have at least 1 rep.`);
      }
    }

    // Validation 2: Duplicate Names
    const namesSet = new Set();
    for (const ex of exercisesList) {
      const sanitized = ex.name.trim().toLowerCase();
      if (namesSet.has(sanitized)) {
        return setErrorMsg(`Duplicate exercise name found: "${ex.name}". Please use unique names per day.`);
      }
      namesSet.add(sanitized);
    }

    if (!currentUser) return;

    setIsSaving(true);
    try {
      const uid = currentUser.uid;
      const workoutDocRef = doc(db, "users", uid, "workouts", selectedDay);

      // Clean payload for Firestore write
      const exercisesPayload = exercisesList.map((ex, orderIdx) => ({
        id: ex.id,
        name: ex.name.trim(),
        muscle: ex.muscle,
        targetSets: Number(ex.targetSets),
        sets: Number(ex.targetSets),
        targetReps: Number(ex.targetReps),
        reps: Number(ex.targetReps),
        defaultWeight: Number(ex.defaultWeight) || 0,
        weight: Number(ex.defaultWeight) || 0,
        notes: ex.notes ? ex.notes.trim() : "",
        order: orderIdx,
        completed: false
      }));

      await updateDoc(workoutDocRef, {
        type: dayType.trim() || "Split Routine",
        exercises: exercisesPayload
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save routine:", err);
      setErrorMsg("Failed to save changes to Firestore. Please check your network connection.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.25 }}
      style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px", margin: "0 auto", width: "100%" }}
    >
      {/* Top Header & Back Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button className="header-action-btn" onClick={() => navigate("/")} title="Back to Workout">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="nothing-title" style={{ fontSize: "1.6rem" }}>Edit Workout Routine</h1>
            <span className="nothing-label" style={{ fontSize: "0.75rem" }}>Customize exercises, sets, reps & split days</span>
          </div>
        </div>

        <button 
          className="btn-premium-primary" 
          onClick={handleSaveRoutine}
          disabled={isSaving}
          style={{ height: "44px" }}
        >
          {isSaving ? "Saving..." : <><Save size={16} /> Save Routine Changes</>}
        </button>
      </div>

      {/* Validation / Success Notifications */}
      {errorMsg && (
        <div className="auth-error-msg" style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {saveSuccess && (
        <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid var(--accent-success)", color: "var(--accent-success)", padding: "12px 16px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
          <Check size={16} /> Routine updated and saved to Cloud Firestore!
        </div>
      )}

      {/* Day Selector Segmented Pills */}
      <div className="segmented-pills-container">
        {DAYS_CONFIG.map((d) => (
          <button
            key={d.key}
            className={`segmented-pill-btn ${selectedDay === d.key ? "active" : ""}`}
            onClick={() => setSelectedDay(d.key)}
          >
            {selectedDay === d.key && <motion.div layoutId="editRoutineDayPill" className="segmented-pill-active-bg" />}
            <span style={{ position: "relative", zIndex: 2 }}>{d.label}</span>
          </button>
        ))}
      </div>

      {/* Day Type / Routine Title Card */}
      <div className="nothing-card glow-white" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ flex: 1, minWidth: "240px" }}>
          <label className="nothing-label" style={{ fontSize: "0.65rem", marginBottom: "6px", display: "block" }}>ROUTINE SPLIT TYPE</label>
          <div className="premium-input-box" style={{ height: "44px" }}>
            <input 
              type="text"
              className="premium-inner-input"
              style={{ fontSize: "1.05rem", fontWeight: "800" }}
              placeholder="e.g. Push, Pull, Legs, Abs, Rest"
              value={dayType}
              onChange={(e) => setDayType(e.target.value)}
            />
          </div>
        </div>

        <button className="btn-premium-secondary" onClick={handleAddExercise} style={{ height: "44px" }}>
          <Plus size={16} /> Add Exercise
        </button>
      </div>

      {/* Exercises List Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {exercisesList.map((ex, idx) => (
          <motion.div 
            key={ex.id}
            className="nothing-card glow-white"
            style={{ padding: "20px" }}
            layout
          >
            {/* Top Bar: Reorder & Actions */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: "800", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                  #{idx + 1}
                </span>

                <button 
                  className="icon-action-btn" 
                  style={{ width: "30px", height: "30px" }}
                  onClick={() => handleMoveUp(idx)}
                  disabled={idx === 0}
                  title="Move Up"
                >
                  <ArrowUp size={14} />
                </button>

                <button 
                  className="icon-action-btn" 
                  style={{ width: "30px", height: "30px" }}
                  onClick={() => handleMoveDown(idx)}
                  disabled={idx === exercisesList.length - 1}
                  title="Move Down"
                >
                  <ArrowDown size={14} />
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button 
                  className="icon-action-btn edit-btn" 
                  style={{ width: "32px", height: "32px" }}
                  onClick={() => handleDuplicateExercise(idx)}
                  title="Duplicate exercise"
                >
                  <Copy size={14} />
                </button>

                <button 
                  className="icon-action-btn delete-btn" 
                  style={{ width: "32px", height: "32px" }}
                  onClick={() => handleDeleteExercise(idx)}
                  title="Delete exercise"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Main Form Fields Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              {/* Exercise Name */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>EXERCISE NAME</label>
                <div className="premium-input-box" style={{ height: "42px" }}>
                  <input 
                    type="text"
                    className="premium-inner-input"
                    value={ex.name}
                    onChange={(e) => handleFieldChange(idx, "name", e.target.value)}
                    placeholder="e.g. Bench Press"
                  />
                </div>
              </div>

              {/* Muscle Group Select */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>MUSCLE GROUP</label>
                <select 
                  className="premium-input-box"
                  style={{ height: "42px", background: "var(--bg-secondary)", padding: "0 12px", fontSize: "0.85rem", fontWeight: "700" }}
                  value={ex.muscle}
                  onChange={(e) => handleFieldChange(idx, "muscle", e.target.value)}
                >
                  {MUSCLE_GROUPS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Target Sets [- / +] */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>TARGET SETS</label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button 
                    className="btn-premium-secondary"
                    style={{ width: "42px", height: "42px", padding: 0, justifyContent: "center" }}
                    onClick={() => handleSetChange(idx, -1)}
                  >
                    -
                  </button>
                  <div className="premium-input-box" style={{ height: "42px", flex: 1, textAlign: "center" }}>
                    <input 
                      type="number"
                      className="premium-inner-input"
                      style={{ textAlign: "center", fontWeight: "800" }}
                      value={ex.targetSets}
                      onChange={(e) => handleFieldChange(idx, "targetSets", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <button 
                    className="btn-premium-secondary"
                    style={{ width: "42px", height: "42px", padding: 0, justifyContent: "center" }}
                    onClick={() => handleSetChange(idx, 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Target Reps [- / +] */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>TARGET REPS</label>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button 
                    className="btn-premium-secondary"
                    style={{ width: "42px", height: "42px", padding: 0, justifyContent: "center" }}
                    onClick={() => handleRepChange(idx, -1)}
                  >
                    -
                  </button>
                  <div className="premium-input-box" style={{ height: "42px", flex: 1, textAlign: "center" }}>
                    <input 
                      type="number"
                      className="premium-inner-input"
                      style={{ textAlign: "center", fontWeight: "800" }}
                      value={ex.targetReps}
                      onChange={(e) => handleFieldChange(idx, "targetReps", parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <button 
                    className="btn-premium-secondary"
                    style={{ width: "42px", height: "42px", padding: 0, justifyContent: "center" }}
                    onClick={() => handleRepChange(idx, 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Default Weight */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>DEFAULT WEIGHT (KG)</label>
                <div className="premium-input-box" style={{ height: "42px" }}>
                  <input 
                    type="number"
                    className="premium-inner-input"
                    value={ex.defaultWeight}
                    onChange={(e) => handleFieldChange(idx, "defaultWeight", parseFloat(e.target.value) || 0)}
                  />
                  <span className="premium-input-unit">kg</span>
                </div>
              </div>

              {/* Optional Notes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>NOTES / OVERLOAD TARGET</label>
                <div className="premium-input-box" style={{ height: "42px" }}>
                  <input 
                    type="text"
                    className="premium-inner-input"
                    placeholder="e.g. Focus on chest stretch"
                    value={ex.notes}
                    onChange={(e) => handleFieldChange(idx, "notes", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {exercisesList.length === 0 && (
          <div className="nothing-card" style={{ textAlign: "center", padding: "40px 20px" }}>
            <span className="nothing-label">No Exercises Added</span>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "6px" }}>
              Click "Add Exercise" above to configure routine targets for this day.
            </p>
          </div>
        )}
      </div>

      {/* Save Button Footer */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
        <button 
          className="btn-premium-primary" 
          onClick={handleSaveRoutine}
          disabled={isSaving}
          style={{ height: "46px", padding: "0 28px" }}
        >
          {isSaving ? "Saving..." : <><Save size={18} /> Save Routine Changes</>}
        </button>
      </div>
    </motion.div>
  );
}
