import React, { useState, useEffect } from "react";
import { usePlanner } from "../contexts/PlannerContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coffee, 
  Utensils, 
  Apple, 
  Flame, 
  Plus, 
  Search,
  CheckCircle2,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";

const DAYS_CONFIG = [
  { key: "day1", label: "Day 1" },
  { key: "day2", label: "Day 2" },
  { key: "day3", label: "Day 3" },
  { key: "day4", label: "Day 4" },
  { key: "day5", label: "Day 5" },
  { key: "day6", label: "Day 6" },
  { key: "day7", label: "Day 7" }
];

const MEALS_CONFIG = [
  { key: "breakfast", label: "Breakfast", icon: Coffee, accentColor: "var(--accent-pull)" },
  { key: "lunch", label: "Lunch", icon: Utensils, accentColor: "var(--accent-push)" },
  { key: "snacks", label: "Snacks", icon: Apple, accentColor: "var(--accent-abs)" },
  { key: "dinner", label: "Dinner", icon: Flame, accentColor: "var(--accent-protein)" }
];

export default function Diet() {
  const { profile, diets, foodReferences, addFoodToMeal, removeFoodFromMeal } = usePlanner();
  const [selectedDay, setSelectedDay] = useState("day1");

  // Bottom Sheet Food Selector Modal state
  const [activeMealKey, setActiveMealKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const today = new Date().getDay();
    const dayKey = today === 0 ? "day7" : `day${today}`;
    setSelectedDay(dayKey);
  }, []);

  const dayDiet = diets[selectedDay] || { meals: { breakfast: [], lunch: [], snacks: [], dinner: [] } };
  const proteinTarget = profile?.proteinTarget || 100;

  const getDayTotalProtein = () => {
    let total = 0;
    Object.keys(dayDiet.meals || {}).forEach((mealKey) => {
      (dayDiet.meals[mealKey] || []).forEach((item) => {
        total += (item.proteinPerServing || 0) * (item.quantity || 1);
      });
    });
    return total;
  };

  const dayTotalProtein = getDayTotalProtein();
  const progressPct = Math.min(100, Math.round((dayTotalProtein / proteinTarget) * 100));
  const isGoalAchieved = dayTotalProtein >= proteinTarget;
  const estimatedCalories = Math.round(dayTotalProtein * 4 + 1200);

  // Filter food references for modal
  const filteredFoods = (foodReferences || []).filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "all" || food.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleAddFoodSelect = (food) => {
    if (!activeMealKey) return;
    addFoodToMeal(selectedDay, activeMealKey, {
      foodId: food.id,
      foodName: food.name,
      proteinPerServing: food.protein,
      serving: food.serving,
      quantity: 1
    });
    setActiveMealKey(null);
    setSearchQuery("");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.25 }}
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* 1. Day segmented selector pills */}
      <div className="segmented-pills-container">
        {DAYS_CONFIG.map((day) => (
          <button
            key={day.key}
            className={`segmented-pill-btn ${selectedDay === day.key ? "active" : ""}`}
            onClick={() => setSelectedDay(day.key)}
          >
            {selectedDay === day.key && <motion.div layoutId="activeDietDayTab" className="segmented-pill-active-bg" />}
            <span style={{ position: "relative", zIndex: 2 }}>{day.label}</span>
          </button>
        ))}
      </div>

      {/* 2. MyFitnessPal Macro Header Card */}
      <div className="nothing-card" style={{ background: "linear-gradient(135deg, var(--bg-card), var(--bg-secondary))" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", alignItems: "center" }}>
          {/* Progress Ring */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div className="circular-ring-container" style={{ width: "130px", height: "130px" }}>
              <svg width="130" height="130" style={{ transform: "rotate(-90deg)" }}>
                <circle cx="65" cy="65" r="54" stroke="var(--bg-secondary)" strokeWidth="10" fill="transparent" />
                <circle
                  cx="65"
                  cy="65"
                  r="54"
                  stroke={isGoalAchieved ? "var(--accent-success)" : "var(--accent-protein)"}
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray="339"
                  strokeDashoffset={339 - (progressPct / 100) * 339}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.4s ease-out" }}
                />
              </svg>
              <div className="ring-percent-text" style={{ fontSize: "1.7rem", color: isGoalAchieved ? "var(--accent-success)" : "var(--accent-protein)" }}>
                {progressPct}%
              </div>
            </div>

            <div>
              <span className="nothing-label" style={{ color: "var(--accent-protein)" }}>Daily Protein</span>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", lineHeight: 1.1, marginTop: "4px" }}>
                {dayTotalProtein}g <span style={{ fontSize: "1rem", color: "var(--text-secondary)", fontWeight: "600" }}>/ {proteinTarget}g</span>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--accent-success)", fontWeight: "700", marginTop: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
                {isGoalAchieved ? <><CheckCircle2 size={16} /> Target Reached!</> : `Need ${proteinTarget - dayTotalProtein}g more today`}
              </div>
            </div>
          </div>

          {/* Macro Breakdown Pills */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            <div style={{ background: "var(--bg-secondary)", padding: "14px", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase" }}>Calories</div>
              <div style={{ fontSize: "1.2rem", fontWeight: "900", marginTop: "2px" }}>~{estimatedCalories}</div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>kcal estimated</div>
            </div>

            <div style={{ background: "var(--bg-secondary)", padding: "14px", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: "700", textTransform: "uppercase" }}>Protein</div>
              <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "var(--accent-protein)", marginTop: "2px" }}>{dayTotalProtein}g</div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{progressPct}% of daily goal</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Meal Cards Breakdown */}
      <div className="diet-grid" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {MEALS_CONFIG.map((meal) => {
          const MealIcon = meal.icon;
          const mealItems = dayDiet.meals?.[meal.key] || [];

          let mealProtein = 0;
          mealItems.forEach((item) => {
            mealProtein += (item.proteinPerServing || 0) * (item.quantity || 1);
          });

          return (
            <div key={meal.key} className="nothing-card" style={{ padding: "20px" }}>
              {/* Meal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "14px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", color: meal.accentColor }}>
                    <MealIcon size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "800" }}>{meal.label}</h3>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                      {mealItems.length} {mealItems.length === 1 ? "item" : "items"} logged
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                    {mealProtein}g <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>protein</span>
                  </div>

                  <button 
                    className="btn-premium-primary" 
                    style={{ minHeight: "38px", padding: "0 14px", fontSize: "0.8rem" }}
                    onClick={() => setActiveMealKey(meal.key)}
                  >
                    <Plus size={16} /> Add Food
                  </button>
                </div>
              </div>

              {/* Logged Food Items List */}
              {mealItems.length > 0 && (
                <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {mealItems.map((item, idx) => (
                    <div 
                      key={idx}
                      style={{
                        display: "flex",
                        justify: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        borderRadius: "14px",
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border-color)"
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "800", fontSize: "0.9rem" }}>{item.foodName}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          {item.serving} • {item.quantity}x serving
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontWeight: "900", fontFamily: "var(--font-mono)", color: "var(--accent-protein)", fontSize: "0.95rem" }}>
                          +{(item.proteinPerServing || 0) * (item.quantity || 1)}g
                        </span>
                        <button 
                          className="header-action-btn"
                          style={{ width: "32px", height: "32px", color: "var(--accent-push)" }}
                          onClick={() => removeFoodFromMeal(selectedDay, meal.key, idx)}
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Bottom Sheet Food Selection Overlay */}
      {activeMealKey && (
        <div className="modal-overlay" onClick={() => setActiveMealKey(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nothing-card-header" style={{ marginBottom: "16px" }}>
              <span className="nothing-title">
                Add Food to {activeMealKey.toUpperCase()}
              </span>
              <button className="header-action-btn" onClick={() => setActiveMealKey(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Instant Search Bar */}
            <div className="premium-input-box" style={{ marginBottom: "16px" }}>
              <Search size={18} color="var(--text-secondary)" style={{ marginRight: "10px" }} />
              <input 
                type="text"
                className="premium-inner-input"
                placeholder="Search food library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            {/* Food Selection Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "360px", overflowY: "auto" }}>
              {filteredFoods.map((food) => (
                <div 
                  key={food.id}
                  style={{
                    display: "flex",
                    justify: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderRadius: "14px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    cursor: "pointer",
                    transition: "var(--transition-normal)"
                  }}
                  onClick={() => handleAddFoodSelect(food)}
                >
                  <div>
                    <div style={{ fontWeight: "800", fontSize: "0.95rem" }}>{food.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{food.serving}</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontWeight: "900", fontFamily: "var(--font-mono)", color: "var(--accent-protein)", fontSize: "1rem" }}>
                      {food.protein}g protein
                    </span>
                    <Plus size={16} color="var(--accent-pull)" />
                  </div>
                </div>
              ))}

              {filteredFoods.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  No food entries match your search.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
