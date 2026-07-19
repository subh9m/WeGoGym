import React, { useState, useEffect } from "react";
import { usePlanner } from "../contexts/PlannerContext";
import { motion, AnimatePresence } from "framer-motion";
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
    setIsVegOption(food.isVeg !== undefined ? food.isVeg : true);
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

  const filteredFoods = (foodReferences || []).filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isFav = favorites.includes(food.id);

    if (activeCategory === "fav") return isFav && matchesSearch;
    if (activeCategory === "veg") return food.isVeg && matchesSearch;
    if (activeCategory === "nonveg") return !food.isVeg && matchesSearch;
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
      {/* Search Toolbar & Create Action */}
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
          <Plus size={18} /> Add New Food
        </button>
      </div>

      {/* Category Filter Chips Toolbar */}
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

      {/* Modern Food Cards Grid */}
      <div className="food-grid-layout">
        {filteredFoods.map((food) => {
          const isFav = favorites.includes(food.id);

          return (
            <motion.div 
              key={food.id}
              className="food-library-card"
              whileHover={{ y: -3 }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {food.name}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "600" }}>
                      {food.serving}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
                    <span style={{ fontSize: "1.3rem", fontWeight: "900", fontFamily: "var(--font-mono)", color: "var(--accent-protein)", lineHeight: 1 }}>
                      {food.protein}g
                    </span>
                    <span style={{ fontSize: "0.6rem", color: "var(--text-muted)", textTransform: "uppercase", marginTop: "2px", fontWeight: "700" }}>
                      Protein
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: "12px", display: "flex", gap: "6px" }}>
                  <span style={{ fontSize: "0.7rem", padding: "2px 8px", borderRadius: "8px", background: food.isVeg ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)", color: food.isVeg ? "var(--accent-legs)" : "var(--accent-push)", fontWeight: "700" }}>
                    {food.isVeg ? "Vegetarian" : "Non-Veg"}
                  </span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
                <button 
                  className={`header-action-btn ${isFav ? "active" : ""}`}
                  style={{ width: "36px", height: "36px", color: isFav ? "var(--accent-pr)" : "var(--text-secondary)" }}
                  onClick={(e) => toggleFavorite(food.id, e)}
                  title={isFav ? "Remove favorite" : "Add to favorites"}
                >
                  <Heart size={16} fill={isFav ? "var(--accent-pr)" : "none"} />
                </button>

                <div style={{ display: "flex", gap: "6px" }}>
                  <button 
                    className="header-action-btn"
                    style={{ width: "36px", height: "36px" }}
                    onClick={(e) => handleOpenEdit(food, e)}
                    title="Edit entry"
                  >
                    <Edit3 size={16} />
                  </button>

                  <button 
                    className="header-action-btn"
                    style={{ width: "36px", height: "36px", color: "var(--accent-push)" }}
                    onClick={(e) => { e.stopPropagation(); deleteFoodRef(food.id); }}
                    title="Delete entry"
                  >
                    <Trash2 size={16} />
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
              <span className="nothing-title">
                {isEditing ? "Edit Food Entry" : "Create New Food Entry"}
              </span>
              <button className="header-action-btn" onClick={() => setModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "700" }}>FOOD NAME</label>
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
                <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "700" }}>SERVING SIZE</label>
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
                <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "700" }}>PROTEIN (GRAMS)</label>
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
                <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "700" }}>DIETARY PREFERENCE</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn-premium-secondary"
                    style={{ flex: 1, minHeight: "44px", background: isVegOption ? "rgba(16, 185, 129, 0.15)" : "var(--bg-secondary)", borderColor: isVegOption ? "var(--accent-legs)" : "var(--border-color)", color: isVegOption ? "var(--accent-legs)" : "var(--text-secondary)" }}
                    onClick={() => setIsVegOption(true)}
                  >
                    Vegetarian
                  </button>
                  <button
                    type="button"
                    className="btn-premium-secondary"
                    style={{ flex: 1, minHeight: "44px", background: !isVegOption ? "rgba(239, 68, 68, 0.15)" : "var(--bg-secondary)", borderColor: !isVegOption ? "var(--accent-push)" : "var(--border-color)", color: !isVegOption ? "var(--accent-push)" : "var(--text-secondary)" }}
                    onClick={() => setIsVegOption(false)}
                  >
                    Non-Veg
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-premium-primary" style={{ marginTop: "10px" }}>
                {isEditing ? "Save Changes" : "Create Reference Item"}
              </button>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
