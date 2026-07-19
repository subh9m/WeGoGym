import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { usePlanner } from "../contexts/PlannerContext";
import { 
  Home as HomeIcon,
  Dumbbell, 
  Utensils, 
  BookOpen, 
  Calendar, 
  User as ProfileIcon, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";

export default function Sidebar() {
  const { profile } = usePlanner();
  const [collapsed, setCollapsed] = useState(false);

  const userName = profile?.name || "Athlete";
  const avatarLetter = userName.charAt(0).toUpperCase();

  const menuItems = [
    { name: "Home", path: "/", icon: HomeIcon },
    { name: "Workout", path: "/workout", icon: Dumbbell },
    { name: "Diet", path: "/diet", icon: Utensils },
    { name: "Food Library", path: "/food", icon: BookOpen },
    { name: "History", path: "/history", icon: Calendar },
    { name: "Profile", path: "/profile", icon: ProfileIcon }
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
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              title={collapsed ? item.name : undefined}
            >
              <IconComponent size={20} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <Link to="/profile" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit", width: "100%", padding: "6px", borderRadius: "8px" }}>
          <div className="avatar-circle" style={{ flexShrink: 0 }}>
            {avatarLetter}
          </div>
          {!collapsed && (
            <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {userName}
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                View Profile
              </span>
            </div>
          )}
        </Link>
      </div>
    </aside>
  );
}
