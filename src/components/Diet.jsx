import React, { useState, useEffect, useRef } from "react";
import { usePlanner } from "../contexts/PlannerContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coffee, 
  Utensils, 
  Apple, 
  FlameKindling, 
  Plus, 
  Search,
  CheckCircle2
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
  { key: "dinner", label: "Dinner", icon: FlameKindling, glowClass: "glow-purple", accentColor: "var(--accent-protein)" }
];

export default function Diet() {
  const { profile, diets } = usePlanner();
  const [selectedDay, setSelectedDay] = useState("day1");

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
      dayDiet.meals[mealKey].forEach((item) => {
        total += (item.proteinPerServing || 0) * (item.quantity || 1);
      });
    });
    return total;
  };

  const dayTotalProtein = getDayTotalProtein();
  const progressPct = Math.min(100, Math.round((dayTotalProtein / proteinTarget) * 100));
  const isGoalAchieved = dayTotalProtein >= proteinTarget;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="diet-page-container"
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
            {selectedDay === day.key && (
              <motion.div 
                layoutId="activeDietDayTab" 
                className="segmented-pill-active-bg" 
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>{day.label}</span>
          </button>
        ))}
      </div>

      {/* Meals Grid layout */}
      <div className="diet-grid">
        {MEALS_CONFIG.map((meal) => (
          <MealPremiumCard
            key={meal.key}
            dayKey={selectedDay}
            mealKey={meal.key}
            mealLabel={meal.label}
            icon={meal.icon}
            glowClass={meal.glowClass}
            accentColor={meal.accentColor}
            mealItems={dayDiet.meals?.[meal.key] || []}
          />
        ))}
      </div>

      {/* Large Protein target tracker circle */}
      <div 
        className={`progress-ring-card ${isGoalAchieved ? "glow-green" : "glow-blue"}`} 
        style={{ maxWidth: "480px", margin: "0 auto", width: "100%", borderColor: isGoalAchieved ? "var(--accent-success)" : "var(--border-color)" }}
      >
        <div className="nothing-card-header" style={{ width: "100%", justifyContent: "center", marginBottom: "16px" }}>
          <span className="nothing-title" style={{ gap: "6px" }}>
            {isGoalAchieved && <CheckCircle2 size={18} color="var(--accent-success)" />}
            Daily Protein Progress
          </span>
        </div>

        <div className="circular-ring-container" style={{ width: "160px", height: "160px" }}>
          <svg width="160" height="160" style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="var(--border-color)"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke={isGoalAchieved ? "var(--accent-success)" : "var(--accent-protein)"}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray="439.82"
              strokeDashoffset={439.82 - (progressPct / 100) * 439.82}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
            />
          </svg>
          <div className="ring-percent-text" style={{ fontSize: "2.2rem" }}>{progressPct}%</div>
        </div>

        <div className="ring-sub-text" style={{ fontSize: "1.05rem", marginTop: "16px" }}>
          {dayTotalProtein}g / <span style={{ fontWeight: "700" }}>{proteinTarget}g</span> consumed
        </div>
      </div>
    </motion.div>
  );
}

// Meal Card panel
function MealPremiumCard({ dayKey, mealKey, mealLabel, icon: IconComponent, glowClass, accentColor, mealItems }) {
  const { addFoodToMeal, removeFoodFromMeal, updateFoodQuantity, foodReferences, profile } = usePlanner();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const mealTotalProtein = mealItems.reduce((acc, item) => {
    return acc + (item.proteinPerServing || 0) * (item.quantity || 1);
  }, 0);

  const filteredFoods = foodReferences.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (profile?.dietPreference === "veg") {
      const nonVegKeywords = ["chicken", "egg", "fish", "meat", "omelette", "beef", "pork", "turkey"];
      const isNonVeg = nonVegKeywords.some(kw => food.name.toLowerCase().includes(kw));
      return matchesSearch && !isNonVeg;
    }
    return matchesSearch;
  });

  const handleSelectFood = (food) => {
    addFoodToMeal(dayKey, mealKey, food, 1);
    setSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`meal-card-premium ${glowClass}`} style={{ borderColor: mealItems.length > 0 ? accentColor : "var(--border-color)" }}>
      <div>
        <div className="meal-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="exercise-icon-box" style={{ width: "32px", height: "32px", color: accentColor, borderColor: "rgba(255, 255, 255, 0.05)" }}>
              <IconComponent size={16} />
            </div>
            <span style={{ fontSize: "1rem", fontWeight: "700" }}>{mealLabel}</span>
          </div>
          <span className="nothing-label" style={{ fontSize: "0.85rem", color: accentColor, fontWeight: "700" }}>
            {mealTotalProtein}g
          </span>
        </div>

        <div className="meal-chip-list">
          {mealItems.map((item, index) => (
            <div key={index} className="food-item-chip" style={{ borderLeft: `2px solid ${accentColor}` }}>
              <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{item.name}</span>
              <span>{item.proteinPerServing * item.quantity}g</span>
              
              <div style={{ display: "flex", gap: "2px", marginLeft: "4px" }}>
                <button 
                  className="food-chip-remove" 
                  style={{ fontSize: "0.8rem", padding: "0 2px" }}
                  onClick={() => updateFoodQuantity(dayKey, mealKey, index, -1)}
                >
                  -
                </button>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", minWidth: "12px", textAlign: "center" }}>
                  {item.quantity}
                </span>
                <button 
                  className="food-chip-remove" 
                  style={{ fontSize: "0.8rem", padding: "0 2px" }}
                  onClick={() => updateFoodQuantity(dayKey, mealKey, index, 1)}
                >
                  +
                </button>
              </div>

              <button 
                className="food-chip-remove" 
                style={{ marginLeft: "4px" }}
                onClick={() => removeFoodFromMeal(dayKey, mealKey, index)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "relative" }} ref={dropdownRef}>
        <button 
          className="btn-premium-secondary" 
          style={{ width: "100%", height: "40px", borderRadius: "10px", fontSize: "0.8rem", gap: "6px" }}
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <Plus size={14} /> Add Food
        </button>

        {searchOpen && (
          <div className="profile-dropdown-menu" style={{ width: "100%", top: "calc(100% + 6px)", maxHeight: "200px", overflowY: "auto", padding: "8px" }}>
            <div className="premium-input-box" style={{ height: "32px", marginBottom: "8px", padding: "0 8px", borderRadius: "8px" }}>
              <Search size={12} color="var(--text-muted)" style={{ marginRight: "6px" }} />
              <input
                type="text"
                className="premium-inner-input"
                style={{ fontSize: "0.75rem" }}
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {filteredFoods.length > 0 ? (
                filteredFoods.map((food) => (
                  <button
                    key={food.id}
                    className="profile-dropdown-item"
                    style={{ padding: "6px 8px", fontSize: "0.75rem" }}
                    onClick={() => handleSelectFood(food)}
                  >
                    <span>{food.name}</span>
                    <span className="nothing-label" style={{ fontSize: "0.6rem" }}>{food.protein}g</span>
                  </button>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "10px", color: "var(--text-muted)", fontSize: "0.7rem", fontFamily: "var(--font-mono)" }}>
                  No matches
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

