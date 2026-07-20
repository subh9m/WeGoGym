import React, { useState, useEffect } from "react";
import { usePlanner } from "../contexts/PlannerContext";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Heart, 
  Compass,
  Leaf, 
  Milk, 
  Apple, 
  Wheat, 
  Flame, 
  Utensils, 
  X,
  Sparkles,
  AlertCircle,
  Check,
  Zap
} from "lucide-react";
import { analyzeFoodWithGemini } from "../services/aiService";

const FILTER_CHIPS = [
  { id: "all", label: "All Items", icon: Compass, activeClass: "active-all" },
  { id: "fav", label: "Favorites", icon: Heart, activeClass: "active-fav" },
  { id: "veg", label: "Vegetarian", icon: Leaf, activeClass: "active-veg" },
  { id: "nonveg", label: "Non-Veg", icon: Utensils, activeClass: "active-nonveg" },
  { id: "protein", label: "High Protein", icon: Flame, activeClass: "active-protein" },
  { id: "dairy", label: "Dairy", icon: Milk, activeClass: "active-dairy" },
  { id: "grains", label: "Grains", icon: Wheat, activeClass: "active-grains" },
  { id: "fruits", label: "Fruits & Veg", icon: Apple, activeClass: "active-fruits" }
];

const UNIT_OPTIONS = ["g", "ml", "piece", "cup", "oz", "tbsp", "serving"];

