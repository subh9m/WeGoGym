import React from "react";
import { NavLink } from "react-router-dom";
import { 
  Dumbbell, 
  Utensils, 
  BookOpen, 
  Calendar, 
  Settings as SettingsIcon 
} from "lucide-react";

export default function BottomNav() {
  const menuItems = [
    { name: "Workout", path: "/", icon: Dumbbell },
    { name: "Diet", path: "/diet", icon: Utensils },
    { name: "Food", path: "/food", icon: BookOpen },
    { name: "History", path: "/history", icon: Calendar },
    { name: "Settings", path: "/settings", icon: SettingsIcon }
  ];

  return (
    <nav className="mobile-nav-bar">
      <div className="mobile-nav-inner">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => `mobile-nav-link ${isActive ? "active" : ""}`}
            >
              <IconComponent size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
