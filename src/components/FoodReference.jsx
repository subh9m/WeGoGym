import React, { useState, useEffect } from "react";
import { usePlanner } from "../contexts/PlannerContext";
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
  X
} from "lucide-react";

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

export default function FoodReference() {
  const { foodReferences, addFoodRef, editFoodRef, deleteFoodRef } = usePlanner();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("wegogym_food_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [foodName, setFoodName] = useState("");
  const [serving, setServing] = useState("");
  const [protein, setProtein] = useState(10);
  const [categoryTag, setCategoryTag] = useState("Protein");
  const [isVegOption, setIsVegOption] = useState(true);

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
    const nameLower = (food.name || "").toLowerCase();
    return vegKeywords.some(kw => nameLower.includes(kw));
  };

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setFoodName("");
    setServing("100g");
    setProtein(15);
    setCategoryTag("Protein");
    setIsVegOption(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (food, e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditingId(food.id);
    setFoodName(food.name);
    setServing(food.serving);
    setProtein(food.protein);
    setCategoryTag(food.categoryTag || "Protein");
    setIsVegOption(isVegFood(food));
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!foodName.trim()) return;

    const payload = {
      name: foodName,
      serving: serving || "1 serving",
      protein: Number(protein),
      categoryTag: categoryTag,
      isVeg: isVegOption,
      category: isVegOption ? "veg" : "nonveg"
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

    if (food.category === "dairy" || food.name.toLowerCase().includes("milk") || food.name.toLowerCase().includes("paneer")) {
      return { label: isVeg ? "Dairy (Veg)" : "Dairy", icon: <Milk size={18} color="var(--accent-blue)" />, badgeClass: "muscle-pull" };
    }
    if (food.category === "grains" || food.name.toLowerCase().includes("oats") || food.name.toLowerCase().includes("chana")) {
      return { label: "Grains", icon: <Wheat size={18} color="var(--accent-abs)" />, badgeClass: "muscle-abs" };
    }
    if (food.category === "fruits" || food.name.toLowerCase().includes("banana") || food.name.toLowerCase().includes("apple")) {
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
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
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
          Nutritional Reference Database & Custom Entries
        </p>
      </div>

      <div className="search-toolbar-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div className="premium-input-box" style={{ flex: 1 }}>
          <Search size={18} color="var(--text-secondary)" style={{ marginRight: "10px" }} />
          <input 
            type="text" 
            className="premium-inner-input" 
            placeholder="Search food entries by name..."
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
                        {food.name}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "500" }}>
                        {food.serving}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                    <span style={{ fontSize: "1.3rem", fontWeight: "900", fontFamily: "var(--font-mono)", color: "var(--text-primary)", lineHeight: 1 }}>
                      {food.protein}g
                    </span>
                    <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase", marginTop: "2px", fontWeight: "700" }}>
                      Protein
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions & Category Badge Footer Row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-color)" }}>
                <span className={`exercise-badge-muscle ${meta.badgeClass}`} style={{ fontSize: "0.6rem", margin: 0 }}>
                  {meta.label}
                </span>

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

      {/* Modal Dialog Form */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nothing-card-header" style={{ marginBottom: "16px" }}>
              <span className="nothing-title" style={{ fontSize: "1.1rem" }}>
                {isEditing ? "Edit Food Reference" : "Create New Food Entry"}
              </span>
              <button className="header-action-btn" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>FOOD NAME</label>
                <div className="premium-input-box">
                  <input 
                    type="text" 
                    className="premium-inner-input" 
                    placeholder="e.g. Chicken Breast"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>SERVING SIZE</label>
                <div className="premium-input-box">
                  <input 
                    type="text" 
                    className="premium-inner-input" 
                    placeholder="e.g. 100g or 1 cup"
                    value={serving}
                    onChange={(e) => setServing(e.target.value)}
                    required
                  />
                </div>
              </div>

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
                  <span className="premium-input-unit">grams</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>DIET TYPE</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn-premium-secondary"
                    style={{ flex: 1, height: "44px", background: isVegOption ? "var(--text-primary)" : "transparent", color: isVegOption ? "var(--bg-primary)" : "var(--text-primary)" }}
                    onClick={() => setIsVegOption(true)}
                  >
                    Vegetarian
                  </button>
                  <button
                    type="button"
                    className="btn-premium-secondary"
                    style={{ flex: 1, height: "44px", background: !isVegOption ? "var(--text-primary)" : "transparent", color: !isVegOption ? "var(--bg-primary)" : "var(--text-primary)" }}
                    onClick={() => setIsVegOption(false)}
                  >
                    Non-Veg
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-premium-primary" style={{ marginTop: "10px" }}>
                {isEditing ? "Save Entry Changes" : "Create Reference Item"}
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