export default function FoodReference() {
  const { currentUser } = useAuth();
  const { foodReferences, addFoodRef, editFoodRef, deleteFoodRef } = usePlanner();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("wegogym_food_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  // Dialog State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Form Fields
  const [foodName, setFoodName] = useState("");
  const [refQuantity, setRefQuantity] = useState(100);
  const [refUnit, setRefUnit] = useState("g");
  const [protein, setProtein] = useState(20);
  const [calories, setCalories] = useState(150);
  const [categoryTag, setCategoryTag] = useState("Protein");
  const [isVegOption, setIsVegOption] = useState(true);

  // AI Estimation States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    localStorage.setItem("wegogym_food_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (foodId, e) => {
    e.stopPropagation();
    if (favorites.includes(foodId)) {
      setFavorites(favorites.filter(id => id !== foodId));
    } else {
      setFavorites([...favorites, foodId]);
    }
  };

  const isVegFood = (food) => {
    if (food.isVeg !== undefined) return Boolean(food.isVeg);
    if (food.category === "veg") return true;
    if (food.category === "nonveg") return false;
    const vegKeywords = ["milk", "paneer", "soya", "oats", "peanut", "banana", "dal", "rajma", "chana", "yogurt", "rice", "bread", "apple", "fruit", "curd"];
    const nameLower = (food.name || food.foodName || "").toLowerCase();
    return vegKeywords.some(kw => nameLower.includes(kw));
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setFoodName("");
    setRefQuantity(100);
    setRefUnit("g");
    setProtein(20);
    setCalories(150);
    setCategoryTag("Protein");
    setIsVegOption(true);
    setAiPreview(null);
    setAiError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (food, e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingId(food.id);
    setFoodName(food.foodName || food.name);
    setRefQuantity(food.referenceQuantity || parseInt(food.serving) || 100);
    setRefUnit(food.referenceUnit || "g");
    setProtein(food.protein || 0);
    setCalories(food.calories || Math.round((food.protein || 0) * 4));
    setCategoryTag(food.categoryTag || "Protein");
    setIsVegOption(isVegFood(food));
    setAiPreview(null);
    setAiError("");
    setModalOpen(true);
  };

  // AI Estimation Handler
  const handleAnalyzeWithAI = async () => {
    if (!foodName.trim()) {
      setAiError("Please enter a food name first.");
      return;
    }

    setAiError("");
    setIsAnalyzing(true);
    setAiPreview(null);

    try {
      const uid = currentUser ? currentUser.uid : null;
      const result = await analyzeFoodWithGemini(uid, foodName, refQuantity, refUnit);

      setProtein(result.protein);
      setCalories(result.calories);
      setAiPreview(result);

      if (result.lowConfidenceWarning) {
        setAiError(result.lowConfidenceWarning);
      }
    } catch (err) {
      console.error("AI estimation failed:", err);
      setAiError(err.message || "Unable to estimate nutrition.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!foodName.trim()) return;

    const payload = {
      foodName: foodName.trim(),
      name: foodName.trim(),
      referenceQuantity: Number(refQuantity) || 100,
      referenceUnit: refUnit,
      serving: `${refQuantity}${refUnit}`,
      protein: Number(protein) || 0,
      calories: Number(calories) || Math.round((Number(protein) || 0) * 4),
      categoryTag: categoryTag,
      isVeg: isVegOption,
      category: isVegOption ? "veg" : "nonveg",
      aiGenerated: Boolean(aiPreview && !aiPreview.cached),
      confidence: aiPreview ? aiPreview.confidence : 1.0
    };

    if (isEditing && editingId) {
      await editFoodRef(editingId, payload);
    } else {
      await addFoodRef(payload);
    }
    setModalOpen(false);
  };

  const getCategoryMeta = (food) => {
    const isVeg = isVegFood(food);
    const proteinVal = food.protein || 0;
    const foodTitle = (food.foodName || food.name || "").toLowerCase();

    if (food.category === "dairy" || foodTitle.includes("milk") || foodTitle.includes("paneer")) {
      return { label: isVeg ? "Dairy (Veg)" : "Dairy", icon: <Milk size={18} color="var(--accent-blue)" />, badgeClass: "muscle-pull" };
    }
    if (food.category === "grains" || foodTitle.includes("oats") || foodTitle.includes("chana")) {
      return { label: "Grains", icon: <Wheat size={18} color="var(--accent-abs)" />, badgeClass: "muscle-abs" };
    }
    if (food.category === "fruits" || foodTitle.includes("banana") || foodTitle.includes("apple")) {
      return { label: "Fruit/Veg", icon: <Apple size={18} color="var(--accent-legs)" />, badgeClass: "muscle-legs" };
    }
    if (proteinVal >= 25) {
      return { label: "High Protein", icon: <Flame size={18} color="var(--accent-protein)" />, badgeClass: "muscle-push" };
    }
    if (isVeg) {
      return { label: "Vegetarian", icon: <Leaf size={18} color="var(--accent-legs)" />, badgeClass: "muscle-legs" };
    }
    return { label: "Non-Veg", icon: <Utensils size={18} color="var(--accent-push)" />, badgeClass: "muscle-push" };
  };

  const filteredFoods = (foodReferences || []).filter((food) => {
    const fname = food.foodName || food.name || "";
    const matchesSearch = fname.toLowerCase().includes(searchQuery.toLowerCase());
    const isFav = favorites.includes(food.id);
    const isVeg = isVegFood(food);

    if (activeCategory === "fav") return isFav && matchesSearch;
    if (activeCategory === "veg") return isVeg && matchesSearch;
    if (activeCategory === "nonveg") return !isVeg && matchesSearch;
    if (activeCategory === "protein") return food.protein >= 20 && matchesSearch;
    
    return matchesSearch;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.25 }}
      style={{ display: "flex", flexDirection: "column", gap: "20px" }}
    >
      {/* Page Title & Search Toolbar */}
      <div style={{ margin: "8px 0" }}>
        <h1 className="nothing-title" style={{ fontSize: "1.6rem", marginBottom: "4px" }}>
          Food Library
        </h1>
        <p className="nothing-label" style={{ fontSize: "0.75rem" }}>
          Master Nutrition Database & Gemini AI Assisted Entries
        </p>
      </div>

      <div className="search-toolbar-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div className="premium-input-box" style={{ flex: 1 }}>
          <Search size={18} color="var(--text-secondary)" style={{ marginRight: "10px" }} />
          <input 
            type="text" 
            className="premium-inner-input" 
            placeholder="Search master food entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button className="btn-premium-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Add Food
        </button>
      </div>

      {/* Category Filter Chips Bar */}
      <div className="category-filter-bar">
        {FILTER_CHIPS.map((chip) => {
          const Icon = chip.icon;
          const isActive = activeCategory === chip.id;
          return (
            <button
              key={chip.id}
              className={`category-filter-pill ${isActive ? chip.activeClass : ""}`}
              onClick={() => setActiveCategory(chip.id)}
            >
              <Icon size={16} />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Food Cards Grid */}
      <div className="food-grid-layout">
        {filteredFoods.map((food) => {
          const isFav = favorites.includes(food.id);
          const meta = getCategoryMeta(food);
          const displayCals = food.calories || Math.round((food.protein || 0) * 4);

          return (
            <motion.div 
              key={food.id}
              className="food-library-card glow-white"
              whileHover={{ y: -3 }}
            >
              <div>
                {/* Non-overlapping Card Top Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", minWidth: 0, flex: 1 }}>
                    <div className="exercise-icon-box" style={{ width: "42px", height: "42px", flexShrink: 0, borderRadius: "12px", background: "var(--bg-secondary)" }}>
                      {meta.icon}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
                      <span style={{ fontSize: "1rem", fontWeight: "800", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {food.foodName || food.name}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "500" }}>
                        {food.serving || `${food.referenceQuantity || 100}${food.referenceUnit || "g"}`}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                    <span style={{ fontSize: "1.3rem", fontWeight: "900", fontFamily: "var(--font-mono)", color: "var(--text-primary)", lineHeight: 1 }}>
                      {food.protein}g
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--accent-push)", fontWeight: "700", marginTop: "2px" }}>
                      {displayCals} kcal
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions & Category Badge Footer Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className={`exercise-badge-muscle ${meta.badgeClass}`} style={{ fontSize: "0.6rem", margin: 0 }}>
                    {meta.label}
                  </span>
                  {food.aiGenerated && (
                    <span style={{ fontSize: "0.55rem", background: "rgba(168, 85, 247, 0.15)", color: "var(--accent-protein)", border: "1px solid var(--accent-protein)", padding: "2px 6px", borderRadius: "8px", fontWeight: "700", display: "flex", alignItems: "center", gap: "3px" }}>
                      <Sparkles size={10} /> AI
                    </span>
                  )}
                </div>

                <div className="food-card-actions">
                  <button 
                    className={`icon-action-btn fav-btn ${isFav ? "fav-active" : ""}`}
                    onClick={(e) => toggleFavorite(food.id, e)}
                    title={isFav ? "Remove favorite" : "Add favorite"}
                  >
                    <Heart size={15} fill={isFav ? "currentColor" : "none"} />
                  </button>

                  <button 
                    className="icon-action-btn edit-btn"
                    onClick={(e) => handleOpenEdit(food, e)}
                    title="Edit food"
                  >
                    <Edit3 size={15} />
                  </button>

                  <button 
                    className="icon-action-btn delete-btn"
                    onClick={(e) => { e.stopPropagation(); deleteFoodRef(food.id); }}
                    title="Delete food"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Add / Edit Food Modal Dialog */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="nothing-card-header" style={{ marginBottom: "16px" }}>
              <span className="nothing-title" style={{ fontSize: "1.1rem" }}>
                {isEditing ? "Edit Food Entry" : "Create Master Food Entry"}
              </span>
              <button className="header-action-btn" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Food Name Input */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>FOOD NAME</label>
                <div className="premium-input-box">
                  <input 
                    type="text" 
                    className="premium-inner-input" 
                    placeholder="e.g. Chicken Breast, Paneer, Milk, Banana"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Reference Quantity & Unit Selection Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="nothing-label" style={{ fontSize: "0.65rem" }}>REFERENCE QUANTITY</label>
                  <div className="premium-input-box">
                    <input 
                      type="number" 
                      className="premium-inner-input" 
                      placeholder="100"
                      value={refQuantity}
                      onChange={(e) => setRefQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="nothing-label" style={{ fontSize: "0.65rem" }}>REFERENCE UNIT</label>
                  <select 
                    className="premium-input-box"
                    style={{ height: "42px", background: "var(--bg-secondary)", padding: "0 12px", fontSize: "0.85rem", fontWeight: "700" }}
                    value={refUnit}
                    onChange={(e) => setRefUnit(e.target.value)}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* "Analyze with AI" Action Trigger Button */}
              <button 
                type="button" 
                className="btn-premium-secondary" 
                onClick={handleAnalyzeWithAI}
                disabled={isAnalyzing}
                style={{ height: "44px", border: "1px solid var(--accent-protein)", color: "var(--accent-protein)", justifyContent: "center" }}
              >
                <Sparkles size={16} />
                {isAnalyzing ? "Estimating with Gemini AI..." : "Analyze with AI"}
              </button>

              {/* AI Loading State Banner */}
              {isAnalyzing && (
                <div style={{ background: "rgba(168, 85, 247, 0.1)", border: "1px solid var(--accent-protein)", color: "var(--accent-protein)", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                  <Sparkles className="spin-slow" size={18} /> ✨ Estimating nutrition with Gemini AI...
                </div>
              )}

              {/* AI Preview Box */}
              {aiPreview && !isAnalyzing && (
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--accent-protein)", padding: "14px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "var(--accent-protein)", display: "flex", alignItems: "center", gap: "6px" }}>
                      {aiPreview.cached ? <Zap size={14} /> : <Sparkles size={14} />} 
                      {aiPreview.cached ? "Loaded from Master Cache" : "Gemini AI Nutrition Preview"}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                      Confidence: {Math.round((aiPreview.confidence || 0.9) * 100)}%
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ background: "var(--bg-card)", padding: "10px", borderRadius: "10px" }}>
                      <span className="nothing-label" style={{ fontSize: "0.6rem" }}>ESTIMATED PROTEIN</span>
                      <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "var(--text-primary)" }}>{aiPreview.protein}g</div>
                    </div>

                    <div style={{ background: "var(--bg-card)", padding: "10px", borderRadius: "10px" }}>
                      <span className="nothing-label" style={{ fontSize: "0.6rem" }}>ESTIMATED CALORIES</span>
                      <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "var(--accent-push)" }}>{aiPreview.calories} kcal</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error / Low Confidence Alert */}
              {aiError && (
                <div className="auth-error-msg" style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                  <AlertCircle size={16} /> {aiError}
                </div>
              )}

              {/* Protein & Calories Numeric Preview / Edit Inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="nothing-label" style={{ fontSize: "0.65rem" }}>PROTEIN (GRAMS)</label>
                  <div className="premium-input-box">
                    <input 
                      type="number" 
                      className="premium-inner-input" 
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
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
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      required
                    />
                    <span className="premium-input-unit">kcal</span>
                  </div>
                </div>
              </div>

              {/* Diet Type Selection */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>DIET TYPE</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn-premium-secondary"
                    style={{ flex: 1, height: "42px", background: isVegOption ? "var(--text-primary)" : "transparent", color: isVegOption ? "var(--bg-primary)" : "var(--text-primary)" }}
                    onClick={() => setIsVegOption(true)}
                  >
                    Vegetarian
                  </button>
                  <button
                    type="button"
                    className="btn-premium-secondary"
                    style={{ flex: 1, height: "42px", background: !isVegOption ? "var(--text-primary)" : "transparent", color: !isVegOption ? "var(--bg-primary)" : "var(--text-primary)" }}
                    onClick={() => setIsVegOption(false)}
                  >
                    Non-Veg
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-premium-primary" style={{ marginTop: "10px", height: "46px" }}>
                {isEditing ? "Save Entry Changes" : "Save to Master Food Library"}
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
