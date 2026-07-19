import React, { useState, useEffect } from "react";
import { usePlanner } from "../contexts/PlannerContext";
import { useLocation } from "react-router-dom";
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
  Dumbbell,
  AlertCircle
} from "lucide-react";

const FILTER_CHIPS = [
  { id: "all", label: "All Items", icon: Compass, activeClass: "active-all" },
  { id: "fav", label: "Favorites", icon: Heart, activeClass: "active-fav" },
  { id: "veg", label: "Veg Only", icon: Leaf, activeClass: "active-veg" },
  { id: "nonveg", label: "Non-Veg", icon: Utensils, activeClass: "active-nonveg" },
  { id: "protein", label: "High Protein", icon: Flame, activeClass: "active-protein" },
  { id: "dairy", label: "Dairy", icon: Milk, activeClass: "active-dairy" },
  { id: "grains", label: "Grains", icon: Wheat, activeClass: "active-grains" },
  { id: "fruits", label: "Fruits & Veg", icon: Apple, activeClass: "active-fruits" }
];

export default function FoodReference() {
  const { foodReferences, addFoodRef, editFoodRef, deleteFoodRef } = usePlanner();
  const location = useLocation();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("wegogym_food_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  // Modal Dialog States
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Modal Form States
  const [foodName, setFoodName] = useState("");
  const [serving, setServing] = useState("");
  const [protein, setProtein] = useState(10);
  const [categoryTag, setCategoryTag] = useState("Protein");
  const [isVegOption, setIsVegOption] = useState(true);

  // Sync favorites
  useEffect(() => {
    localStorage.setItem("wegogym_food_favorites", JSON.stringify(favorites));
  }, [favorites]);

  // Handle Ctrl + K inside page or header search trigger redirections
  useEffect(() => {
    if (location.state && location.state.prefilledSearch) {
      setSearchQuery(location.state.prefilledSearch);
      window.history.replaceState({}, document.title);
    }

    const handlePrefill = (e) => {
      if (e.detail?.query) {
        setSearchQuery(e.detail.query);
      }
    };
    window.addEventListener("prefillSearch", handlePrefill);
    return () => window.removeEventListener("prefillSearch", handlePrefill);
  }, [location]);

  const handleToggleFavorite = (id, event) => {
    event.stopPropagation();
    setFavorites((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setFoodName("");
    setServing("");
    setProtein(10);
    setCategoryTag("Protein");
    setIsVegOption(true);
    setModalOpen(true);
  };

  const handleOpenEditModal = (food, event) => {
    event.stopPropagation();
    setIsEditing(true);
    setEditingId(food.id);
    setFoodName(food.name);
    setServing(food.serving);
    setProtein(food.protein);
    
    // Guess category tags based on name matching
    const n = food.name.toLowerCase();
    if (n.includes("milk") || n.includes("paneer") || n.includes("yogurt") || n.includes("cheese")) {
      setCategoryTag("Dairy");
      setIsVegOption(true);
    } else if (n.includes("chicken") || n.includes("egg") || n.includes("beef") || n.includes("fish") || n.includes("meat")) {
      setCategoryTag("Protein");
      setIsVegOption(false);
    } else if (n.includes("oats") || n.includes("bread") || n.includes("rice") || n.includes("grain")) {
      setCategoryTag("Grains");
      setIsVegOption(true);
    } else if (n.includes("banana") || n.includes("apple") || n.includes("berry") || n.includes("salad")) {
      setCategoryTag("Fruits");
      setIsVegOption(true);
    } else {
      setCategoryTag("Other");
      setIsVegOption(true);
    }
    
    setModalOpen(true);
  };

  const handleDelete = async (foodId, event) => {
    event.stopPropagation();
    if (window.confirm("Are you sure you want to delete this food reference?")) {
      await deleteFoodRef(foodId);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!foodName.trim() || !serving.trim() || protein < 0) return;

    if (isEditing) {
      await editFoodRef(editingId, foodName.trim(), serving.trim(), protein);
    } else {
      await addFoodRef(foodName.trim(), serving.trim(), protein);
    }
    setModalOpen(false);
  };

  // Category Icon assign logic
  const getFoodMeta = (name) => {
    const n = name.toLowerCase();
    if (n.includes("milk") || n.includes("paneer") || n.includes("yogurt") || n.includes("cheese") || n.includes("butter")) {
      return { icon: <Milk size={20} color="var(--accent-blue)" />, glowClass: "glow-blue", badgeClass: "muscle-pull", label: "Dairy" };
    }
    if (n.includes("chicken") || n.includes("egg") || n.includes("beef") || n.includes("fish") || n.includes("meat")) {
      return { icon: <Utensils size={20} color="var(--accent-push)" />, glowClass: "glow-red", badgeClass: "muscle-push", label: "Non-Veg" };
    }
    if (n.includes("oats") || n.includes("bread") || n.includes("rice") || n.includes("dal") || n.includes("grain") || n.includes("wheat") || n.includes("roti")) {
      return { icon: <Wheat size={20} color="var(--accent-orange)" />, glowClass: "glow-orange", badgeClass: "muscle-abs", label: "Grains" };
    }
    if (n.includes("banana") || n.includes("apple") || n.includes("grape") || n.includes("berry") || n.includes("salad") || n.includes("vegetable")) {
      return { icon: <Apple size={20} color="var(--accent-success)" />, glowClass: "glow-green", badgeClass: "muscle-legs", label: "Fruits & Veg" };
    }
    return { icon: <Dumbbell size={20} color="var(--accent-protein)" />, glowClass: "glow-purple", badgeClass: "muscle-other", label: "Protein" };
  };

  const matchesCategory = (food, cat) => {
    const name = food.name.toLowerCase();
    const isFav = favorites.includes(food.id);

    const nonVegKeywords = ["chicken", "egg", "fish", "meat", "omelette", "beef", "pork", "turkey"];
    const isNonVeg = nonVegKeywords.some(kw => name.includes(kw));

    switch (cat) {
      case "fav":
        return isFav;
      case "veg":
        return !isNonVeg;
      case "nonveg":
        return isNonVeg;
      case "protein":
        return food.protein >= 15;
      case "dairy":
        return name.includes("milk") || name.includes("paneer") || name.includes("yogurt") || name.includes("cheese") || name.includes("butter");
      case "grains":
        return name.includes("oats") || name.includes("bread") || name.includes("rice") || name.includes("dal") || name.includes("chana") || name.includes("roti") || name.includes("wheat");
      case "fruits":
        return name.includes("banana") || name.includes("apple") || name.includes("berry") || name.includes("grape") || name.includes("salad") || name.includes("vegetable");
      default:
        return true;
    }
  };

  // Filter list
  const filteredReferences = foodReferences.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = matchesCategory(food, activeCategory);
    return matchesSearch && matchesCat;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* Horizontally scrollable category filters chips */}
      <div className="category-filter-bar">
        {FILTER_CHIPS.map((chip) => {
          const ChipIcon = chip.icon;
          const isActive = activeCategory === chip.id;
          return (
            <button
              key={chip.id}
              className={`category-filter-pill ${isActive ? chip.activeClass : ""}`}
              onClick={() => setActiveCategory(chip.id)}
            >
              <ChipIcon size={16} />
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Action Search Toolbar */}
      <div className="search-toolbar-row">
        <div className="premium-input-box" style={{ flex: 1, height: "52px" }}>
          <Search size={20} color="var(--text-secondary)" style={{ marginRight: "10px" }} />
          <input
            type="text"
            className="premium-inner-input"
            placeholder="Search food library items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <kbd className="kbd-hint" style={{ fontSize: "0.65rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>⌘K</kbd>
        </div>
        
        <button 
          className="btn-premium-primary" 
          style={{ padding: "0 24px", height: "52px", borderRadius: "26px", background: "linear-gradient(135deg, var(--text-primary), var(--text-secondary))", color: "var(--bg-primary)" }} 
          onClick={handleOpenAddModal}
        >
          <Plus size={18} /> Add Food
        </button>
      </div>

      {/* Responsive Food Card Grid */}
      <div className="food-grid-layout" style={{ marginTop: "10px" }}>
        <AnimatePresence>
          {filteredReferences.length > 0 ? (
            filteredReferences.map((food) => {
              const isFav = favorites.includes(food.id);
              const meta = getFoodMeta(food.name);
              
              return (
                <motion.div
                  key={food.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`food-library-card ${meta.glowClass}`}
                >
                  {/* Protein value top-right */}
                  <div style={{ position: "absolute", top: "24px", right: "24px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontSize: "1.4rem", fontWeight: "900", fontFamily: "var(--font-mono)", color: "var(--text-primary)", lineHeight: 1 }}>
                      {food.protein}g
                    </span>
                    <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", textTransform: "uppercase", marginTop: "2px", fontWeight: "700" }}>
                      Protein
                    </span>
                  </div>

                  {/* Icon & title rows */}
                  <div className="food-card-top-row">
                    <div className="exercise-icon-box" style={{ width: "42px", height: "42px", flexShrink: 0, borderRadius: "12px", background: "var(--bg-secondary)" }}>
                      {meta.icon}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span style={{ fontSize: "1rem", fontWeight: "800", color: "var(--text-primary)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {food.name}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "500" }}>
                        {food.serving}
                      </span>
                    </div>
                  </div>

                  {/* Actions & category badge footer */}
                  <div>
                    <span className={`exercise-badge-muscle ${meta.badgeClass}`} style={{ fontSize: "0.6rem" }}>
                      {meta.label}
                    </span>

                    <div className="food-card-actions">
                      <button 
                        className={`icon-action-btn fav-btn ${isFav ? "fav-active" : ""}`}
                        onClick={(e) => handleToggleFavorite(food.id, e)}
                        title={isFav ? "Remove favorite" : "Add to favorites"}
                      >
                        <Heart size={15} fill={isFav ? "var(--accent-pr)" : "none"} />
                      </button>
                      
                      <button 
                        className="icon-action-btn edit-btn"
                        onClick={(e) => handleOpenEditModal(food, e)}
                        title="Edit details"
                      >
                        <Edit3 size={15} />
                      </button>
                      
                      <button 
                        className="icon-action-btn delete-btn"
                        onClick={(e) => handleDelete(food.id, e)}
                        title="Delete food entry"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 20px", textAlign: "center" }}>
              <AlertCircle size={40} color="var(--text-muted)" style={{ marginBottom: "16px" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "6px" }}>No foods found</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                We couldn't find any reference matching your active filters or query.
              </p>
              <button 
                className="btn-premium-secondary" 
                style={{ height: "40px", borderRadius: "20px" }}
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
              >
                Clear Search
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Premium Sliding Modal Dialog Form */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ borderRadius: "20px", padding: "28px" }}>
            <div className="nothing-card-header" style={{ marginBottom: "20px" }}>
              <span className="nothing-title">{isEditing ? "Edit Food Entry" : "Create Food Entry"}</span>
              <button className="header-action-btn" onClick={() => setModalOpen(false)}>
                <XIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="ref-form-group">
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>Food Name</label>
                <input
                  type="text"
                  className="nothing-input"
                  style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)", height: "48px", borderRadius: "12px", padding: "0 14px", fontSize: "0.95rem" }}
                  placeholder="e.g. Scrambled Eggs"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  required
                />
              </div>

              <div className="ref-form-group">
                <label className="nothing-label" style={{ fontSize: "0.65rem" }}>Serving Description</label>
                <input
                  type="text"
                  className="nothing-input"
                  style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)", height: "48px", borderRadius: "12px", padding: "0 14px", fontSize: "0.95rem" }}
                  placeholder="e.g. 100g, 2 large"
                  value={serving}
                  onChange={(e) => setServing(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <div className="ref-form-group" style={{ flex: 1 }}>
                  <label className="nothing-label" style={{ fontSize: "0.65rem" }}>Protein (g)</label>
                  <div className="premium-input-box" style={{ height: "48px" }}>
                    <input
                      type="number"
                      className="premium-inner-input"
                      min="0"
                      max="100"
                      value={protein}
                      onChange={(e) => setProtein(parseInt(e.target.value) || 0)}
                      required
                    />
                    <span className="premium-input-unit">grams</span>
                  </div>
                </div>

                <div className="ref-form-group" style={{ flex: 1 }}>
                  <label className="nothing-label" style={{ fontSize: "0.65rem" }}>Category Hint</label>
                  <select
                    className="nothing-input"
                    style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-color)", height: "48px", borderRadius: "12px", padding: "0 12px", outline: "none", fontSize: "0.9rem", color: "var(--text-primary)" }}
                    value={categoryTag}
                    onChange={(e) => setCategoryTag(e.target.value)}
                  >
                    <option value="Protein">Protein</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Grains">Grains</option>
                    <option value="Fruits">Fruits & Veg</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="modal-btn-row" style={{ marginTop: "10px" }}>
                <button type="button" className="btn-premium-secondary" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-premium-primary" style={{ flex: 1 }}>
                  Save Food
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function XIcon({ size }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18M6 6l12 12"/>
    </svg>
  );
}
