import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggleBtn({ style = {}, className = "header-action-btn" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button 
      type="button"
      className={className}
      onClick={toggleTheme}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        ...style
      }}
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
