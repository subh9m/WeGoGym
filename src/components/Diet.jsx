import React, { useState, useEffect } from "react";
import { usePlanner } from "../contexts/PlannerContext";
import { motion } from "framer-motion";
import { 
  Coffee, 
  Utensils, 
  Apple, 
  Flame, 
  Plus, 
  Search,
  X,
  Minus,
  Edit3
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
  const { profile, diets, foodReferences, addFoodToMeal, removeFoodFromMeal, updateFoodQuantity, updateLoggedFoodItem } = usePlanner();
  const [selectedDay, setSelectedDay] = useState("day1");

  const [activeMealKey, setActiveMealKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Manual Edit Logged Food Item Modal States
  const [editingLogItem, setEditingLogItem] = useState(null);
  const [editProtein, setEditProtein] = useState(0);
  const [editCalories, setEditCalories] = useState(0);
  const [editQty, setEditQty] = useState(100);

  useEffect(() => {
    const today = new Date().getDay();
    const dayKey = today === 0 ? "day7" : `day${today}`;
    setSelectedDay(dayKey);
  }, []);

  const dayDiet = diets[selectedDay] || { meals: { breakfast: [], lunch: [], snacks: [], dinner: [] } };
  const proteinTarget = profile?.proteinTarget || 100;

  // Formula: (storedValue / referenceQuantity) * selectedQuantity
  // Instant calculations with ZERO API calls
  const getDayTotalNutrition = () => {
    let totalProtein = 0;
    let totalFat = 0;
    let totalCarbs = 0;
    let totalFiber = 0;
    let totalCalories = 0;

    Object.keys(dayDiet.meals || {}).forEach((mealKey) => {
      (dayDiet.meals[mealKey] || []).forEach((item) => {
        const refQty = Number(item.referenceQuantity) || 1;
        const selQty = Number(item.quantity) || 1;

        const storedP = Number(item.proteinPerServing ?? item.protein ?? 0);
        const storedF = Number(item.fat ?? 0);
        const storedC = Number(item.carbs ?? 0);
        const storedFb = Number(item.fiber ?? 0);
        const storedCal = Number(item.calories ?? (storedP * 4 + storedC * 4 + storedF * 9));

        totalProtein += (storedP / refQty) * selQty;
        totalFat += (storedF / refQty) * selQty;
        totalCarbs += (storedC / refQty) * selQty;
        totalFiber += (storedFb / refQty) * selQty;
        totalCalories += (storedCal / refQty) * selQty;
      });
    });

    return {
      totalProtein: Math.round(totalProtein),
      totalFat: Math.round(totalFat),
      totalCarbs: Math.round(totalCarbs),
      totalFiber: Math.round(totalFiber),
      totalCalories: Math.round(totalCalories)
    };
  };

  const { totalProtein: dayTotalProtein, totalFat: dayTotalFat, totalCarbs: dayTotalCarbs, totalFiber: dayTotalFiber, totalCalories: dayTotalCalories } = getDayTotalNutrition();
  const progressPct = Math.min(100, Math.round((dayTotalProtein / proteinTarget) * 100));
  const isGoalAchieved = dayTotalProtein >= proteinTarget;

  const filteredFoods = (foodReferences || []).filter((food) => {
    const fName = food.foodName || food.name || "";
    return fName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddFoodSelect = (food) => {
    if (!activeMealKey) return;
    
    const refQty = Number(food.referenceQuantity) || 100;
    const refUnit = food.referenceUnit || "g";

    // NO AI CALL HERE - Uses master food reference database values directly
    addFoodToMeal(selectedDay, activeMealKey, {
      foodReferenceId: food.id,
      id: food.id,
      foodName: food.foodName || food.name,
      name: food.foodName || food.name,
      referenceQuantity: refQty,
      referenceUnit: refUnit,
      proteinPerServing: Number(food.protein) || 0,
      protein: Number(food.protein) || 0,
      fat: Number(food.fat) || 0,
      carbs: Number(food.carbs) || 0,
      fiber: Number(food.fiber) || 0,
      calories: Number(food.calories) || Math.round((Number(food.protein) || 0) * 4),
      serving: food.serving || `${refQty}${refUnit}`,
      quantity: refQty,
      unit: refUnit
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

      {/* Protein & Macro Target Overview Header Card */}
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
              {isGoalAchieved ? "✓ Target Protein Reached!" : `${Math.max(0, proteinTarget - dayTotalProtein)}g remaining today`}
            </div>
          </div>
        </div>

        {/* Daily Macro Breakdown Summary Pill */}
        <div style={{ display: "flex", gap: "12px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)", padding: "12px 20px", borderRadius: "14px", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <span className="nothing-label" style={{ fontSize: "0.6rem" }}>CALORIES TODAY</span>
            <div style={{ fontSize: "1.4rem", fontWeight: "900", color: "var(--accent-push)" }}>
              {dayTotalCalories} <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>kcal</span>
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
          let mealCalories = 0;
          mealItems.forEach((item) => {
            const storedP = Number(item.proteinPerServing ?? item.protein ?? 0);
            const storedF = Number(item.fat ?? 0);
            const storedC = Number(item.carbs ?? 0);
            const storedCal = Number(item.calories ?? (storedP * 4 + storedC * 4 + storedF * 9));
            const refQ = Number(item.referenceQuantity) || 1;
            const selQ = Number(item.quantity) || 1;

            mealProtein += (storedP / refQ) * selQ;
            mealCalories += (storedCal / refQ) * selQ;
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

                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: "800", color: "var(--accent-protein)", fontSize: "1.1rem" }}>
                      {Math.round(mealProtein)}g
                    </span>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                      {Math.round(mealCalories)} kcal
                    </div>
                  </div>
                </div>

                {/* Logged Item Chips with Portion Scaling Controls */}
                <div className="meal-chip-list">
                  {mealItems.map((item, idx) => {
                    const storedP = Number(item.proteinPerServing ?? item.protein ?? 0);
                    const refQ = Number(item.referenceQuantity) || 1;
                    const selQ = Number(item.quantity) || 1;
                    const itemProt = Math.round((storedP / refQ) * selQ);
                    const unitLabel = item.referenceUnit || item.unit || "g";

                    return (
                      <div key={idx} className="food-item-chip" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>{item.foodName || item.name}</span>
                        <span style={{ fontWeight: "800", fontFamily: "var(--font-mono)", color: "var(--accent-protein)", fontSize: "0.75rem" }}>
                          {itemProt}g
                        </span>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "3px", background: "var(--bg-card)", padding: "2px 6px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                          <button 
                            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}
                            onClick={() => updateFoodQuantity(selectedDay, meal.key, idx, -10)}
                            title="Decrease portion"
                          >
                            <Minus size={10} />
                          </button>
                          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: "800" }}>
                            {selQ}{unitLabel}
                          </span>
                          <button 
                            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}
                            onClick={() => updateFoodQuantity(selectedDay, meal.key, idx, 10)}
                            title="Increase portion"
                          >
                            <Plus size={10} />
                          </button>
                        </div>

                        <button 
                          style={{ background: "none", border: "none", color: "var(--accent-protein)", cursor: "pointer", display: "flex", alignItems: "center", marginLeft: "2px" }}
                          onClick={() => {
                            setEditingLogItem({ mealKey: meal.key, index: idx, item });
                            setEditProtein(storedP);
                            setEditCalories(Number(item.calories ?? storedP * 4));
                            setEditQty(selQ);
                          }}
                          title="Manually edit protein / calories"
                        >
                          <Edit3 size={12} />
                        </button>

                        <button 
                          style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", marginLeft: "2px" }}
                          onClick={() => removeFoodFromMeal(selectedDay, meal.key, idx)}
                          title="Remove food"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
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
                placeholder="Search food master database..."
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
                    justifyContent: "space-between",
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
                    <div style={{ fontWeight: "700", fontSize: "0.9rem" }}>{food.foodName || food.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      Ref: {food.serving || `${food.referenceQuantity || 100}${food.referenceUnit || "g"}`}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontWeight: "800", fontFamily: "var(--font-mono)", color: "var(--accent-protein)", fontSize: "0.95rem", display: "block" }}>
                        {food.protein}g P
                      </span>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                        {food.calories || Math.round(food.protein * 4)} kcal
                      </span>
                    </div>
                    <Plus size={16} color="var(--text-secondary)" />
                  </div>
                </div>
              ))}

              {filteredFoods.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  No matching foods found in master database.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Edit Logged Food Item Modal Dialog */}
      {editingLogItem && (
        <div className="modal-overlay" onClick={() => setEditingLogItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "440px" }}>
            <div className="nothing-card-header" style={{ marginBottom: "16px" }}>
              <span className="nothing-title" style={{ fontSize: "1.1rem" }}>
                Edit Logged Food Protein
              </span>
              <button className="header-action-btn" onClick={() => setEditingLogItem(null)}>
                <X size={18} />
              </button>
            </div>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editingLogItem) return;
                await updateLoggedFoodItem(selectedDay, editingLogItem.mealKey, editingLogItem.index, {
                  proteinPerServing: Number(editProtein) || 0,
                  protein: Number(editProtein) || 0,
                  calories: Number(editCalories) || Math.round(Number(editProtein) * 4),
                  quantity: Number(editQty) || 1
                });
                setEditingLogItem(null);
              }} 
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--text-primary)" }}>
                {editingLogItem.item.foodName || editingLogItem.item.name}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>PROTEIN PER REFERENCE SERVING (G)</label>
                <div className="premium-input-box">
                  <input 
                    type="number" 
                    className="premium-inner-input" 
                    value={editProtein}
                    onChange={(e) => setEditProtein(Number(e.target.value))}
                    required
                  />
                  <span className="premium-input-unit">g</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>CALORIES (KCAL)</label>
                <div className="premium-input-box">
                  <input 
                    type="number" 
                    className="premium-inner-input" 
                    value={editCalories}
                    onChange={(e) => setEditCalories(Number(e.target.value))}
                    required
                  />
                  <span className="premium-input-unit">kcal</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>LOGGED PORTION QUANTITY ({editingLogItem.item.referenceUnit || editingLogItem.item.unit || "g"})</label>
                <div className="premium-input-box">
                  <input 
                    type="number" 
                    className="premium-inner-input" 
                    value={editQty}
                    onChange={(e) => setEditQty(Number(e.target.value))}
                    required
                  />
                  <span className="premium-input-unit">{editingLogItem.item.referenceUnit || editingLogItem.item.unit || "g"}</span>
                </div>
              </div>

              <button type="submit" className="btn-premium-primary" style={{ marginTop: "10px", height: "44px" }}>
                Save Protein & Portion Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
