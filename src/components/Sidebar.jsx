import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { usePlanner } from "../contexts/PlannerContext";
import { 
  Dumbbell, 
  Utensils, 
  BookOpen, 
  Calendar, 
  Settings as SettingsIcon, 
  Pencil,
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";

export default function Sidebar() {
  const { profile } = usePlanner();
  const [collapsed, setCollapsed] = useState(false);

  const userName = profile?.name || "User";
  const avatarLetter = userName.charAt(0).toUpperCase();

  const menuItems = [
    { name: "Workout", path: "/", icon: Dumbbell, glowClass: "glow-red" },
    { name: "Edit Routine", path: "/edit-routine", icon: Pencil, glowClass: "glow-orange" },
    { name: "Diet", path: "/diet", icon: Utensils, glowClass: "glow-purple" },
    { name: "Food Library", path: "/food", icon: BookOpen, glowClass: "glow-blue" },
    { name: "History", path: "/history", icon: Calendar, glowClass: "glow-history" },
    { name: "Settings", path: "/settings", icon: SettingsIcon, glowClass: "glow-white" }
  ];

  return (
    <aside className={`desktop-sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!collapsed ? (
          <Link to="/" className="sidebar-logo">
            WeGoGym
          </Link>
        ) : (
          <div style={{ width: "24px" }} />
        )}
        <button 
          className="header-action-btn"
          onClick={() => setCollapsed(!collapsed)}
          style={{ padding: "4px" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""} ${item.glowClass}`}
              title={collapsed ? item.name : undefined}
            >
              <IconComponent size={20} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <Link to="/settings" className="glow-white" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit", width: "100%", padding: "6px", borderRadius: "8px" }}>
          <div className="avatar-circle" style={{ flexShrink: 0 }}>
            {avatarLetter}
          </div>
          {!collapsed && (
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {userName}
              </span>
              <span className="nothing-label" style={{ fontSize: "0.6rem", textTransform: "none", color: "var(--text-secondary)" }}>
                View Settings
              </span>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
