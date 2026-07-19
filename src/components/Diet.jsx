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
  X
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
  { key: "breakfast", label: "Breakfast", icon: Coffee, glowClass: "glow-blue", accentColor: "var(--accent-blue)" },
  { key: "lunch", label: "Lunch", icon: Utensils, glowClass: "glow-red", accentColor: "var(--accent-push)" },
  { key: "snacks", label: "Snacks", icon: Apple, glowClass: "glow-orange", accentColor: "var(--accent-abs)" },
  { key: "dinner", label: "Dinner", icon: Flame, glowClass: "glow-purple", accentColor: "var(--accent-protein)" }
];

export default function Diet() {
  const { profile, diets, foodReferences, addFoodToMeal, removeFoodFromMeal } = usePlanner();
  const [selectedDay, setSelectedDay] = useState("day1");

  const [activeMealKey, setActiveMealKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredFoods = (foodReferences || []).filter((food) => {
    return food.name.toLowerCase().includes(searchQuery.toLowerCase());
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
      {/* Day segmented selector pills */}
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

      {/* Protein Target Overview Header Card */}
      <div className="nothing-card glow-purple" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div className="circular-ring-container" style={{ width: "110px", height: "110px" }}>
            <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="55" cy="55" r="46" stroke="var(--bg-secondary)" strokeWidth="8" fill="transparent" />
              <circle
                cx="55"
                cy="55"
                r="46"
                stroke={isGoalAchieved ? "var(--accent-success)" : "var(--accent-protein)"}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="289"
                strokeDashoffset={289 - (progressPct / 100) * 289}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.4s ease-out" }}
              />
            </svg>
            <div className="ring-percent-text" style={{ fontSize: "1.4rem" }}>{progressPct}%</div>
          </div>

          <div>
            <span className="nothing-label">Daily Protein Target</span>
            <div style={{ fontSize: "1.8rem", fontWeight: "900", lineHeight: 1.1, marginTop: "4px" }}>
              {dayTotalProtein}g <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: "600" }}>/ {proteinTarget}g</span>
            </div>
            <div style={{ fontSize: "0.8rem", color: isGoalAchieved ? "var(--accent-success)" : "var(--accent-protein)", fontWeight: "700", marginTop: "6px" }}>
              {isGoalAchieved ? "✓ Target Protein Reached!" : `${proteinTarget - dayTotalProtein}g remaining today`}
            </div>
          </div>
        </div>
      </div>

      {/* Meal Breakdown Grid */}
      <div className="diet-grid">
        {MEALS_CONFIG.map((meal) => {
          const MealIcon = meal.icon;
          const mealItems = dayDiet.meals?.[meal.key] || [];

          let mealProtein = 0;
          mealItems.forEach((item) => {
            mealProtein += (item.proteinPerServing || 0) * (item.quantity || 1);
          });

          return (
            <div key={meal.key} className={`meal-card-premium ${meal.glowClass}`}>
              <div>
                <div className="meal-header-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className="exercise-icon-box" style={{ width: "36px", height: "36px", color: meal.accentColor }}>
                      <MealIcon size={18} />
                    </div>
                    <span style={{ fontSize: "1rem", fontWeight: "800", color: "var(--text-primary)" }}>
                      {meal.label}
                    </span>
                  </div>

                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: "800", color: "var(--accent-protein)", fontSize: "1.1rem" }}>
                    {mealProtein}g
                  </span>
                </div>

                {/* Logged Item Chips */}
                <div className="meal-chip-list">
                  {mealItems.map((item, idx) => (
                    <div key={idx} className="food-item-chip">
                      <span>{item.foodName} ({item.quantity}x)</span>
                      <button 
                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}
                        onClick={() => removeFoodFromMeal(selectedDay, meal.key, idx)}
                        title="Remove food"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {mealItems.length === 0 && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                      No items logged
                    </span>
                  )}
                </div>
              </div>

              {/* Add Food Action */}
              <button 
                className="btn-premium-secondary" 
                style={{ height: "40px", fontSize: "0.8rem", width: "100%", justifyContent: "center" }}
                onClick={() => setActiveMealKey(meal.key)}
              >
                <Plus size={14} /> Add Food
              </button>
            </div>
          );
        })}
      </div>

      {/* Front Modal Food Selection Overlay */}
      {activeMealKey && (
        <div className="modal-overlay" onClick={() => setActiveMealKey(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nothing-card-header" style={{ marginBottom: "16px" }}>
              <span className="nothing-title" style={{ fontSize: "1.1rem" }}>
                Add to {activeMealKey.toUpperCase()}
              </span>
              <button className="header-action-btn" onClick={() => setActiveMealKey(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="premium-input-box" style={{ marginBottom: "16px" }}>
              <Search size={16} color="var(--text-secondary)" style={{ marginRight: "8px" }} />
              <input 
                type="text"
                className="premium-inner-input"
                placeholder="Search food library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "340px", overflowY: "auto" }}>
              {filteredFoods.map((food) => (
                <div 
                  key={food.id}
                  style={{
                    display: "flex",
                    justify: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: "12px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    cursor: "pointer"
                  }}
                  onClick={() => handleAddFoodSelect(food)}
                >
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "0.9rem" }}>{food.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{food.serving}</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: "800", fontFamily: "var(--font-mono)", color: "var(--accent-protein)", fontSize: "0.95rem" }}>
                      {food.protein}g
                    </span>
                    <Plus size={16} color="var(--text-secondary)" />
                  </div>
                </div>
              ))}

              {filteredFoods.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  No matching foods found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
