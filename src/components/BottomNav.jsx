import React from "react";
import { NavLink } from "react-router-dom";
import { 
  Home as HomeIcon, 
  Dumbbell, 
  Utensils, 
  Calendar, 
  User as ProfileIcon 
} from "lucide-react";

export default function BottomNav() {
  const menuItems = [
    { name: "Home", path: "/", icon: HomeIcon },
    { name: "Workout", path: "/workout", icon: Dumbbell },
    { name: "Diet", path: "/diet", icon: Utensils },
    { name: "History", path: "/history", icon: Calendar },
    { name: "Profile", path: "/profile", icon: ProfileIcon }
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
