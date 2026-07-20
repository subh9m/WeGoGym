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
  Zap,
  Layers,
  Check,
  RefreshCw
} from "lucide-react";
import { fetchNutritionDetails, fetchNutritionBatchWithQueue } from "../services/aiService";

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

const UNIT_OPTIONS = ["g", "qty", "piece", "ml", "cup", "serving"];
const FOOD_TYPE_OPTIONS = ["protein", "grain", "dairy", "vegetable", "fruit", "meat", "seafood", "legumes", "nuts", "supplement", "beverage", "snack"];

export default function FoodReference() {
  const { currentUser } = useAuth();
  const { foodReferences, addFoodRef, addBatchFoodRefs, editFoodRef, deleteFoodRef } = usePlanner();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("wegogym_food_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  // Single Item Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Single Item Form Fields
  const [foodName, setFoodName] = useState("");
  const [refQuantity, setRefQuantity] = useState(100);
  const [refUnit, setRefUnit] = useState("g");
  const [protein, setProtein] = useState(20);
  const [fat, setFat] = useState(2);
  const [carbs, setCarbs] = useState(5);
  const [fiber, setFiber] = useState(1);
  const [calories, setCalories] = useState(120);
  const [foodType, setFoodType] = useState("protein");
  const [isVegOption, setIsVegOption] = useState(true);

  // Single AI Estimation States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [aiError, setAiError] = useState("");

  // Batch Processing Modal State
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchInputText, setBatchInputText] = useState("");
  const [pendingBatchFoods, setPendingBatchFoods] = useState([
    { foodName: "", referenceQuantity: 100, referenceUnit: "g" }
  ]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, text: "" });
  const [batchResults, setBatchResults] = useState(null);

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

  // Base reference nutrition state for real-time scaling
  const [baseNutrition, setBaseNutrition] = useState(null);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setBaseNutrition(null);
    setFoodName("");
    setRefQuantity(100);
    setRefUnit("g");
    setProtein(0);
    setFat(0);
    setCarbs(0);
    setFiber(0);
    setCalories(0);
    setFoodType("protein");
    setIsVegOption(true);
    setAiPreview(null);
    setAiError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (food, e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingId(food.id);
    const refQ = food.referenceQuantity || parseInt(food.serving) || 100;
    setBaseNutrition({
      foodName: (food.foodName || food.name || "").trim().toLowerCase(),
      protein: food.protein || 0,
      fat: food.fat || 0,
      carbs: food.carbs || 0,
      fiber: food.fiber || 0,
      calories: food.calories || Math.round((food.protein || 0) * 4),
      quantity: refQ
    });
    setFoodName(food.foodName || food.name);
    setRefQuantity(refQ);
    setRefUnit(food.referenceUnit || "g");
    setProtein(food.protein || 0);
    setFat(food.fat || 0);
    setCarbs(food.carbs || 0);
    setFiber(food.fiber || 0);
    setCalories(food.calories || Math.round((food.protein || 0) * 4));
    setFoodType(food.foodType || food.categoryTag || "protein");
    setIsVegOption(isVegFood(food));
    setAiPreview(null);
    setAiError("");
    setModalOpen(true);
  };

  // Real-time calculation when user changes reference quantity
  const handleRefQuantityChange = (newVal) => {
    const newQty = Math.max(1, parseInt(newVal) || 1);
    setRefQuantity(newQty);

    if (baseNutrition && baseNutrition.quantity > 0) {
      const scale = newQty / baseNutrition.quantity;
      setProtein(Math.round(baseNutrition.protein * scale));
      setFat(Math.round(baseNutrition.fat * scale));
      setCarbs(Math.round(baseNutrition.carbs * scale));
      setFiber(Math.round(baseNutrition.fiber * scale));
      setCalories(Math.round(baseNutrition.calories * scale));
    }
  };

  // Single Item: Fetch Details Handler
  const handleFetchDetails = async (overrideName, overrideQty, overrideUnit) => {
    const targetName = (overrideName !== undefined ? overrideName : foodName).trim();
    const targetQty = Number(overrideQty !== undefined ? overrideQty : refQuantity) || 100;
    const targetUnit = overrideUnit || refUnit;

    if (!targetName) {
      setAiError("Please enter a food name first.");
      return;
    }

    setAiError("");
    setIsAnalyzing(true);

    try {
      const uid = currentUser ? currentUser.uid : null;
      const result = await fetchNutritionDetails(uid, targetName, targetQty, targetUnit);

      const refQ = Number(result.referenceQuantity) || targetQty;
      setBaseNutrition({
        foodName: targetName.toLowerCase(),
        protein: result.protein,
        fat: result.fat,
        carbs: result.carbs,
        fiber: result.fiber,
        calories: result.calories,
        quantity: refQ
      });

      setProtein(result.protein);
      setFat(result.fat);
      setCarbs(result.carbs);
      setFiber(result.fiber);
      setCalories(result.calories);
      setFoodType(result.foodType || "protein");
      setAiPreview(result);

      if (["meat", "seafood"].includes(result.foodType)) {
        setIsVegOption(false);
      }
    } catch (err) {
      console.error("Fetch Details failed:", err);
      setAiError(err.message || "Unable to fetch nutrition details.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-fetch details on foodName blur
  const handleFoodNameBlur = () => {
    if (!foodName.trim() || foodName.trim().length < 2) return;
    if (!baseNutrition || baseNutrition.foodName !== foodName.trim().toLowerCase()) {
      handleFetchDetails(foodName, refQuantity, refUnit);
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
      fat: Number(fat) || 0,
      carbs: Number(carbs) || 0,
      fiber: Number(fiber) || 0,
      calories: Number(calories) || Math.round((Number(protein) || 0) * 4 + (Number(carbs) || 0) * 4 + (Number(fat) || 0) * 9),
      foodType: foodType,
      categoryTag: foodType.toUpperCase(),
      isVeg: isVegOption,
      category: isVegOption ? "veg" : "nonveg",
      aiGenerated: Boolean(aiPreview && aiPreview.source === "gemini_ai"),
      source: aiPreview ? aiPreview.source : "manual",
      confidence: aiPreview ? aiPreview.confidence : 1.0,
      verified: true
    };

    if (isEditing && editingId) {
      await editFoodRef(editingId, payload);
    } else {
      await addFoodRef(payload);
    }
    setModalOpen(false);
  };

  // Batch Processing Handlers
  const handleOpenBatchModal = () => {
    setPendingBatchFoods([
      { foodName: "", referenceQuantity: 100, referenceUnit: "g" }
    ]);
    setBatchInputText("");
    setBatchResults(null);
    setBatchProgress({ current: 0, total: 0, text: "" });
    setBatchModalOpen(true);
  };

  const handleAddBatchRow = () => {
    setPendingBatchFoods([
      ...pendingBatchFoods,
      { foodName: "", referenceQuantity: 100, referenceUnit: "g" }
    ]);
  };

  const handleRemoveBatchRow = (index) => {
    setPendingBatchFoods(pendingBatchFoods.filter((_, i) => i !== index));
  };

  const handleUpdateBatchRow = (index, field, val) => {
    const updated = [...pendingBatchFoods];
    updated[index][field] = val;
    setPendingBatchFoods(updated);
  };

  const parseTextToFoods = (text) => {
    if (!text || !text.trim()) return [];
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    return lines.map(line => {
      const match = line.match(/^(.+?)\s+(\d+)\s*(g|ml|piece|cup|oz|tbsp|serving)?$/i);
      if (match) {
        return {
          foodName: match[1].trim(),
          referenceQuantity: parseInt(match[2]) || 100,
          referenceUnit: match[3] ? match[3].toLowerCase() : "g"
        };
      }
      return { foodName: line, referenceQuantity: 100, referenceUnit: "g" };
    });
  };

  const handleBatchTextChange = (text) => {
    setBatchInputText(text);
    const parsed = parseTextToFoods(text);
    if (parsed.length > 0) {
      setPendingBatchFoods(parsed);
    }
  };

  const handleParseBatchText = () => {
    const parsed = parseTextToFoods(batchInputText);
    if (parsed.length > 0) {
      setPendingBatchFoods(parsed);
    }
  };

  const getBatchItemsCount = () => {
    const fromRows = pendingBatchFoods.filter(f => f.foodName && f.foodName.trim()).length;
    if (fromRows > 0) return fromRows;
    return parseTextToFoods(batchInputText).length;
  };

  const handleExecuteBatchFetch = async () => {
    let validFoods = pendingBatchFoods.filter(f => f.foodName && f.foodName.trim());
    if (validFoods.length === 0 && batchInputText.trim()) {
      validFoods = parseTextToFoods(batchInputText);
      setPendingBatchFoods(validFoods);
    }
    if (validFoods.length === 0) return;

    setBatchProcessing(true);
    setBatchResults(null);

    const uid = currentUser ? currentUser.uid : null;
    const results = await fetchNutritionBatchWithQueue(uid, validFoods, (progress) => {
      setBatchProgress(progress);
    });

    setBatchResults(results);
    setBatchProcessing(false);
  };

  // 1-Click Fetch Details for ALL existing Food Library items at once
  const handleFetchAllExistingItems = async () => {
    if (!foodReferences || foodReferences.length === 0) return;

    setBatchProcessing(true);
    setBatchResults(null);

    const uid = currentUser ? currentUser.uid : null;
    const itemsToFetch = foodReferences.map(f => ({
      id: f.id,
      foodName: f.foodName || f.name,
      referenceQuantity: f.referenceQuantity || parseInt(f.serving) || 100,
      referenceUnit: f.referenceUnit || "g"
    }));

    const results = await fetchNutritionBatchWithQueue(uid, itemsToFetch, (progress) => {
      setBatchProgress(progress);
    });

    for (const res of results) {
      if (res.id && !res.error) {
        await editFoodRef(res.id, {
          foodName: res.foodName,
          name: res.foodName,
          referenceQuantity: res.referenceQuantity,
          referenceUnit: res.referenceUnit,
          serving: `${res.referenceQuantity}${res.referenceUnit}`,
          protein: res.protein,
          fat: res.fat,
          carbs: res.carbs,
          fiber: res.fiber,
          calories: res.calories,
          foodType: res.foodType,
          categoryTag: (res.foodType || "PROTEIN").toUpperCase(),
          isVeg: !["meat", "seafood"].includes(res.foodType),
          category: !["meat", "seafood"].includes(res.foodType) ? "veg" : "nonveg",
          aiGenerated: res.source === "gemini_ai",
          source: res.source || "gemini_ai",
          confidence: res.confidence || 0.95,
          verified: true
        });
      }
    }

    setBatchProcessing(false);
    setBatchModalOpen(false);
  };

  const handleSaveAllBatchResults = async () => {
    if (!batchResults || batchResults.length === 0) return;
    const itemsToSave = batchResults.map(item => {
      const isVeg = !["meat", "seafood"].includes(item.foodType);
      return {
        foodName: item.foodName,
        name: item.foodName,
        referenceQuantity: Number(item.referenceQuantity) || 100,
        referenceUnit: item.referenceUnit || "g",
        serving: `${item.referenceQuantity || 100}${item.referenceUnit || "g"}`,
        protein: Number(item.protein) || 0,
        fat: Number(item.fat) || 0,
        carbs: Number(item.carbs) || 0,
        fiber: Number(item.fiber) || 0,
        calories: Number(item.calories) || Math.round((Number(item.protein) || 0) * 4),
        foodType: item.foodType || "protein",
        categoryTag: (item.foodType || "PROTEIN").toUpperCase(),
        isVeg: isVeg,
        category: isVeg ? "veg" : "nonveg",
        aiGenerated: item.source === "gemini_ai",
        source: item.source || "gemini_ai",
        confidence: item.confidence || 0.95,
        verified: true
      };
    });

    await addBatchFoodRefs(itemsToSave);
    setBatchModalOpen(false);
  };

  const getCategoryMeta = (food) => {
    const isVeg = isVegFood(food);
    const proteinVal = food.protein || 0;
    const type = (food.foodType || food.category || "").toLowerCase();
    const foodTitle = (food.foodName || food.name || "").toLowerCase();

    if (type === "dairy" || foodTitle.includes("milk") || foodTitle.includes("paneer")) {
      return { label: isVeg ? "Dairy (Veg)" : "Dairy", icon: <Milk size={18} color="var(--accent-blue)" />, badgeClass: "muscle-pull" };
    }
    if (type === "grain" || type === "grains" || foodTitle.includes("oats") || foodTitle.includes("chana")) {
      return { label: "Grains", icon: <Wheat size={18} color="var(--accent-abs)" />, badgeClass: "muscle-abs" };
    }
    if (type === "fruit" || type === "vegetable" || type === "fruits" || foodTitle.includes("banana") || foodTitle.includes("apple")) {
      return { label: "Fruit/Veg", icon: <Apple size={18} color="var(--accent-legs)" />, badgeClass: "muscle-legs" };
    }
    if (proteinVal >= 25 || type === "protein" || type === "meat" || type === "seafood") {
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

      <div className="search-toolbar-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div className="premium-input-box" style={{ flex: 1, minWidth: "220px" }}>
          <Search size={18} color="var(--text-secondary)" style={{ marginRight: "10px" }} />
          <input 
            type="text" 
            className="premium-inner-input" 
            placeholder="Search master food entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button className="btn-premium-secondary" onClick={handleOpenBatchModal} style={{ gap: "6px" }}>
            <Layers size={18} color="var(--accent-protein)" /> Batch Fetch
          </button>

          <button className="btn-premium-primary" onClick={handleOpenAdd}>
            <Plus size={18} /> Add Food
          </button>
        </div>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className={`exercise-badge-muscle ${meta.badgeClass}`} style={{ fontSize: "0.6rem", margin: 0 }}>
                    {meta.label}
                  </span>
                  {food.aiGenerated && (
                    <span style={{ fontSize: "0.55rem", background: "rgba(168, 85, 247, 0.15)", color: "var(--accent-protein)", border: "1px solid var(--accent-protein)", padding: "2px 6px", borderRadius: "8px", fontWeight: "700", display: "flex", alignItems: "center", gap: "3px" }}>
                      <Sparkles size={10} /> AI
                    </span>
                  )}
                  {food.source === "cache" && (
                    <span style={{ fontSize: "0.55rem", background: "rgba(59, 130, 246, 0.15)", color: "var(--accent-blue)", border: "1px solid var(--accent-blue)", padding: "2px 6px", borderRadius: "8px", fontWeight: "700", display: "flex", alignItems: "center", gap: "3px" }}>
                      <Zap size={10} /> Cache
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px" }}>
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
                    placeholder="e.g. Chicken Breast, Paneer, Milk, Oats"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    onBlur={handleFoodNameBlur}
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
                      onChange={(e) => handleRefQuantityChange(e.target.value)}
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

              {/* "Fetch Details" Action Trigger Button */}
              <button 
                type="button" 
                className="btn-premium-secondary" 
                onClick={handleFetchDetails}
                disabled={isAnalyzing}
                style={{ height: "44px", border: "1px solid var(--accent-protein)", color: "var(--accent-protein)", justifyContent: "center" }}
              >
                <Sparkles size={16} />
                {isAnalyzing ? "Fetching Details..." : "Fetch Details"}
              </button>

              {/* AI Loading State Banner */}
              {isAnalyzing && (
                <div style={{ background: "rgba(168, 85, 247, 0.1)", border: "1px solid var(--accent-protein)", color: "var(--accent-protein)", padding: "12px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
                  <Sparkles className="spin-slow" size={18} /> ✨ Fetching nutrition profile via Gemini AI...
                </div>
              )}

              {/* AI / Cache Preview Box */}
              {aiPreview && !isAnalyzing && (
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--accent-protein)", padding: "14px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "var(--accent-protein)", display: "flex", alignItems: "center", gap: "6px" }}>
                      {aiPreview.source === "cache" ? <Zap size={14} /> : <Sparkles size={14} />} 
                      {aiPreview.source === "cache" ? "Loaded from Master Cache" : "Gemini AI Nutrition Preview"}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                      Confidence: {Math.round((aiPreview.confidence || 0.95) * 100)}%
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div style={{ background: "var(--bg-card)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                      <span className="nothing-label" style={{ fontSize: "0.6rem" }}>PROTEIN</span>
                      <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "var(--text-primary)" }}>{protein}g</div>
                    </div>

                    <div style={{ background: "var(--bg-card)", padding: "10px", borderRadius: "10px", textAlign: "center" }}>
                      <span className="nothing-label" style={{ fontSize: "0.6rem" }}>CALORIES</span>
                      <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "var(--accent-push)" }}>{calories} kcal</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {aiError && (
                <div className="auth-error-msg" style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                  <AlertCircle size={16} /> {aiError}
                </div>
              )}

              {/* Diet Type Selection */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>DIET TYPE</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn-premium-secondary"
                    style={{ flex: 1, height: "40px", background: isVegOption ? "var(--text-primary)" : "transparent", color: isVegOption ? "var(--bg-primary)" : "var(--text-primary)" }}
                    onClick={() => setIsVegOption(true)}
                  >
                    Vegetarian
                  </button>
                  <button
                    type="button"
                    className="btn-premium-secondary"
                    style={{ flex: 1, height: "40px", background: !isVegOption ? "var(--text-primary)" : "transparent", color: !isVegOption ? "var(--bg-primary)" : "var(--text-primary)" }}
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

      {/* Batch Food Processing Modal Dialog */}
      {batchModalOpen && (
        <div className="modal-overlay" onClick={() => !batchProcessing && setBatchModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
            <div className="nothing-card-header" style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Layers size={22} color="var(--accent-protein)" />
                <span className="nothing-title" style={{ fontSize: "1.2rem" }}>
                  Batch Fetch Food Nutrition
                </span>
              </div>
              {!batchProcessing && (
                <button className="header-action-btn" onClick={() => setBatchModalOpen(false)}>
                  <X size={18} />
                </button>
              )}
            </div>

            {/* 1-Click Fetch All Existing Food Library Items Button */}
            {!batchResults && !batchProcessing && foodReferences && foodReferences.length > 0 && (
              <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--accent-protein)", padding: "14px", borderRadius: "12px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <div>
                  <div style={{ fontWeight: "800", fontSize: "0.9rem", color: "var(--text-primary)" }}>
                    Fetch Nutrition for All Library Items ({foodReferences.length})
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                    Automatically fetch protein, fat, carbs, fiber & calories for all items in your library at once.
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-premium-primary glow-white" 
                  onClick={handleFetchAllExistingItems}
                  style={{ height: "40px", padding: "0 18px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                >
                  <Zap size={16} /> Fetch All {foodReferences.length} Items
                </button>
              </div>
            )}

            {/* Step 1: Bulk Paste or Add Row Input */}
            {!batchResults && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Bulk Paste Box */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label className="nothing-label" style={{ fontSize: "0.65rem" }}>
                    BULK PASTE FOODS (ONE PER LINE, OPTIONAL QTY E.G. "Oats 50g")
                  </label>
                  <textarea 
                    rows={3} 
                    className="premium-inner-input"
                    style={{ background: "var(--bg-secondary)", padding: "10px", borderRadius: "10px", border: "1px solid var(--border-color)", resize: "vertical" }}
                    placeholder="Chicken Breast 150g&#10;Paneer 100g&#10;Banana 1 piece&#10;Almonds 30g"
                    value={batchInputText}
                    onChange={(e) => handleBatchTextChange(e.target.value)}
                  />
                </div>

                {/* Queue Items Table */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "260px", overflowY: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="nothing-label" style={{ fontSize: "0.65rem" }}>
                      PENDING FOOD QUEUE ({getBatchItemsCount()} ITEMS)
                    </label>
                  </div>

                  {pendingBatchFoods.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <div className="premium-input-box" style={{ flex: 2 }}>
                        <input 
                          type="text" 
                          className="premium-inner-input" 
                          placeholder={`Food Name #${idx + 1}`}
                          value={item.foodName}
                          onChange={(e) => handleUpdateBatchRow(idx, "foodName", e.target.value)}
                          disabled={batchProcessing}
                        />
                      </div>

                      <div className="premium-input-box" style={{ flex: 1, maxWidth: "90px" }}>
                        <input 
                          type="number" 
                          className="premium-inner-input" 
                          placeholder="100"
                          value={item.referenceQuantity}
                          onChange={(e) => handleUpdateBatchRow(idx, "referenceQuantity", Math.max(1, parseInt(e.target.value) || 1))}
                          disabled={batchProcessing}
                        />
                      </div>

                      <select 
                        className="premium-input-box"
                        style={{ width: "80px", height: "42px", background: "var(--bg-secondary)", padding: "0 8px", fontSize: "0.8rem", fontWeight: "700" }}
                        value={item.referenceUnit}
                        onChange={(e) => handleUpdateBatchRow(idx, "referenceUnit", e.target.value)}
                        disabled={batchProcessing}
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>

                      {pendingBatchFoods.length > 1 && !batchProcessing && (
                        <button 
                          className="icon-action-btn delete-btn" 
                          onClick={() => handleRemoveBatchRow(idx)}
                          title="Remove item"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <button 
                    type="button" 
                    className="btn-premium-secondary" 
                    onClick={handleAddBatchRow}
                    disabled={batchProcessing}
                    style={{ height: "36px", fontSize: "0.8rem" }}
                  >
                    <Plus size={14} /> Add Row
                  </button>

                  <button 
                    type="button" 
                    className="btn-premium-primary glow-white" 
                    onClick={handleExecuteBatchFetch}
                    disabled={batchProcessing || getBatchItemsCount() === 0}
                    style={{ height: "44px", padding: "0 28px", fontWeight: "800" }}
                  >
                    <Sparkles size={16} /> Fetch Details ({getBatchItemsCount()})
                  </button>
                </div>

                {/* Batch Processing Live Progress Bar */}
                {batchProcessing && (
                  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--accent-protein)", padding: "16px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "700", color: "var(--accent-protein)", display: "flex", alignItems: "center", gap: "8px" }}>
                        <RefreshCw className="spin-slow" size={18} /> {batchProgress.text || "Analyzing..."}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: "800" }}>
                        {batchProgress.current} / {batchProgress.total}
                      </span>
                    </div>

                    <div style={{ width: "100%", height: "8px", background: "var(--bg-card)", borderRadius: "4px", overflow: "hidden" }}>
                      <div 
                        style={{ 
                          height: "100%", 
                          background: "var(--accent-protein)", 
                          width: `${Math.round((batchProgress.current / Math.max(1, batchProgress.total)) * 100)}%`,
                          transition: "width 0.3s ease"
                        }} 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Batch Results Preview & Confirmation */}
            {batchResults && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid var(--accent-success)", color: "var(--accent-success)", padding: "12px", borderRadius: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
                  <Check size={18} /> Batch Fetch Complete! Review estimated values before saving.
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "360px", overflowY: "auto" }}>
                  {batchResults.map((res, i) => (
                    <div key={i} style={{ background: "var(--bg-secondary)", padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                      <div>
                        <div style={{ fontWeight: "800", fontSize: "0.95rem" }}>{res.foodName}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          Ref: {res.referenceQuantity}{res.referenceUnit} | Type: {res.foodType || "protein"}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontWeight: "900", fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontSize: "1rem" }}>
                            {res.protein}g P
                          </span>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                            F:{res.fat ?? 0}g | C:{res.carbs ?? 0}g | {res.calories} kcal
                          </div>
                        </div>

                        {res.source === "cache" ? (
                          <span style={{ fontSize: "0.6rem", background: "rgba(59, 130, 246, 0.15)", color: "var(--accent-blue)", padding: "3px 8px", borderRadius: "8px", fontWeight: "700" }}>
                            Cache
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.6rem", background: "rgba(168, 85, 247, 0.15)", color: "var(--accent-protein)", padding: "3px 8px", borderRadius: "8px", fontWeight: "700" }}>
                            Gemini AI
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button 
                    type="button" 
                    className="btn-premium-secondary" 
                    onClick={() => setBatchResults(null)}
                  >
                    Back to Queue
                  </button>

                  <button 
                    type="button" 
                    className="btn-premium-primary" 
                    onClick={handleSaveAllBatchResults}
                    style={{ padding: "0 24px" }}
                  >
                    Save All to Master Library ({batchResults.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
